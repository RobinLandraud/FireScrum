-- Spec 007: outcome of each US at closing, and snapshot of the US and its tasks.
--   outcome  : NULL while the sprint is active, then 'closed' (finished), 'carried' (carried over)
--              or 'returned' (returned to the backlog).
--   snapshot : US and tasks as they were at closing (the closed sprint shows this snapshot).
ALTER TABLE sprint_user_story
    ADD COLUMN outcome  TEXT CHECK (outcome IN ('closed', 'carried', 'returned')),
    ADD COLUMN snapshot JSONB;

UPDATE sprint_user_story
SET outcome = CASE finished WHEN true THEN 'closed' WHEN false THEN 'carried' END;

ALTER TABLE sprint_user_story DROP COLUMN finished;
