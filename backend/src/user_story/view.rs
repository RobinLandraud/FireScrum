use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use sea_orm::{DatabaseConnection, TransactionTrait};

use super::controller::{self, FeatureUpdate, NewUserStory, UserStoryOut, UserStoryUpdate};
use super::model;
use crate::error::AppError;
use crate::project::model::PROJECT_ID;
use crate::task;

/// Toutes les US du projet (avec leurs tâches), avec ou sans feature.
pub async fn list(State(db): State<DatabaseConnection>) -> Result<Json<Vec<UserStoryOut>>, AppError> {
    let stories = model::for_project(&db, PROJECT_ID).await?;
    Ok(Json(controller::serialize_many(&db, stories).await?))
}

/// Crée l'US et ses tâches dans une même transaction. 404 si `feature_id` ne correspond à aucune feature.
pub async fn create(
    State(db): State<DatabaseConnection>,
    Json(body): Json<NewUserStory>,
) -> Result<(StatusCode, Json<UserStoryOut>), AppError> {
    body.validate()?;
    let s = &body.story;
    let txn = db.begin().await?;
    let story = model::create(&txn, PROJECT_ID, s.feature_id, s.title.trim(), &s.description, s.velocity).await?;
    for t in &body.tasks {
        task::model::create_with_points(&txn, story.id, t.title.trim(), t.description.trim(), &t.validation_points)
            .await?;
    }
    txn.commit().await?;
    let mut out = controller::serialize_many(&db, vec![story]).await?;
    Ok((StatusCode::CREATED, Json(out.remove(0))))
}

/// 404 si l'US ou la feature n'existe pas, 409 si l'US est terminée.
pub async fn update(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i64>,
    Json(body): Json<UserStoryUpdate>,
) -> Result<StatusCode, AppError> {
    body.validate()?;
    controller::ensure_editable(&db, id).await?;
    model::update(&db, id, body.feature_id, body.title.trim(), &body.description, body.velocity).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn validate(State(db): State<DatabaseConnection>, Path(id): Path<i64>) -> Result<StatusCode, AppError> {
    model::validate(&db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// 404 si l'US ou la feature n'existe pas, 409 si l'US est terminée.
pub async fn set_feature(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i64>,
    Json(body): Json<FeatureUpdate>,
) -> Result<StatusCode, AppError> {
    controller::ensure_editable(&db, id).await?;
    model::set_feature(&db, id, body.feature_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
