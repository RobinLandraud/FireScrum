mod error;
mod feature;
mod migration;
mod project;
mod sprint;
mod task;
mod user_story;
mod validation_point;

use axum::{Json, Router, extract::State, routing::get};
use sea_orm::{Database, DatabaseConnection};
use sea_orm_migration::MigratorTrait;
use serde_json::{Value, json};

#[tokio::main]
async fn main() {
    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL manquant");
    let db = Database::connect(&database_url)
        .await
        .expect("connexion à la base impossible");
    migration::Migrator::up(&db, None)
        .await
        .expect("échec des migrations");

    let app = Router::new()
        .route("/api/health", get(health))
        .merge(project::routes())
        .merge(feature::routes())
        .merge(user_story::routes())
        .merge(task::routes())
        .merge(validation_point::routes())
        .merge(sprint::routes())
        .with_state(db);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health(State(db): State<DatabaseConnection>) -> Json<Value> {
    Json(json!({ "status": "ok", "db": db.ping().await.is_ok() }))
}
