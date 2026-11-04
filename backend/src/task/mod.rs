pub mod controller;
pub mod model;
mod view;

use axum::{
    Router,
    routing::{patch, post, put},
};
use sea_orm::DatabaseConnection;

pub fn routes() -> Router<DatabaseConnection> {
    Router::new()
        .route("/api/user-stories/{id}/tasks", post(view::create))
        .route("/api/tasks/{id}", put(view::update).delete(view::delete))
        .route("/api/tasks/{id}/status", patch(view::update_status))
}
