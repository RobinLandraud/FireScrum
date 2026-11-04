use std::collections::HashMap;

use sea_orm::ConnectionTrait;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::model::{self, TaskStatus};
use crate::error::AppError;
use crate::validation_point::{self, controller::ValidationPointOut};

#[derive(Serialize, Deserialize, TS)]
#[ts(export)]
pub struct TaskOut {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub status: TaskStatus,
    pub validation_points: Vec<ValidationPointOut>,
}

impl TaskOut {
    pub fn new(t: model::Model, validation_points: Vec<ValidationPointOut>) -> Self {
        Self { id: t.id, title: t.title, description: t.description, status: t.status, validation_points }
    }
}

/// Tâches (avec leurs points de validation) des US données, regroupées par US.
pub async fn by_user_story(
    db: &impl ConnectionTrait,
    user_story_ids: &[i64],
) -> Result<HashMap<i64, Vec<TaskOut>>, AppError> {
    let tasks = model::for_user_stories(db, user_story_ids).await?;
    let task_ids: Vec<i64> = tasks.iter().map(|t| t.id).collect();

    let mut points: HashMap<i64, Vec<ValidationPointOut>> = HashMap::new();
    for p in validation_point::model::for_tasks(db, &task_ids).await? {
        points.entry(p.task_id).or_default().push(p.into());
    }

    let mut result: HashMap<i64, Vec<TaskOut>> = HashMap::new();
    for t in tasks {
        let p = points.remove(&t.id).unwrap_or_default();
        result.entry(t.user_story_id).or_default().push(TaskOut::new(t, p));
    }
    Ok(result)
}

#[derive(Deserialize, TS)]
#[ts(export)]
pub struct NewTask {
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub validation_points: Vec<String>,
}

impl NewTask {
    pub fn validate(&self) -> Result<(), AppError> {
        if self.title.trim().is_empty() {
            return Err(AppError::BadRequest("le nom est requis".into()));
        }
        Ok(())
    }
}

#[derive(Deserialize, TS)]
#[ts(export)]
pub struct StatusUpdate {
    pub status: TaskStatus,
}

impl StatusUpdate {
    /// Une tâche ne peut passer en `done` que si tous ses points de validation sont cochés.
    pub async fn validate(&self, db: &impl ConnectionTrait, task_id: i64) -> Result<(), AppError> {
        if self.status == TaskStatus::Done && validation_point::model::count_unchecked(db, task_id).await? > 0 {
            return Err(AppError::Conflict("tous les points de validation doivent être cochés".into()));
        }
        Ok(())
    }
}
