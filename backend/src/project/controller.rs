use serde::Serialize;
use ts_rs::TS;

use super::model;

#[derive(Serialize, TS)]
#[ts(export)]
pub struct ProjectOut {
    pub id: i64,
    pub name: String,
}

impl From<model::Model> for ProjectOut {
    fn from(p: model::Model) -> Self {
        Self { id: p.id, name: p.name }
    }
}
