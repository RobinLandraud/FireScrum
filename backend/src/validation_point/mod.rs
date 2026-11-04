pub mod controller;
pub mod model;
mod view;

use axum::{Router, routing::patch};
use sea_orm::DatabaseConnection;

pub fn routes() -> Router<DatabaseConnection> {
    Router::new().route("/api/validation-points/{id}", patch(view::update))
}
