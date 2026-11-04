pub mod controller;
pub mod model;
mod view;

use axum::{
    Router,
    routing::{get, put},
};
use sea_orm::DatabaseConnection;

pub fn routes() -> Router<DatabaseConnection> {
    Router::new()
        .route("/api/features", get(view::list).post(view::create))
        .route("/api/features/{id}", put(view::update))
}
