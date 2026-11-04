pub mod controller;
pub mod model;
mod view;

use axum::{
    Router,
    routing::{get, post},
};
use sea_orm::DatabaseConnection;

pub fn routes() -> Router<DatabaseConnection> {
    Router::new()
        .route("/api/sprints", get(view::list).post(view::launch))
        .route("/api/sprints/current", get(view::current))
        .route("/api/sprints/{id}", get(view::get))
        .route("/api/sprints/{id}/close", post(view::close))
}
