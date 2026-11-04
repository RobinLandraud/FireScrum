pub mod controller;
pub mod model;
mod view;

use axum::{
    Router,
    routing::{get, patch, post, put},
};
use sea_orm::DatabaseConnection;

pub fn routes() -> Router<DatabaseConnection> {
    Router::new()
        .route("/api/user-stories", get(view::list).post(view::create))
        .route("/api/user-stories/{id}", put(view::update))
        .route("/api/user-stories/{id}/validate", post(view::validate))
        .route("/api/user-stories/{id}/feature", patch(view::set_feature))
}
