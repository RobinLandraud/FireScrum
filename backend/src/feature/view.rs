use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use sea_orm::{DatabaseConnection, TransactionTrait};

use super::controller::{self, FeatureDetails, FeatureOut, NewFeature};
use super::model;
use crate::error::AppError;
use crate::project::model::PROJECT_ID;
use crate::user_story;

/// Backlog complet : features > US > tâches > points de validation.
pub async fn list(State(db): State<DatabaseConnection>) -> Result<Json<Vec<FeatureOut>>, AppError> {
    let features = model::for_project(&db, PROJECT_ID).await?;
    Ok(Json(controller::serialize_many(&db, features).await?))
}

/// Crée la feature et y rattache les US choisies, dans une même transaction.
/// 400 si une de ces US n'existe pas ou a déjà une feature.
pub async fn create(
    State(db): State<DatabaseConnection>,
    Json(mut body): Json<NewFeature>,
) -> Result<(StatusCode, Json<FeatureOut>), AppError> {
    body.details.validate()?;
    body.user_story_ids.sort_unstable();
    body.user_story_ids.dedup();

    let txn = db.begin().await?;
    let feature = model::create(&txn, PROJECT_ID, body.details.title.trim(), &body.details.description).await?;
    let assigned = user_story::model::assign_unassigned(&txn, &body.user_story_ids, feature.id).await?;
    if assigned != body.user_story_ids.len() as u64 {
        return Err(AppError::BadRequest("les US doivent exister, ne pas avoir de feature et ne pas être terminées".into()));
    }
    txn.commit().await?;

    let mut out = controller::serialize_many(&db, vec![feature]).await?;
    Ok((StatusCode::CREATED, Json(out.remove(0))))
}

/// 404 si la feature n'existe pas.
pub async fn update(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i64>,
    Json(body): Json<FeatureDetails>,
) -> Result<StatusCode, AppError> {
    body.validate()?;
    model::update(&db, id, body.title.trim(), &body.description).await?;
    Ok(StatusCode::NO_CONTENT)
}
