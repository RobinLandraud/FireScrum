use sea_orm::entity::prelude::*;
use sea_orm::{QueryOrder, Set};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Clone, Copy, Debug, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, TS)]
#[ts(export)]
#[sea_orm(rs_type = "String", db_type = "Text")]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    #[sea_orm(string_value = "todo")]
    Todo,
    #[sea_orm(string_value = "in_progress")]
    InProgress,
    #[sea_orm(string_value = "in_review")]
    InReview,
    #[sea_orm(string_value = "done")]
    Done,
}

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "task")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub user_story_id: i64,
    pub title: String,
    pub description: String,
    pub status: TaskStatus,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

pub async fn for_user_stories(db: &impl ConnectionTrait, user_story_ids: &[i64]) -> Result<Vec<Model>, DbErr> {
    Entity::find()
        .filter(Column::UserStoryId.is_in(user_story_ids.iter().copied()))
        .order_by_asc(Column::Id)
        .all(db)
        .await
}

pub async fn create(
    db: &impl ConnectionTrait,
    user_story_id: i64,
    title: &str,
    description: &str,
) -> Result<Model, DbErr> {
    ActiveModel {
        user_story_id: Set(user_story_id),
        title: Set(title.to_owned()),
        description: Set(description.to_owned()),
        ..Default::default()
    }
    .insert(db)
    .await
}

/// `DbErr::RecordNotUpdated` si la tâche n'existe pas.
pub async fn set_status(db: &impl ConnectionTrait, id: i64, status: TaskStatus) -> Result<(), DbErr> {
    ActiveModel { id: Set(id), status: Set(status), ..Default::default() }
        .update(db)
        .await?;
    Ok(())
}

pub async fn get(db: &impl ConnectionTrait, id: i64) -> Result<Model, DbErr> {
    Entity::find_by_id(id)
        .one(db)
        .await?
        .ok_or(DbErr::RecordNotFound("task".into()))
}

pub async fn update(db: &impl ConnectionTrait, id: i64, title: &str, description: &str) -> Result<(), DbErr> {
    ActiveModel {
        id: Set(id),
        title: Set(title.to_owned()),
        description: Set(description.to_owned()),
        ..Default::default()
    }
    .update(db)
    .await?;
    Ok(())
}

/// Supprime la tâche et ses points de validation (cascade en base).
pub async fn delete(db: &impl ConnectionTrait, id: i64) -> Result<(), DbErr> {
    let result = Entity::delete_by_id(id).exec(db).await?;
    if result.rows_affected == 0 {
        return Err(DbErr::RecordNotFound("task".into()));
    }
    Ok(())
}

/// Crée la tâche et ses points de validation.
pub async fn create_with_points(
    db: &impl ConnectionTrait,
    user_story_id: i64,
    title: &str,
    description: &str,
    labels: &[String],
) -> Result<(Model, Vec<crate::validation_point::model::Model>), DbErr> {
    let task = create(db, user_story_id, title, description).await?;
    let mut points = Vec::new();
    for label in labels {
        points.push(crate::validation_point::model::create(db, task.id, label).await?);
    }
    Ok((task, points))
}
