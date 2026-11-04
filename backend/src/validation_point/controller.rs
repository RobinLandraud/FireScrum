use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::model;

#[derive(Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ValidationPointOut {
    pub id: i64,
    pub label: String,
    pub checked: bool,
}

impl From<model::Model> for ValidationPointOut {
    fn from(p: model::Model) -> Self {
        Self { id: p.id, label: p.label, checked: p.checked }
    }
}

#[derive(Deserialize, TS)]
#[ts(export)]
pub struct PointUpdate {
    pub checked: bool,
}
