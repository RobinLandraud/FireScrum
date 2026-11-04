use sea_orm::entity::prelude::*;
use sea_orm::{QueryOrder, Set};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "feature")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub project_id: i64,
    pub title: String,
    pub description: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

pub async fn for_project(db: &impl ConnectionTrait, project_id: i64) -> Result<Vec<Model>, DbErr> {
    Entity::find()
        .filter(Column::ProjectId.eq(project_id))
        .order_by_asc(Column::Id)
        .all(db)
        .await
}

pub async fn create(
    db: &impl ConnectionTrait,
    project_id: i64,
    title: &str,
    description: &str,
) -> Result<Model, DbErr> {
    ActiveModel {
        project_id: Set(project_id),
        title: Set(title.to_owned()),
        description: Set(description.to_owned()),
        ..Default::default()
    }
    .insert(db)
    .await
}

/// `DbErr::RecordNotUpdated` si la feature n'existe pas.
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
