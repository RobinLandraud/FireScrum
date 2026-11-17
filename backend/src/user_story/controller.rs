use sea_orm::ConnectionTrait;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::model;
use crate::error::AppError;
use crate::project::model::PROJECT_ID;
use crate::sprint;
use crate::task::{
    self,
    controller::{NewTask, TaskOut},
};

const FIBONACCI: [i32; 7] = [1, 2, 3, 5, 8, 13, 21];

/// Status of a US, computed (not stored).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum UserStoryStatus {
    /// Sandbox: not validated yet.
    #[default]
    Pending,
    /// Validated, outside the active sprint.
    Planned,
    /// In the active sprint.
    InProgress,
    Done,
}

impl UserStoryStatus {
    pub fn of(done: bool, in_active_sprint: bool, validated: bool) -> Self {
        if done {
            Self::Done
        } else if in_active_sprint {
            Self::InProgress
        } else if validated {
            Self::Planned
        } else {
            Self::Pending
        }
    }
}

#[derive(Serialize, Deserialize, TS)]
#[ts(export)]
pub struct UserStoryOut {
    pub id: i64,
    pub feature_id: Option<i64>,
    pub title: String,
    pub description: String,
    pub velocity: i32,
    pub validated: bool,
    pub done: bool,
    /// Missing from snapshots of sprints closed before it was added.
    #[serde(default)]
    pub status: UserStoryStatus,
    pub tasks: Vec<TaskOut>,
}

impl UserStoryOut {
    pub fn new(s: model::Model, in_active_sprint: bool, tasks: Vec<TaskOut>) -> Self {
        Self {
            status: UserStoryStatus::of(s.done, in_active_sprint, s.validated),
            id: s.id,
            feature_id: s.feature_id,
            title: s.title,
            description: s.description,
            velocity: s.velocity,
            validated: s.validated,
            done: s.done,
            tasks,
        }
    }
}

/// USs with their tasks (and the validation points of each task).
pub async fn serialize_many(
    db: &impl ConnectionTrait,
    stories: Vec<model::Model>,
) -> Result<Vec<UserStoryOut>, AppError> {
    let ids: Vec<i64> = stories.iter().map(|s| s.id).collect();
    let mut tasks = task::controller::by_user_story(db, &ids).await?;
    let in_sprint = sprint::model::active_user_story_ids(db, PROJECT_ID).await?;
    Ok(stories
        .into_iter()
        .map(|s| {
            let t = tasks.remove(&s.id).unwrap_or_default();
            let in_active_sprint = in_sprint.contains(&s.id);
            UserStoryOut::new(s, in_active_sprint, t)
        })
        .collect())
}

#[derive(Deserialize, TS)]
#[ts(export)]
pub struct UserStoryUpdate {
    pub title: String,
    #[serde(default)]
    pub description: String,
    pub velocity: i32,
    /// Optional: `null` for a US without a feature.
    #[serde(default)]
    pub feature_id: Option<i64>,
}

impl UserStoryUpdate {
    pub fn validate(&self) -> Result<(), AppError> {
        if self.title.trim().is_empty() {
            return Err(AppError::BadRequest("le titre est requis".into()));
        }
        if !FIBONACCI.contains(&self.velocity) {
            return Err(AppError::BadRequest(format!(
                "la vélocité doit être une de ces valeurs : {FIBONACCI:?}"
            )));
        }
        Ok(())
    }
}

/// Creation: the US fields and at least one task, created together.
#[derive(Deserialize, TS)]
#[ts(export)]
pub struct NewUserStory {
    #[serde(flatten)]
    pub story: UserStoryUpdate,
    pub tasks: Vec<NewTask>,
}

impl NewUserStory {
    pub fn validate(&self) -> Result<(), AppError> {
        self.story.validate()?;
        if self.tasks.is_empty() {
            return Err(AppError::BadRequest("une US doit avoir au moins une tâche".into()));
        }
        self.tasks.iter().try_for_each(NewTask::validate)
    }
}

#[derive(Deserialize, TS)]
#[ts(export)]
pub struct FeatureUpdate {
    /// `null` to remove the US from its feature.
    pub feature_id: Option<i64>,
}

/// 404 if the US does not exist, 409 if it is finished: a finished US and its tasks can no longer be edited.
pub async fn ensure_editable(db: &impl ConnectionTrait, id: i64) -> Result<(), AppError> {
    if model::get(db, id).await?.done {
        return Err(AppError::Conflict("cette US est terminée : elle ne se modifie plus".into()));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::UserStoryStatus::{self, *};

    #[test]
    fn status_of() {
        assert_eq!(UserStoryStatus::of(true, false, true), Done);
        assert_eq!(UserStoryStatus::of(false, true, true), InProgress);
        assert_eq!(UserStoryStatus::of(false, false, true), Planned);
        assert_eq!(UserStoryStatus::of(false, false, false), Pending);
    }
}
