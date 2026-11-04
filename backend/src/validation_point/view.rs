use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use sea_orm::DatabaseConnection;

use super::controller::PointUpdate;
use super::model;
use crate::error::AppError;
use crate::task::{self, model::TaskStatus};
use crate::user_story;

/// 404 si le point n'existe pas, 409 si l'US est terminée ou si on décoche un point d'une tâche Terminé.
pub async fn update(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i64>,
    Json(body): Json<PointUpdate>,
) -> Result<StatusCode, AppError> {
    let point = model::get(&db, id).await?;
    let task = task::model::get(&db, point.task_id).await?;
    user_story::controller::ensure_editable(&db, task.user_story_id).await?;
    if !body.checked && task.status == TaskStatus::Done {
        return Err(AppError::Conflict("Sors d'abord la tâche de Terminé.".into()));
    }
    model::set_checked(&db, id, body.checked).await?;
    Ok(StatusCode::NO_CONTENT)
}
