use sea_orm::entity::prelude::*;
use sea_orm::{PaginatorTrait, QueryOrder, Set, sea_query::Expr};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "user_story")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub project_id: i64,
    pub feature_id: Option<i64>,
    pub title: String,
    pub description: String,
    pub velocity: i32,
    pub validated: bool,
    /// Passe à true quand le PO la coche comme finie à la clôture d'un sprint.
    pub done: bool,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

pub async fn for_features(db: &impl ConnectionTrait, feature_ids: &[i64]) -> Result<Vec<Model>, DbErr> {
    Entity::find()
        .filter(Column::FeatureId.is_in(feature_ids.iter().copied()))
        .order_by_asc(Column::Id)
        .all(db)
        .await
}

/// Toutes les US du projet, avec ou sans feature.
pub async fn for_project(db: &impl ConnectionTrait, project_id: i64) -> Result<Vec<Model>, DbErr> {
    Entity::find()
        .filter(Column::ProjectId.eq(project_id))
        .order_by_asc(Column::Id)
        .all(db)
        .await
}

pub async fn by_ids(db: &impl ConnectionTrait, ids: &[i64]) -> Result<Vec<Model>, DbErr> {
    Entity::find()
        .filter(Column::Id.is_in(ids.iter().copied()))
        .order_by_asc(Column::Id)
        .all(db)
        .await
}

pub async fn create(
    db: &impl ConnectionTrait,
    project_id: i64,
    feature_id: Option<i64>,
    title: &str,
    description: &str,
    velocity: i32,
) -> Result<Model, DbErr> {
    ActiveModel {
        project_id: Set(project_id),
        feature_id: Set(feature_id),
        title: Set(title.to_owned()),
        description: Set(description.to_owned()),
        velocity: Set(velocity),
        ..Default::default()
    }
    .insert(db)
    .await
}

/// Remplace les champs modifiables de l'US. `DbErr::RecordNotUpdated` si l'US n'existe pas.
pub async fn update(
    db: &impl ConnectionTrait,
    id: i64,
    feature_id: Option<i64>,
    title: &str,
    description: &str,
    velocity: i32,
) -> Result<(), DbErr> {
    ActiveModel {
        id: Set(id),
        feature_id: Set(feature_id),
        title: Set(title.to_owned()),
        description: Set(description.to_owned()),
        velocity: Set(velocity),
        ..Default::default()
    }
    .update(db)
    .await?;
    Ok(())
}

/// `DbErr::RecordNotUpdated` si l'US n'existe pas.
pub async fn validate(db: &impl ConnectionTrait, id: i64) -> Result<(), DbErr> {
    ActiveModel { id: Set(id), validated: Set(true), ..Default::default() }
        .update(db)
        .await?;
    Ok(())
}

/// Associe l'US à une feature, ou la retire de sa feature (`None`). `DbErr::RecordNotUpdated` si l'US n'existe pas.
pub async fn set_feature(db: &impl ConnectionTrait, id: i64, feature_id: Option<i64>) -> Result<(), DbErr> {
    ActiveModel { id: Set(id), feature_id: Set(feature_id), ..Default::default() }
        .update(db)
        .await?;
    Ok(())
}

/// Nombre d'US parmi `ids` qui peuvent entrer dans un sprint (validées et non terminées).
pub async fn count_launchable(db: &impl ConnectionTrait, ids: &[i64]) -> Result<u64, DbErr> {
    Entity::find()
        .filter(Column::Id.is_in(ids.iter().copied()))
        .filter(Column::Validated.eq(true))
        .filter(Column::Done.eq(false))
        .count(db)
        .await
}

pub async fn mark_done(db: &impl ConnectionTrait, ids: &[i64]) -> Result<(), DbErr> {
    Entity::update_many()
        .col_expr(Column::Done, Expr::value(true))
        .filter(Column::Id.is_in(ids.iter().copied()))
        .exec(db)
        .await?;
    Ok(())
}

/// Rattache à la feature celles des US `ids` qui n'ont pas encore de feature. Renvoie le nombre d'US rattachées.
pub async fn assign_unassigned(db: &impl ConnectionTrait, ids: &[i64], feature_id: i64) -> Result<u64, DbErr> {
    let result = Entity::update_many()
        .col_expr(Column::FeatureId, Expr::value(feature_id))
        .filter(Column::Id.is_in(ids.iter().copied()))
        .filter(Column::FeatureId.is_null())
        .filter(Column::Done.eq(false))
        .exec(db)
        .await?;
    Ok(result.rows_affected)
}

pub async fn get(db: &impl ConnectionTrait, id: i64) -> Result<Model, DbErr> {
    Entity::find_by_id(id)
        .one(db)
        .await?
        .ok_or(DbErr::RecordNotFound("user_story".into()))
}
