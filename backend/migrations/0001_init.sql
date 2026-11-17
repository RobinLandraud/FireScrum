-- MVP: a single project, created here. The other tables reference it to prepare for multi-project.
CREATE TABLE project (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL
);
INSERT INTO project (name) VALUES ('FireScrum');

CREATE TABLE feature (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id  BIGINT NOT NULL REFERENCES project (id),
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE user_story (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id  BIGINT NOT NULL REFERENCES project (id),
    -- Optional: a US can exist without a feature.
    feature_id  BIGINT REFERENCES feature (id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    velocity    INT NOT NULL CHECK (velocity IN (1, 2, 3, 5, 8, 13, 21)),
    validated   BOOLEAN NOT NULL DEFAULT false,
    -- Set to true when the PO checks it as finished when closing a sprint.
    done        BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE task (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_story_id BIGINT NOT NULL REFERENCES user_story (id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'todo'
                  CHECK (status IN ('todo', 'in_progress', 'in_review', 'done'))
);

CREATE TABLE validation_point (
    id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES task (id) ON DELETE CASCADE,
    label   TEXT NOT NULL,
    checked BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE sprint (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES project (id),
    name       TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed'))
);
-- Only one active sprint per project.
CREATE UNIQUE INDEX sprint_one_active ON sprint (project_id) WHERE status = 'active';

-- A carried-over US appears in several sprints: finished = false in the old one, NULL in the active sprint.
CREATE TABLE sprint_user_story (
    sprint_id     BIGINT NOT NULL REFERENCES sprint (id),
    user_story_id BIGINT NOT NULL REFERENCES user_story (id),
    finished      BOOLEAN,
    PRIMARY KEY (sprint_id, user_story_id)
);
