use sea_orm::entity::prelude::*;
use sea_orm::{PaginatorTrait, QueryOrder, Set};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "validation_point")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub task_id: i64,
    pub label: String,
    pub checked: bool,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

pub async fn for_tasks(db: &impl ConnectionTrait, task_ids: &[i64]) -> Result<Vec<Model>, DbErr> {
    Entity::find()
        .filter(Column::TaskId.is_in(task_ids.iter().copied()))
        .order_by_asc(Column::Id)
        .all(db)
        .await
}

pub async fn create(db: &impl ConnectionTrait, task_id: i64, label: &str) -> Result<Model, DbErr> {
    ActiveModel {
        task_id: Set(task_id),
        label: Set(label.to_owned()),
        ..Default::default()
    }
    .insert(db)
    .await
}

/// `DbErr::RecordNotUpdated` si le point n'existe pas.
pub async fn set_checked(db: &impl ConnectionTrait, id: i64, checked: bool) -> Result<(), DbErr> {
    ActiveModel { id: Set(id), checked: Set(checked), ..Default::default() }
        .update(db)
        .await?;
    Ok(())
}

pub async fn count_unchecked(db: &impl ConnectionTrait, task_id: i64) -> Result<u64, DbErr> {
    Entity::find()
        .filter(Column::TaskId.eq(task_id))
        .filter(Column::Checked.eq(false))
        .count(db)
        .await
}

pub async fn delete_many(db: &impl ConnectionTrait, ids: &[i64]) -> Result<(), DbErr> {
    if ids.is_empty() {
        return Ok(());
    }
    Entity::delete_many().filter(Column::Id.is_in(ids.iter().copied())).exec(db).await?;
    Ok(())
}

pub async fn get(db: &impl ConnectionTrait, id: i64) -> Result<Model, DbErr> {
    Entity::find_by_id(id)
        .one(db)
        .await?
        .ok_or(DbErr::RecordNotFound("validation_point".into()))
}
