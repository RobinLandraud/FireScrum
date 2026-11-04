use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use sea_orm::{DatabaseConnection, TransactionTrait};

use super::controller::{NewTask, StatusUpdate, TaskOut};
use super::model::{self, TaskStatus};
use crate::error::AppError;
use crate::{user_story, validation_point};

pub async fn create(
    State(db): State<DatabaseConnection>,
    Path(user_story_id): Path<i64>,
    Json(body): Json<NewTask>,
) -> Result<(StatusCode, Json<TaskOut>), AppError> {
    body.validate()?;
    user_story::controller::ensure_editable(&db, user_story_id).await?;
    let txn = db.begin().await?;
    let (task, points) = model::create_with_points(
        &txn,
        user_story_id,
        body.title.trim(),
        body.description.trim(),
        &body.validation_points,
    )
    .await?;
    txn.commit().await?;
    Ok((StatusCode::CREATED, Json(TaskOut::new(task, points.into_iter().map(Into::into).collect()))))
}

/// Même corps que la création. Les points sont synchronisés par libellé : un point conservé garde son état
/// coché, un point retiré est supprimé, un nouveau libellé crée un point non coché.
/// 404 si la tâche n'existe pas, 409 si on ajoute un point à une tâche terminée ou si son US est terminée.
pub async fn update(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i64>,
    Json(body): Json<NewTask>,
) -> Result<StatusCode, AppError> {
    body.validate()?;
    let txn = db.begin().await?;
    let task = model::get(&txn, id).await?;
    user_story::controller::ensure_editable(&txn, task.user_story_id).await?;
    let existing = validation_point::model::for_tasks(&txn, &[id]).await?;

    let removed: Vec<i64> =
        existing.iter().filter(|p| !body.validation_points.contains(&p.label)).map(|p| p.id).collect();
    let mut added: Vec<&String> =
        body.validation_points.iter().filter(|l| !existing.iter().any(|p| &p.label == *l)).collect();
    added.dedup();
    if task.status == TaskStatus::Done && !added.is_empty() {
        return Err(AppError::Conflict("une tâche terminée ne peut pas recevoir de nouveau point de validation".into()));
    }

    model::update(&txn, id, body.title.trim(), body.description.trim()).await?;
    validation_point::model::delete_many(&txn, &removed).await?;
    for label in added {
        validation_point::model::create(&txn, id, label).await?;
    }
    txn.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

/// 404 si la tâche n'existe pas, 409 si son US est terminée.
pub async fn delete(State(db): State<DatabaseConnection>, Path(id): Path<i64>) -> Result<StatusCode, AppError> {
    let task = model::get(&db, id).await?;
    user_story::controller::ensure_editable(&db, task.user_story_id).await?;
    model::delete(&db, id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn update_status(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i64>,
    Json(body): Json<StatusUpdate>,
) -> Result<StatusCode, AppError> {
    let task = model::get(&db, id).await?;
    user_story::controller::ensure_editable(&db, task.user_story_id).await?;
    body.validate(&db, id).await?;
    model::set_status(&db, id, body.status).await?;
    Ok(StatusCode::NO_CONTENT)
}
