pub mod controller;
pub mod model;
mod view;

use axum::{Router, routing::get};
use sea_orm::DatabaseConnection;

pub fn routes() -> Router<DatabaseConnection> {
    Router::new().route("/api/project", get(view::get))
}
