#!/usr/bin/env bash
# Scénarios API (cahier de recettes). Base vide attendue : lancé par scripts/test.sh sur la stack de test.
API=${API:-http://localhost:4201/api}
BODY=$(mktemp)
trap 'rm -f "$BODY"' EXIT
ok=0; ko=0
check() { # check <id> <description> <attendu> <obtenu>
  if [ "$3" == "$4" ]; then ok=$((ok+1)); echo "OK  $1 $2"; else ko=$((ko+1)); echo "KO  $1 $2 (attendu: $3, obtenu: $4)"; fi
}
req() { curl -s -o "$BODY" -w '%{http_code}' -X "$1" "$API$2" -H 'Content-Type: application/json' ${3:+-d "$3"}; }
# j <expression JS sur d> : évalue sur le dernier corps de réponse
j() { node -e 'const d=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); console.log(eval(process.argv[2]))' "$BODY" "$1"; }

check R01 "projet unique" 200 "$(req GET /project)"
check R01 "nom du projet" FireScrum "$(j d.name)"

check R02 "créer une feature" 201 "$(req POST /features '{"title":"Backlog"}')"; F=$(j d.id)
check R02 "titre vide refusé" 400 "$(req POST /features '{"title":"  "}')"

check R03 "créer une US dans une feature, avec 2 tâches" 201 "$(req POST /user-stories "{\"title\":\"US A\",\"velocity\":2,\"feature_id\":$F,\"tasks\":[{\"title\":\"T1\",\"description\":\"Détail de T1\",\"validation_points\":[\"p1\",\"p2\"]},{\"title\":\"T2\"}]}")"; A=$(j d.id)
T1=$(j "d.tasks[0].id"); P1=$(j "d.tasks[0].validation_points[0].id"); P2=$(j "d.tasks[0].validation_points[1].id"); T2=$(j "d.tasks[1].id")
check R03 "tâches créées avec l'US" "T1:2,T2:0" "$(j 'd.tasks.map(t => t.title + ":" + t.validation_points.length).join(",")')"
check R03 "US rattachée à la feature" "$F" "$(j d.feature_id)"
check R03 "créer une US sans feature" 201 "$(req POST /user-stories '{"title":"US B","velocity":3,"tasks":[{"title":"t"}]}')"; B=$(j d.id)
check R03 "US sans feature : feature_id null" null "$(j d.feature_id)"
req POST /user-stories '{"title":"US C","velocity":5,"tasks":[{"title":"t"}]}' >/dev/null; C=$(j d.id)
check R04 "vélocité non Fibonacci refusée" 400 "$(req POST /user-stories '{"title":"X","velocity":4,"tasks":[{"title":"t"}]}')"
check R03 "US sur feature inexistante" 404 "$(req POST /user-stories '{"title":"X","velocity":1,"feature_id":9999,"tasks":[{"title":"t"}]}')"
check R03 "US sans tâche refusée" 400 "$(req POST /user-stories '{"title":"X","velocity":1,"tasks":[]}')"
check R03 "US avec une tâche sans nom refusée" 400 "$(req POST /user-stories '{"title":"X","velocity":1,"tasks":[{"title":" "}]}')"
check R03 "associer une US à une feature" 204 "$(req PATCH /user-stories/$C/feature "{\"feature_id\":$F}")"
check R03 "retirer une US de sa feature" 204 "$(req PATCH /user-stories/$C/feature '{"feature_id":null}')"
check R03 "associer à une feature inexistante" 404 "$(req PATCH /user-stories/$C/feature '{"feature_id":9999}')"
check R03 "associer une US inexistante" 404 "$(req PATCH /user-stories/9999/feature "{\"feature_id\":$F}")"
check R03c "modifier une US" 204 "$(req PUT /user-stories/$B "{\"title\":\"US B2\",\"description\":\"d\",\"velocity\":3,\"feature_id\":null}")"
check R03c "modifier : vélocité invalide" 400 "$(req PUT /user-stories/$B '{"title":"US B2","velocity":4}')"
check R03c "modifier : feature inexistante" 404 "$(req PUT /user-stories/$B '{"title":"US B2","velocity":3,"feature_id":9999}')"
check R03c "modifier une US inexistante" 404 "$(req PUT /user-stories/9999 '{"title":"X","velocity":3}')"
req GET /user-stories >/dev/null
check R03 "liste de toutes les US" 3 "$(j d.length)"
check R03c "US modifiée" "US B2 3 d" "$(j "(s => s.title + ' ' + s.velocity + ' ' + s.description)(d.find(s => s.id == $B))")"
req GET /features >/dev/null
check R03 "la feature ne contient que US A" "$A" "$(j 'd[0].user_stories.map(s => s.id).join(",")')"
check R02b "créer une feature avec une US sans feature" 201 "$(req POST /features "{\"title\":\"F2\",\"user_story_ids\":[$B]}")"
check R02b "la US est rattachée à la nouvelle feature" "$B" "$(j 'd.user_stories.map(s => s.id).join(",")')"
check R02b "US ayant déjà une feature refusée" 400 "$(req POST /features "{\"title\":\"F3\",\"user_story_ids\":[$A]}")"
check R02b "US inexistante refusée" 400 "$(req POST /features '{"title":"F3","user_story_ids":[9999]}')"
req GET /features >/dev/null
check R02b "création refusée annulée (pas de F3)" 2 "$(j d.length)"
check R02c "modifier une feature" 204 "$(req PUT /features/$F '{"title":"Backlog 2","description":"desc"}')"
check R02c "modifier : titre vide refusé" 400 "$(req PUT /features/$F '{"title":" "}')"
check R02c "modifier une feature inexistante" 404 "$(req PUT /features/9999 '{"title":"x"}')"
req GET /features >/dev/null
check R02c "feature modifiée" "Backlog 2|desc" "$(j 'd[0].title + "|" + d[0].description')"

check R05 "ajouter une tâche avec points" 201 "$(req POST /user-stories/$B/tasks '{"title":"TB","description":"Détail de TB","validation_points":["p1","p2"]}')"
check R05 "nom et description" "TB|Détail de TB" "$(j 'd.title + "|" + d.description')"
check R05 "statut initial todo" todo "$(j d.status)"
TB=$(j d.id); PB=$(j 'd.validation_points[0].id')
check R05 "tâche sans nom refusée" 400 "$(req POST /user-stories/$B/tasks '{"title":" ","description":"x"}')"

req GET /features >/dev/null
check R06 "backlog imbriqué persistant" 2 "$(j 'd[0].user_stories[0].tasks[0].validation_points.length')"

check R08 "sprint avec US non validée refusé" 400 "$(req POST /sprints "{\"name\":\"S1\",\"user_story_ids\":[$A]}")"
check R07 "valider une US" 204 "$(req POST /user-stories/$A/validate)"
req POST /user-stories/$B/validate >/dev/null; req POST /user-stories/$C/validate >/dev/null

check R09 "lancer un sprint" 201 "$(req POST /sprints "{\"name\":\"S1\",\"user_story_ids\":[$A,$B,$C]}")"; S1=$(j d.id)
check R09 "deuxième sprint actif refusé" 409 "$(req POST /sprints '{"name":"S2"}')"
req GET /sprints/current >/dev/null
check R10 "3 US dans le sprint actuel" 3 "$(j d.user_stories.length)"
check R11 "vélocité totale 2+3+5" 10 "$(j d.total_velocity)"

check R12 "déplacer en in_progress" 204 "$(req PATCH /tasks/$T1/status '{"status":"in_progress"}')"
check R12 "statut invalide refusé" 422 "$(req PATCH /tasks/$T1/status '{"status":"merged"}')"
check R14 "done refusé si point non coché" 409 "$(req PATCH /tasks/$T1/status '{"status":"done"}')"
req PATCH /validation-points/$P1 '{"checked":true}' >/dev/null
# Modification / suppression de tâche (points synchronisés par libellé)
tpoints() { req GET /user-stories >/dev/null; j "d.flatMap(s => s.tasks).find(t => t.id == $T1).validation_points.map(p => p.label + (p.checked ? '+' : '')).join(',')"; }
check R05b "modifier une tâche (ajout de p3)" 204 "$(req PUT /tasks/$T1 '{"title":"T1b","description":"d2","validation_points":["p1","p2","p3"]}')"
check R05b "point coché conservé, p3 ajouté" "p1+,p2,p3" "$(tpoints)"
check R05b "retirer p3" 204 "$(req PUT /tasks/$T1 '{"title":"T1b","validation_points":["p1","p2"]}')"
check R05b "p3 supprimé" "p1+,p2" "$(tpoints)"
check R05b "modifier : nom vide refusé" 400 "$(req PUT /tasks/$T1 '{"title":" "}')"
check R05b "modifier une tâche inexistante" 404 "$(req PUT /tasks/9999 '{"title":"x"}')"
req POST /user-stories/$A/tasks '{"title":"T3","validation_points":["q"]}' >/dev/null; T3=$(j d.id)
check R05c "supprimer une tâche" 204 "$(req DELETE /tasks/$T3)"
check R05c "supprimer une tâche déjà supprimée" 404 "$(req DELETE /tasks/$T3)"
check R15 "cocher le 2e point" 204 "$(req PATCH /validation-points/$P2 '{"checked":true}')"
check R15 "done accepté si tous cochés" 204 "$(req PATCH /tasks/$T1/status '{"status":"done"}')"
check R15b "décocher un point d'une tâche Terminé refusé" 409 "$(req PATCH /validation-points/$P1 '{"checked":false}')"
check R05b "ajout de point sur tâche terminée refusé" 409 "$(req PUT /tasks/$T1 '{"title":"T1b","validation_points":["p1","p2","p4"]}')"
check R18 "tâche sans point en in_progress" 204 "$(req PATCH /tasks/$T2/status '{"status":"in_progress"}')"
req POST /user-stories '{"title":"US D","velocity":1,"tasks":[{"title":"td"}]}' >/dev/null; D=$(j d.id)
req POST /user-stories/$D/validate >/dev/null

# Clôture à trois sorts (spec 007)
check R17 "clôture : US à la fois close et reportée refusée" 400 "$(req POST /sprints/$S1/close "{\"closed_user_story_ids\":[$B],\"carried_user_story_ids\":[$B]}")"
check R17 "clôture : US hors du sprint refusée" 400 "$(req POST /sprints/$S1/close "{\"closed_user_story_ids\":[$D]}")"
check R17 "clôturer S1 : B et C closes, A reportée" 200 "$(req POST /sprints/$S1/close "{\"closed_user_story_ids\":[$B,$C],\"carried_user_story_ids\":[$A]}")"
check R17 "sort des US de S1 (A, B, C)" "carried,closed,closed" "$(j 'd.user_stories.map(s => s.outcome).join(",")')"
check R16 "re-clôture refusée" 409 "$(req POST /sprints/$S1/close '{}')"
check R08 "US terminée refusée dans un sprint" 400 "$(req POST /sprints "{\"name\":\"S2\",\"user_story_ids\":[$B]}")"
check R17b "lancement sans US refusé" 400 "$(req POST /sprints '{"name":"S2"}')"

check R17 "lancer S2 avec l'US reportée et D" 201 "$(req POST /sprints "{\"name\":\"S2\",\"user_story_ids\":[$A,$D]}")"; S2=$(j d.id)
check R17 "US de S2" "$A,$D" "$(j 'd.user_stories.map(s => s.id).join(",")')"
check R18 "statuts conservés après report" "done,in_progress" "$(j 'd.user_stories[0].tasks.map(t => t.status).join(",")')"

# Photo à la clôture : S1 garde l'état de ses tâches, même si l'US reportée avance dans S2
check R19b "faire avancer une tâche reportée" 204 "$(req PATCH /tasks/$T2/status '{"status":"in_review"}')"
req GET /sprints/$S1 >/dev/null
check R19 "sprint passé : 3 US, statut closed" "3 closed" "$(j 'd.user_stories.length + " " + d.status')"
check R19b "photo : S1 garde le statut de la clôture" in_progress "$(j "d.user_stories.find(s => s.id == $A).tasks.find(t => t.id == $T2).status")"
req GET /sprints/current >/dev/null
check R19b "sprint en cours : statut actuel" in_review "$(j "d.user_stories.find(s => s.id == $A).tasks.find(t => t.id == $T2).status")"
req GET /sprints >/dev/null
check R19 "liste des sprints" 2 "$(j d.length)"

# Statut des US (spec 005) : C terminée, A dans S2 en cours, D validée dans S2, E en Sandbox
req POST /user-stories '{"title":"US E","velocity":1,"tasks":[{"title":"te"}]}' >/dev/null; E=$(j d.id)
req POST /user-stories '{"title":"US G","velocity":1,"tasks":[{"title":"tg"}]}' >/dev/null; G=$(j d.id)
req POST /user-stories/$G/validate >/dev/null
req GET /user-stories >/dev/null
check R03f "statuts des US" "done in_progress planned pending" "$(j "[$C, $A, $G, $E].map(id => d.find(s => s.id == id).status).join(' ')")"
check R03g "créer une feature avec une US terminée refusé" 400 "$(req POST /features "{\"title\":\"F4\",\"user_story_ids\":[$C]}")"

# Une US terminée (B) et ses tâches ne se modifient plus
check R03e "modifier une US terminée refusé" 409 "$(req PUT /user-stories/$B '{"title":"x","velocity":1}')"
check R03e "changer la feature d'une US terminée refusé" 409 "$(req PATCH /user-stories/$B/feature '{"feature_id":null}')"
check R05d "ajouter une tâche à une US terminée refusé" 409 "$(req POST /user-stories/$B/tasks '{"title":"x"}')"
check R05d "modifier une tâche d'une US terminée refusé" 409 "$(req PUT /tasks/$TB '{"title":"x"}')"
check R05d "déplacer une tâche d'une US terminée refusé" 409 "$(req PATCH /tasks/$TB/status '{"status":"in_progress"}')"
check R05d "cocher un point d'une US terminée refusé" 409 "$(req PATCH /validation-points/$PB '{"checked":true}')"
check R05d "supprimer une tâche d'une US terminée refusé" 409 "$(req DELETE /tasks/$TB)"

# Clôture de S2 : A close, D sans case → retournée au backlog
check R16 "clôturer S2 : A close, D sans case" 200 "$(req POST /sprints/$S2/close "{\"closed_user_story_ids\":[$A]}")"
check R17b "D retournée au backlog" returned "$(j "d.user_stories.find(s => s.id == $D).outcome")"
req GET /user-stories >/dev/null
check R17b "D toujours acceptée, pas terminée" "true false" "$(j "(s => s.validated + ' ' + s.done)(d.find(s => s.id == $D))")"
check R16 "plus de sprint en cours" 404 "$(req GET /sprints/current)"

echo "---- $ok OK / $ko KO"
[ "$ko" -eq 0 ]
