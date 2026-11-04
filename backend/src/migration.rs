use sea_orm_migration::prelude::*;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![Box::new(m0001_init::Migration), Box::new(m0002_sprint_outcome::Migration)]
    }
}

/// Le schéma reste écrit en SQL (contraintes CHECK, index partiel) dans `migrations/`.
mod m0001_init {
    use sea_orm_migration::prelude::*;

    #[derive(DeriveMigrationName)]
    pub struct Migration;

    #[async_trait::async_trait]
    impl MigrationTrait for Migration {
        async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
            manager
                .get_connection()
                .execute_unprepared(include_str!("../migrations/0001_init.sql"))
                .await?;
            Ok(())
        }
    }
}

mod m0002_sprint_outcome {
    use sea_orm_migration::prelude::*;

    pub struct Migration;

    /// Nom explicite : `DeriveMigrationName` donnerait « migration », déjà pris par 0001
    /// (nom historique, enregistré dans les bases existantes : ne pas le changer).
    impl MigrationName for Migration {
        fn name(&self) -> &str {
            "m0002_sprint_outcome"
        }
    }

    #[async_trait::async_trait]
    impl MigrationTrait for Migration {
        async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
            manager
                .get_connection()
                .execute_unprepared(include_str!("../migrations/0002_sprint_outcome.sql"))
                .await?;
            Ok(())
        }
    }
}
