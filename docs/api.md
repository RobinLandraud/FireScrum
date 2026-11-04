# FireScrum — API (lot 1)

Toutes les routes sont sous `/api`, en JSON. Les erreurs renvoient `{ "error": "<message>" }`.

| Code | Signification |
|------|---------------|
| 400 | Donnée invalide (titre vide, vélocité hors Fibonacci…) |
| 404 | Élément introuvable |
| 409 | Règle métier non respectée (points de validation non cochés, sprint déjà en cours, US terminée…) |
| 422 | JSON mal formé ou valeur inconnue (ex. statut de tâche hors liste) |

## Routes

| Méthode | Route | Corps | Réponse |
|---------|-------|-------|---------|
| GET | `/project` | | `Project` |
| GET | `/features` | | `Feature[]` (avec leurs US, imbriqué) |
| POST | `/features` | `{ title, description?, user_story_ids?: number[] }` | 201 `Feature` avec ses US, rattachées dans la même transaction — 400 si une US n'existe pas, a déjà une feature ou est terminée |
| PUT | `/features/{id}` | `{ title, description? }` | 204 — 404 si la feature n'existe pas |
| GET | `/user-stories` | | `UserStory[]` (toutes, avec ou sans feature) |
| POST | `/user-stories` | `{ title, description?, velocity, feature_id?: number \| null, tasks: NewTask[] }` (au moins une tâche) | 201 `UserStory` avec ses tâches, créées ensemble — 400 sans tâche, 404 si la feature n'existe pas |
| PUT | `/user-stories/{id}` | `{ title, description?, velocity, feature_id }` (sans les tâches) | 204 — modifie titre, description, vélocité et feature ; 404 si l'US ou la feature n'existe pas |
| PATCH | `/user-stories/{id}/feature` | `{ feature_id: number \| null }` | 204 — associe l'US à une feature, ou l'en retire avec `null` |
| POST | `/user-stories/{id}/validate` | | 204 |
| POST | `/user-stories/{id}/tasks` | `{ title, description?, validation_points?: string[] }` | 201 `Task` |
| PUT | `/tasks/{id}` | même corps que la création | 204 — points synchronisés par libellé (un point conservé garde son état coché) ; 409 si on ajoute un point à une tâche terminée |
| DELETE | `/tasks/{id}` | | 204 — supprime aussi ses points de validation |
| PATCH | `/tasks/{id}/status` | `{ status }` | 204 — 409 si `done` avec un point non coché |
| PATCH | `/validation-points/{id}` | `{ checked }` | 204 — 409 si on décoche un point d'une tâche `done` (« Sors d'abord la tâche de Terminé. ») |
| GET | `/sprints` | | `Sprint[]` (du plus récent au plus ancien) |
| POST | `/sprints` | `{ name, user_story_ids: number[] }` (au moins une US) | 201 `SprintDetail` — 409 si un sprint est déjà en cours, 400 sans US ou si une US n'est pas validée ou déjà terminée |
| GET | `/sprints/current` | | `SprintDetail` — 404 si aucun sprint en cours |
| GET | `/sprints/{id}` | | `SprintDetail` — pour un sprint clos, les US et tâches telles qu'à la clôture (photo) |
| POST | `/sprints/{id}/close` | `{ closed_user_story_ids: number[], carried_user_story_ids: number[] }` | `SprintDetail` — 409 si déjà clôturé, 400 si une US est dans les deux listes ou hors du sprint |

## Objets

```ts
Project          { id, name }
Feature          { id, title, description, user_stories: UserStory[] }
UserStory        { id, feature_id: number | null, title, description, velocity, validated, done, status: UserStoryStatus, tasks: Task[] }
Task             { id, title, description, status, validation_points: ValidationPoint[] }
ValidationPoint  { id, label, checked }
Sprint           { id, name, status }                       // status : "active" | "closed"
SprintDetail     Sprint & { total_velocity, user_stories: (UserStory & { outcome: SprintOutcome | null })[] }
SprintOutcome    "closed" | "carried" | "returned"
UserStoryStatus  "pending" | "planned" | "in_progress" | "done"
```

- `velocity` : 1, 2, 3, 5, 8, 13 ou 21.
- `Task.status` : `todo` (À faire), `in_progress` (En cours), `in_review` (En validation), `done` (Terminé).
- `UserStory.status`, calculé : `done` (Terminé) si terminée, sinon `in_progress` (En cours) si dans le sprint en cours, sinon `planned` (Planifié) si validée, sinon `pending` (En attente). Dans la photo d'un sprint clos, c'est le statut à la clôture (`pending` pour les sprints clos avant son ajout).
- `outcome` : `null` pendant le sprint, puis le sort choisi par le PO à la clôture : `closed` (Close), `carried` (Reportée), `returned` (Retournée au backlog).

## Règles de sprint

- Un seul sprint en cours à la fois.
- Au lancement, le sprint reçoit seulement les US choisies (validées, non terminées, au moins une). Le back n'ajoute plus les US reportées : le front les pré-coche dans la modal de lancement.
- À la clôture, les US `closed` passent `done = true` ; les autres gardent leurs tâches et leurs statuts. Les US absentes des deux listes sont `returned`.
- À la clôture, une photo de chaque US et de ses tâches est enregistrée : un sprint clos affiche toujours cette photo, même si une US reportée a avancé depuis.
- Une US `done` ne se modifie plus, ni ses tâches : 409 « cette US est terminée : elle ne se modifie plus » sur `PUT /user-stories/{id}`, `PATCH /user-stories/{id}/feature`, `POST /user-stories/{id}/tasks`, `PUT` / `DELETE /tasks/{id}`, `PATCH /tasks/{id}/status` et `PATCH /validation-points/{id}`.
