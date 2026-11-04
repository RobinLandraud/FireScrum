use axum::{Json, http::StatusCode, response::IntoResponse};
use sea_orm::{DbErr, SqlErr};
use serde_json::json;

pub enum AppError {
    NotFound,
    BadRequest(String),
    Conflict(String),
    Database(DbErr),
}

impl From<DbErr> for AppError {
    fn from(e: DbErr) -> Self {
        match e.sql_err() {
            Some(SqlErr::ForeignKeyConstraintViolation(_)) => return AppError::NotFound,
            Some(SqlErr::UniqueConstraintViolation(_)) => {
                return AppError::Conflict("conflit avec une donnée existante".into());
            }
            _ => {}
        }
        match e {
            DbErr::RecordNotFound(_) | DbErr::RecordNotUpdated => AppError::NotFound,
            _ => AppError::Database(e),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match self {
            AppError::NotFound => (StatusCode::NOT_FOUND, "introuvable".to_string()),
            AppError::BadRequest(m) => (StatusCode::BAD_REQUEST, m),
            AppError::Conflict(m) => (StatusCode::CONFLICT, m),
            AppError::Database(e) => {
                eprintln!("erreur base de données : {e}");
                (StatusCode::INTERNAL_SERVER_ERROR, "erreur interne".to_string())
            }
        };
        (status, Json(json!({ "error": message }))).into_response()
    }
}
