use std::collections::HashMap;

use sea_orm::DatabaseConnection;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::model;
use crate::error::AppError;
use crate::user_story::{self, controller::UserStoryOut};

#[derive(Serialize, TS)]
#[ts(export)]
pub struct FeatureOut {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub user_stories: Vec<UserStoryOut>,
}

impl FeatureOut {
    pub fn new(f: model::Model, user_stories: Vec<UserStoryOut>) -> Self {
        Self { id: f.id, title: f.title, description: f.description, user_stories }
    }
}

/// Features avec leurs US (et les tâches de chaque US).
pub async fn serialize_many(
    db: &DatabaseConnection,
    features: Vec<model::Model>,
) -> Result<Vec<FeatureOut>, AppError> {
    let ids: Vec<i64> = features.iter().map(|f| f.id).collect();
    let stories = user_story::model::for_features(db, &ids).await?;

    let mut by_feature: HashMap<i64, Vec<UserStoryOut>> = HashMap::new();
    for s in user_story::controller::serialize_many(db, stories).await? {
        if let Some(feature_id) = s.feature_id {
            by_feature.entry(feature_id).or_default().push(s);
        }
    }

    Ok(features
        .into_iter()
        .map(|f| {
            let stories = by_feature.remove(&f.id).unwrap_or_default();
            FeatureOut::new(f, stories)
        })
        .collect())
}

/// Champs modifiables d'une feature.
#[derive(Deserialize, TS)]
#[ts(export)]
pub struct FeatureDetails {
    pub title: String,
    #[serde(default)]
    pub description: String,
}

impl FeatureDetails {
    pub fn validate(&self) -> Result<(), AppError> {
        if self.title.trim().is_empty() {
            return Err(AppError::BadRequest("le titre est requis".into()));
        }
        Ok(())
    }
}

/// Création : les champs de la feature et les US (sans feature) à y rattacher.
#[derive(Deserialize, TS)]
#[ts(export)]
pub struct NewFeature {
    #[serde(flatten)]
    pub details: FeatureDetails,
    #[serde(default)]
    pub user_story_ids: Vec<i64>,
}
