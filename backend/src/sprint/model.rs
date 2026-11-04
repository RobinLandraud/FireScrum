use sea_orm::entity::prelude::*;
use sea_orm::{QueryOrder, Set};
use serde::Serialize;
use ts_rs::TS;


#[derive(Clone, Copy, Debug, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, TS)]
#[ts(export)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum SprintStatus {
    #[sea_orm(string_value = "active")]
    Active,
    #[sea_orm(string_value = "closed")]
    Closed,
}

/// Sort d'une US à la clôture du sprint.
#[derive(Clone, Copy, Debug, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, TS)]
#[ts(export)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum SprintOutcome {
    /// Terminée.
    #[sea_orm(string_value = "closed")]
    Closed,
    /// Reportée : pré-cochée au lancement du sprint suivant.
    #[sea_orm(string_value = "carried")]
    Carried,
    /// Retournée au backlog (onglet Accepted).
    #[sea_orm(string_value = "returned")]
    Returned,
}

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "sprint")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub status: SprintStatus,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

/// Table de liaison sprint ↔ US. Une US reportée apparaît dans plusieurs sprints :
/// `outcome = Carried` dans l'ancien, `None` dans le sprint en cours.
pub mod sprint_user_story {
    use sea_orm::entity::prelude::*;

    use super::SprintOutcome;

    #[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
    #[sea_orm(table_name = "sprint_user_story")]
    pub struct Model {
        #[sea_orm(primary_key, auto_increment = false)]
        pub sprint_id: i64,
        #[sea_orm(primary_key, auto_increment = false)]
        pub user_story_id: i64,
        pub outcome: Option<SprintOutcome>,
        /// Photo de l'US et de ses tâches à la clôture (`UserStoryOut` en JSON).
        pub snapshot: Option<Json>,
    }

    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {
        #[sea_orm(
            belongs_to = "crate::user_story::model::Entity",
            from = "Column::UserStoryId",
            to = "crate::user_story::model::Column::Id"
        )]
        UserStory,
    }

    impl Related<crate::user_story::model::Entity> for Entity {
        fn to() -> RelationDef {
            Relation::UserStory.def()
        }
    }

    impl ActiveModelBehavior for ActiveModel {}
}

pub async fn for_project(db: &impl ConnectionTrait, project_id: i64) -> Result<Vec<Model>, DbErr> {
    Entity::find()
        .filter(Column::ProjectId.eq(project_id))
        .order_by_desc(Column::Id)
        .all(db)
        .await
}

pub async fn get(db: &impl ConnectionTrait, id: i64) -> Result<Model, DbErr> {
    Entity::find_by_id(id)
        .one(db)
        .await?
        .ok_or(DbErr::RecordNotFound("sprint".into()))
}

pub async fn active(db: &impl ConnectionTrait, project_id: i64) -> Result<Option<Model>, DbErr> {
    Entity::find()
        .filter(Column::ProjectId.eq(project_id))
        .filter(Column::Status.eq(SprintStatus::Active))
        .one(db)
        .await
}

pub async fn create(db: &impl ConnectionTrait, project_id: i64, name: &str) -> Result<Model, DbErr> {
    ActiveModel {
        project_id: Set(project_id),
        name: Set(name.to_owned()),
        status: Set(SprintStatus::Active),
        ..Default::default()
    }
    .insert(db)
    .await
}

pub async fn close(db: &impl ConnectionTrait, id: i64) -> Result<(), DbErr> {
    ActiveModel { id: Set(id), status: Set(SprintStatus::Closed), ..Default::default() }
        .update(db)
        .await?;
    Ok(())
}

pub async fn add_user_stories(db: &impl ConnectionTrait, sprint_id: i64, user_story_ids: &[i64]) -> Result<(), DbErr> {
    if user_story_ids.is_empty() {
        return Ok(());
    }
    let links = user_story_ids.iter().map(|&user_story_id| sprint_user_story::ActiveModel {
        sprint_id: Set(sprint_id),
        user_story_id: Set(user_story_id),
        outcome: Set(None),
        snapshot: Set(None),
    });
    sprint_user_story::Entity::insert_many(links).exec_without_returning(db).await?;
    Ok(())
}

/// Ids des US du sprint en cours (vide sans sprint en cours).
pub async fn active_user_story_ids(db: &impl ConnectionTrait, project_id: i64) -> Result<Vec<i64>, DbErr> {
    let Some(sprint) = active(db, project_id).await? else {
        return Ok(Vec::new());
    };
    Ok(user_story_links(db, sprint.id).await?.into_iter().map(|l| l.user_story_id).collect())
}

/// Liens du sprint avec ses US (sort et photo).
pub async fn user_story_links(db: &impl ConnectionTrait, sprint_id: i64) -> Result<Vec<sprint_user_story::Model>, DbErr> {
    sprint_user_story::Entity::find()
        .filter(sprint_user_story::Column::SprintId.eq(sprint_id))
        .all(db)
        .await
}

/// Enregistre le sort de l'US dans ce sprint et sa photo.
pub async fn set_outcome(
    db: &impl ConnectionTrait,
    sprint_id: i64,
    user_story_id: i64,
    outcome: SprintOutcome,
    snapshot: Json,
) -> Result<(), DbErr> {
    sprint_user_story::ActiveModel {
        sprint_id: Set(sprint_id),
        user_story_id: Set(user_story_id),
        outcome: Set(Some(outcome)),
        snapshot: Set(Some(snapshot)),
    }
    .update(db)
    .await?;
    Ok(())
}
