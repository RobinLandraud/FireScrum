use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use sea_orm::{DatabaseConnection, DbErr, TransactionTrait};

use super::controller::{self, CloseSprint, NewSprint, SprintDetailOut, SprintOut};
use super::model;
use crate::error::AppError;
use crate::project::model::PROJECT_ID;
use crate::user_story;

pub async fn list(State(db): State<DatabaseConnection>) -> Result<Json<Vec<SprintOut>>, AppError> {
    let sprints = model::for_project(&db, PROJECT_ID).await?;
    Ok(Json(sprints.into_iter().map(Into::into).collect()))
}

pub async fn current(State(db): State<DatabaseConnection>) -> Result<Json<SprintDetailOut>, AppError> {
    let sprint = model::active(&db, PROJECT_ID).await?.ok_or(AppError::NotFound)?;
    Ok(Json(controller::detail(&db, sprint.id).await?))
}

pub async fn get(State(db): State<DatabaseConnection>, Path(id): Path<i64>) -> Result<Json<SprintDetailOut>, AppError> {
    Ok(Json(controller::detail(&db, id).await?))
}

/// Lance un sprint avec les US choisies (les US reportées sont seulement pré-cochées par le front).
pub async fn launch(
    State(db): State<DatabaseConnection>,
    Json(mut body): Json<NewSprint>,
) -> Result<(StatusCode, Json<SprintDetailOut>), AppError> {
    let txn = db.begin().await?;
    body.validate(&txn).await?;
    let sprint = model::create(&txn, PROJECT_ID, body.name.trim()).await?;
    model::add_user_stories(&txn, sprint.id, &body.user_story_ids).await?;
    txn.commit().await?;
    Ok((StatusCode::CREATED, Json(controller::detail(&db, sprint.id).await?)))
}

/// Clôture : chaque US reçoit son sort (close, reportée, retournée au backlog), les US closes sont terminées,
/// puis la photo de chaque US et de ses tâches est enregistrée.
pub async fn close(
    State(db): State<DatabaseConnection>,
    Path(id): Path<i64>,
    Json(body): Json<CloseSprint>,
) -> Result<Json<SprintDetailOut>, AppError> {
    let txn = db.begin().await?;
    body.validate(&txn, id).await?;
    user_story::model::mark_done(&txn, &body.closed_user_story_ids).await?;

    let ids: Vec<i64> = model::user_story_links(&txn, id).await?.iter().map(|l| l.user_story_id).collect();
    let stories = user_story::model::by_ids(&txn, &ids).await?;
    for story in user_story::controller::serialize_many(&txn, stories).await? {
        let snapshot = serde_json::to_value(&story).map_err(|e| AppError::Database(DbErr::Json(e.to_string())))?;
        model::set_outcome(&txn, id, story.id, body.outcome(story.id), snapshot).await?;
    }
    model::close(&txn, id).await?;

    txn.commit().await?;
    Ok(Json(controller::detail(&db, id).await?))
}
