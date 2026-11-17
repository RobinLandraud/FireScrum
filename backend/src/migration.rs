use sea_orm_migration::prelude::*;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![Box::new(m0001_init::Migration), Box::new(m0002_sprint_outcome::Migration)]
    }
}

/// The schema stays written in SQL (CHECK constraints, partial index) in `migrations/`.
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

    /// Explicit name: `DeriveMigrationName` would give "migration", already taken by 0001
    /// (historical name, recorded in existing databases: do not change it).
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
