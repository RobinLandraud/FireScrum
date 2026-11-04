-- Spec 007 : sort de chaque US à la clôture, et photo de l'US et de ses tâches.
--   outcome  : NULL tant que le sprint est en cours, puis 'closed' (terminée), 'carried' (reportée)
--              ou 'returned' (retournée au backlog).
--   snapshot : US et tâches telles qu'à la clôture (le sprint clos affiche cette photo).
ALTER TABLE sprint_user_story
    ADD COLUMN outcome  TEXT CHECK (outcome IN ('closed', 'carried', 'returned')),
    ADD COLUMN snapshot JSONB;

UPDATE sprint_user_story
SET outcome = CASE finished WHEN true THEN 'closed' WHEN false THEN 'carried' END;

ALTER TABLE sprint_user_story DROP COLUMN finished;
