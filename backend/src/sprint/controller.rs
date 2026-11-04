use std::collections::HashMap;

use sea_orm::{ConnectionTrait, DatabaseConnection, DbErr};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::model::{self, SprintOutcome, SprintStatus};
use crate::error::AppError;
use crate::project::model::PROJECT_ID;
use crate::user_story::{self, controller::UserStoryOut};

#[derive(Serialize, TS)]
#[ts(export)]
pub struct SprintOut {
    pub id: i64,
    pub name: String,
    pub status: SprintStatus,
}

impl From<model::Model> for SprintOut {
    fn from(s: model::Model) -> Self {
        Self { id: s.id, name: s.name, status: s.status }
    }
}

#[derive(Serialize, TS)]
#[ts(export)]
pub struct SprintUserStoryOut {
    #[serde(flatten)]
    pub story: UserStoryOut,
    /// `null` tant que le sprint est en cours, puis le sort choisi par le PO à la clôture.
    pub outcome: Option<SprintOutcome>,
}

#[derive(Serialize, TS)]
#[ts(export)]
pub struct SprintDetailOut {
    #[serde(flatten)]
    pub sprint: SprintOut,
    pub total_velocity: i32,
    pub user_stories: Vec<SprintUserStoryOut>,
}

/// Sprint en cours : US et tâches actuelles. Sprint clos : photo prise à la clôture.
pub async fn detail(db: &DatabaseConnection, id: i64) -> Result<SprintDetailOut, AppError> {
    let sprint = model::get(db, id).await?;
    let links = model::user_story_links(db, id).await?;

    let live_ids: Vec<i64> = links.iter().filter(|l| l.snapshot.is_none()).map(|l| l.user_story_id).collect();
    let live = user_story::model::by_ids(db, &live_ids).await?;
    let mut live: HashMap<i64, UserStoryOut> =
        user_story::controller::serialize_many(db, live).await?.into_iter().map(|s| (s.id, s)).collect();

    let mut user_stories = Vec::new();
    for link in links {
        let story = match link.snapshot {
            Some(json) => serde_json::from_value(json).map_err(|e| AppError::Database(DbErr::Json(e.to_string())))?,
            None => live.remove(&link.user_story_id).ok_or(AppError::NotFound)?,
        };
        user_stories.push(SprintUserStoryOut { story, outcome: link.outcome });
    }
    user_stories.sort_by_key(|s| s.story.id);

    Ok(SprintDetailOut {
        sprint: sprint.into(),
        total_velocity: user_stories.iter().map(|s| s.story.velocity).sum(),
        user_stories,
    })
}

#[derive(Deserialize, TS)]
#[ts(export)]
pub struct NewSprint {
    pub name: String,
    #[serde(default)]
    pub user_story_ids: Vec<i64>,
}

impl NewSprint {
    /// Un seul sprint en cours, au moins une US, et seules des US validées et non terminées peuvent y entrer.
    pub async fn validate(&mut self, db: &impl ConnectionTrait) -> Result<(), AppError> {
        if self.name.trim().is_empty() {
            return Err(AppError::BadRequest("le nom est requis".into()));
        }
        if model::active(db, PROJECT_ID).await?.is_some() {
            return Err(AppError::Conflict("un sprint est déjà en cours".into()));
        }
        self.user_story_ids.sort_unstable();
        self.user_story_ids.dedup();
        if self.user_story_ids.is_empty() {
            return Err(AppError::BadRequest("un sprint doit contenir au moins une US".into()));
        }
        let launchable = user_story::model::count_launchable(db, &self.user_story_ids).await?;
        if launchable != self.user_story_ids.len() as u64 {
            return Err(AppError::BadRequest(
                "les US doivent exister, être validées et ne pas être terminées".into(),
            ));
        }
        Ok(())
    }
}

/// Clôture : les US closes sont terminées, les US reportées seront pré-cochées au prochain lancement,
/// les autres retournent au backlog.
#[derive(Deserialize, TS)]
#[ts(export)]
pub struct CloseSprint {
    #[serde(default)]
    pub closed_user_story_ids: Vec<i64>,
    #[serde(default)]
    pub carried_user_story_ids: Vec<i64>,
}

impl CloseSprint {
    /// Sprint en cours (409), US du sprint (400), une US ne peut pas être à la fois close et reportée (400).
    pub async fn validate(&self, db: &impl ConnectionTrait, sprint_id: i64) -> Result<(), AppError> {
        if model::get(db, sprint_id).await?.status != SprintStatus::Active {
            return Err(AppError::Conflict("ce sprint est déjà clôturé".into()));
        }
        if self.closed_user_story_ids.iter().any(|id| self.carried_user_story_ids.contains(id)) {
            return Err(AppError::BadRequest("une US ne peut pas être à la fois close et reportée".into()));
        }
        let in_sprint: Vec<i64> = model::user_story_links(db, sprint_id).await?.iter().map(|l| l.user_story_id).collect();
        if self.closed_user_story_ids.iter().chain(&self.carried_user_story_ids).any(|id| !in_sprint.contains(id)) {
            return Err(AppError::BadRequest("les US doivent faire partie du sprint".into()));
        }
        Ok(())
    }

    /// Sort d'une US du sprint selon les listes reçues.
    pub fn outcome(&self, user_story_id: i64) -> SprintOutcome {
        if self.closed_user_story_ids.contains(&user_story_id) {
            SprintOutcome::Closed
        } else if self.carried_user_story_ids.contains(&user_story_id) {
            SprintOutcome::Carried
        } else {
            SprintOutcome::Returned
        }
    }
}
