use axum::{Json, extract::State};
use sea_orm::DatabaseConnection;

use super::controller::ProjectOut;
use super::model::{self, PROJECT_ID};
use crate::error::AppError;

pub async fn get(State(db): State<DatabaseConnection>) -> Result<Json<ProjectOut>, AppError> {
    Ok(Json(model::get(&db, PROJECT_ID).await?.into()))
}
