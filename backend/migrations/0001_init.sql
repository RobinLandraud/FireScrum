-- MVP : un seul projet, créé ici. Les autres tables y sont rattachées pour préparer le multi-projets.
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
    -- Facultative : une US peut exister sans feature.
    feature_id  BIGINT REFERENCES feature (id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    velocity    INT NOT NULL CHECK (velocity IN (1, 2, 3, 5, 8, 13, 21)),
    validated   BOOLEAN NOT NULL DEFAULT false,
    -- Passe à true quand le PO la coche comme finie à la clôture d'un sprint.
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
-- Un seul sprint en cours par projet.
CREATE UNIQUE INDEX sprint_one_active ON sprint (project_id) WHERE status = 'active';

-- Une US reportée apparaît dans plusieurs sprints : finished = false dans l'ancien, NULL dans le sprint en cours.
CREATE TABLE sprint_user_story (
    sprint_id     BIGINT NOT NULL REFERENCES sprint (id),
    user_story_id BIGINT NOT NULL REFERENCES user_story (id),
    finished      BOOLEAN,
    PRIMARY KEY (sprint_id, user_story_id)
);
