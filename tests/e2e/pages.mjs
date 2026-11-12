// Parcours navigateur (Chromium) : Backlog, Features, Planning, Sprint. Base vide attendue.
// Lancé par scripts/test.sh sur la stack de test ; captures dans tests/e2e/screenshots/.
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:4201';
const SHOTS = process.env.SHOTS ?? new URL('./screenshots/', import.meta.url).pathname;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && !/status of (400|404)/.test(m.text()) && errors.push(m.text()));

let ok = 0, ko = 0;
async function check(id, label, fn) {
  try { await fn(); ok++; console.log(`OK  ${id} ${label}`); }
  catch (e) {
    ko++;
    const waiting = e.message.split('\n').find((l) => l.includes('waiting for')) ?? '';
    console.log(`KO  ${id} ${label}\n    ${e.message.split('\n')[0]}\n    ${waiting.trim()}`);
    await page.screenshot({ path: `${SHOTS}ko-${id}.png`, fullPage: true });
    // Une modal restée ouverte ferait échouer toutes les vérifications suivantes.
    await page.keyboard.press('Escape');
  }
}
const visible = (loc) => loc.waitFor({ state: 'visible', timeout: 5000 });
/** Attend qu'un champ ait la valeur attendue (l'affichage se met à jour juste après le clic). */
async function hasValue(loc, expected) {
  for (let i = 0; i < 50; i++) {
    if ((await loc.inputValue()) === expected) return;
    await page.waitForTimeout(100);
  }
  throw new Error(`valeur attendue ${JSON.stringify(expected)}, obtenue ${JSON.stringify(await loc.inputValue())}`);
}
/** Attend l'état d'une case (elle se met à jour juste après le clic). */
async function isChecked(loc, expected) {
  for (let i = 0; i < 50; i++) {
    if ((await loc.isChecked()) === expected) return;
    await page.waitForTimeout(100);
  }
  throw new Error(`case ${expected ? 'non cochée' : 'cochée'} : ${loc}`);
}
const hidden = (loc) => loc.waitFor({ state: 'hidden', timeout: 5000 });
const dialog = () => page.getByRole('dialog');
const card = (title) => page.getByRole('button', { name: new RegExp(`^${title}`) });
const nav = (name) => page.getByRole('navigation').getByRole('link', { name }).click();
const shot = (name) => page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: true });
/** Toutes les modals ont la même taille : 1024 × 85 % de la hauteur (680 px avec la fenêtre de 1280 × 800). */
async function expectModalSize(name) {
  const box = await dialog().boundingBox();
  if (Math.round(box.width) !== 1024 || Math.round(box.height) !== 680) throw new Error(`${name} : ${box.width} × ${box.height}`);
}

async function addTask(name) {
  await dialog().getByLabel('Nom de la tâche').fill(name);
  await dialog().getByRole('button', { name: 'Ajouter la tâche' }).click();
}
async function newStory(title, { velocity, feature, tasks = ['Tâche initiale'] } = {}) {
  await page.getByRole('button', { name: 'New Story' }).click();
  await dialog().getByLabel('Titre').fill(title);
  if (velocity) await dialog().getByLabel('Vélocité').selectOption(String(velocity));
  if (feature) await dialog().getByLabel('Feature').selectOption({ label: feature });
  await dialog().getByRole('tab', { name: /Tasks/ }).click();
  for (const t of tasks) await addTask(t);
  await dialog().getByRole('tab', { name: 'Details' }).click();
  await dialog().getByRole('button', { name: "Créer l'US" }).click();
}

await page.goto(`${BASE}/backlog`);
await check('--', 'backlog vide, onglets avec compteurs', async () => {
  await visible(page.getByRole('tab', { name: 'Sandbox (0)' }));
  await visible(page.getByRole('tab', { name: 'Accepted (0)' }));
  await visible(page.getByRole('tab', { name: 'Done (0)' }));
  await visible(page.getByText('Aucune US à valider.'));
});

await nav('Features');
await check('R02', 'créer une feature depuis la modal', async () => {
  await page.getByRole('button', { name: 'New Feature' }).click();
  await visible(dialog().getByRole('heading', { name: 'Nouvelle feature' }));
  await dialog().getByRole('tab', { name: 'User stories (0)' }).click();
  await visible(dialog().getByText('Aucune US sans feature. Crée-en depuis le Backlog.'));
  await dialog().getByRole('tab', { name: 'Details' }).click();
  await dialog().getByLabel('Titre').fill('Authentification');
  await dialog().getByRole('button', { name: 'Créer la feature' }).click();
  await hidden(dialog());
  await visible(card('Authentification'));
  await visible(page.getByText('0 US'));
});

await nav('Backlog');
await check('R03d', 'New Story : onglets Details/Tasks, création bloquée sans tâche', async () => {
  await page.getByRole('button', { name: 'New Story' }).click();
  await visible(dialog().getByRole('heading', { name: 'Nouvelle user story' }));
  await visible(dialog().getByRole('tab', { name: 'Details', selected: true }));
  await dialog().getByLabel('Titre').fill('Brouillon');
  const create = dialog().getByRole('button', { name: "Créer l'US" });
  if (!(await create.isDisabled())) throw new Error('création possible sans tâche');
  await visible(dialog().getByText("Ajoute au moins une tâche dans l'onglet Tasks."));
  await dialog().getByRole('tab', { name: 'Tasks (0)' }).click();
  await addTask('Brouillon A');
  await addTask('Brouillon B');
  await visible(dialog().getByRole('tab', { name: 'Tasks (2)' }));
  await dialog().getByRole('button', { name: 'Modifier « Brouillon A »' }).click();
  await hasValue(dialog().getByLabel('Nom de la tâche'), 'Brouillon A');
  await dialog().getByLabel('Nom de la tâche').fill('Brouillon A2');
  await dialog().getByRole('button', { name: 'Modifier la tâche' }).click();
  await visible(dialog().getByText('Brouillon A2'));
  await dialog().getByRole('button', { name: 'Supprimer « Brouillon B »' }).click();
  await visible(dialog().getByRole('tab', { name: 'Tasks (1)' }));
  await dialog().getByRole('tab', { name: 'Details' }).click();
  if (await create.isDisabled()) throw new Error('création bloquée avec une tâche');
  await page.keyboard.press('Escape');
  await hidden(dialog());
  await visible(page.getByRole('tab', { name: 'Sandbox (0)' }));
});

await check('R03', 'New Story avec feature → card dans Sandbox', async () => {
  await newStory('Se connecter', { velocity: 5, feature: 'Authentification' });
  await hidden(dialog());
  await visible(page.getByRole('tab', { name: 'Sandbox (1)' }));
  await visible(card('Se connecter').getByText('Authentification'));
});

await check('R03', 'New Story sans feature → « Sans feature »', async () => {
  await newStory('Se déconnecter');
  await hidden(dialog());
  await visible(card('Se déconnecter').getByText('Sans feature'));
});

await check('R03', 'titre blanc refusé → toast, modal reste ouverte', async () => {
  await newStory('   ');
  await visible(page.getByText('le titre est requis'));
  await visible(dialog());
  await page.keyboard.press('Escape');
  await hidden(dialog());
});

await check('R05', 'onglet Tasks : ajouter une tâche (nom, description, points)', async () => {
  await card('Se connecter').click();
  await visible(dialog().getByRole('tab', { name: 'Details', selected: true }));
  if ((await dialog().getByLabel('Vélocité').inputValue()) !== '5') throw new Error('vélocité 5 attendue');
  await dialog().getByRole('tab', { name: 'Tasks (1)' }).click();
  await visible(dialog().getByText('Tâche initiale'));
  await dialog().getByLabel('Nom de la tâche').fill('Formulaire de login');
  await dialog().getByLabel('Description de la tâche').fill('Email et mot de passe');
  await dialog().getByLabel('Points de validation, un par ligne').fill('Champs requis\nMessage d’erreur');
  await dialog().getByRole('button', { name: 'Ajouter la tâche' }).click();
  await visible(dialog().getByRole('tab', { name: 'Tasks (2)' }));
  await visible(dialog().getByRole('list', { name: 'Tâches' }).getByText('Formulaire de login'));
  if (await dialog().getByText('Email et mot de passe').count()) throw new Error('la liste ne doit afficher que le nom');
  if ((await dialog().getByLabel('Nom de la tâche').inputValue()) !== '') throw new Error('formulaire non vidé');
});
const taskName = () => dialog().getByLabel('Nom de la tâche');
await check('R05b', 'modifier une tâche : champs remplis, bouton « Modifier la tâche »', async () => {
  await dialog().getByRole('button', { name: 'Modifier « Formulaire de login »' }).click();
  await hasValue(taskName(), 'Formulaire de login');
  await hasValue(dialog().getByLabel('Description de la tâche'), 'Email et mot de passe');
  await hasValue(dialog().getByLabel('Points de validation, un par ligne'), 'Champs requis\nMessage d’erreur');
  await taskName().fill('Formulaire de connexion');
  await dialog().getByRole('button', { name: 'Modifier la tâche' }).click();
  await visible(dialog().getByRole('list', { name: 'Tâches' }).getByText('Formulaire de connexion'));
  await visible(dialog().getByRole('button', { name: 'Ajouter la tâche' }));
  await hasValue(taskName(), '');
});
await check('R05b', 'annuler la modification remet le formulaire à vide', async () => {
  await dialog().getByRole('button', { name: 'Modifier « Formulaire de connexion »' }).click();
  await dialog().getByRole('button', { name: 'Annuler' }).click();
  await visible(dialog().getByRole('button', { name: 'Ajouter la tâche' }));
  await hasValue(taskName(), '');
});
await check('R05c', 'supprimer une tâche', async () => {
  await taskName().fill('Tâche jetable');
  await dialog().getByRole('button', { name: 'Ajouter la tâche' }).click();
  await visible(dialog().getByRole('tab', { name: 'Tasks (3)' }));
  await dialog().getByRole('button', { name: 'Supprimer « Tâche jetable »' }).click();
  await visible(page.getByText('Tâche « Tâche jetable » supprimée'));
  await visible(dialog().getByRole('tab', { name: 'Tasks (2)' }));
});
await shot('us-detail');

await check('R07', 'Accepter → l’US passe dans Accepted', async () => {
  await dialog().getByRole('button', { name: 'Accepter' }).click();
  await visible(page.getByText('« Se connecter » acceptée'));
  await visible(page.getByRole('tab', { name: 'Accepted (1)' }));
  await visible(page.getByRole('tab', { name: 'Sandbox (1)' }));
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: 'Accepted (1)' }).click();
  await visible(card('Se connecter'));
});
await shot('backlog');

await nav('Features');
const search = () => dialog().getByLabel('Rechercher une US à ajouter');
const found = () => dialog().getByRole('list', { name: 'US trouvées' });
const addStory = async (title) => {
  await search().fill(title);
  await dialog().getByRole('button', { name: `Ajouter « ${title} » à la feature` }).click();
};
const featureStories = () => dialog().getByRole('list', { name: 'User stories de la feature' });
await check('R03b', 'modal feature : onglet User stories, ajouter une US sans feature', async () => {
  await card('Authentification').click();
  await dialog().getByRole('tab', { name: 'User stories (1)' }).click();
  await visible(featureStories().getByText('Se connecter'));
  await search().fill('DECO');
  await visible(found().getByText('Se déconnecter'));
  await search().fill('xyz');
  await visible(found().getByText('Aucune US ne correspond à « xyz ».'));
  await search().fill('deco');
  await search().press('Enter');
  await visible(dialog().getByRole('tab', { name: 'User stories (2)' }));
  await visible(dialog().getByText('Aucune US sans feature. Crée-en depuis le Backlog.'));
  await visible(page.getByText('2 US'));
});
await check('R03b', 'modal feature : retirer une US', async () => {
  await dialog().getByRole('button', { name: 'Retirer « Se connecter » de la feature' }).click();
  await visible(dialog().getByRole('tab', { name: 'User stories (1)' }));
  await visible(page.getByText('1 US'));
  await page.keyboard.press('Escape');
  await hidden(dialog());
});
await check('R03b', 'création de feature avec une US ajoutée en brouillon', async () => {
  await page.getByRole('button', { name: 'New Feature' }).click();
  await dialog().getByLabel('Titre').fill('Profil');
  await dialog().getByRole('tab', { name: 'User stories (0)' }).click();
  await addStory('Se connecter');
  await visible(featureStories().getByText('Se connecter'));
  await dialog().getByRole('tab', { name: 'Details' }).click();
  await dialog().getByRole('button', { name: 'Créer la feature' }).click();
  await hidden(dialog());
  await visible(card('Profil').getByText('1 US'));
});
await check('R02c', 'modifier une feature : même modal, détails pré-remplis', async () => {
  await card('Profil').click();
  await visible(dialog().getByRole('tab', { name: 'Details', selected: true }));
  await hasValue(dialog().getByLabel('Titre'), 'Profil');
  await dialog().getByLabel('Description').fill('Compte et préférences');
  await dialog().getByRole('button', { name: 'Enregistrer' }).click();
  await visible(page.getByText('Feature mise à jour'));
  await hidden(dialog());
  await visible(card('Profil').getByText('Compte et préférences'));
});
await shot('features');

await nav('Backlog');
await check('R03b', 'backlog : features mises à jour sur les cards', async () => {
  await visible(card('Se déconnecter').getByText('Authentification'));
  await page.getByRole('tab', { name: /Accepted/ }).click();
  await visible(card('Se connecter').getByText('Profil'));
});

await nav('Planning');
await check('--', 'planning : page vide (calendrier à venir)', async () => {
  await visible(page.getByRole('heading', { name: 'Planning' }));
  if (await page.getByLabel('Nom du sprint').count()) throw new Error('lancement encore sur le Planning');
});

await nav('Sprint');
const sprintMenu = () => page.getByLabel('Sprint affiché');
await check('R08', 'sprint : aucun sprint, modal de lancement avec seulement les US acceptées', async () => {
  await visible(page.getByText("Aucun sprint pour l'instant."));
  if (await sprintMenu().count()) throw new Error('menu affiché sans sprint');
  await page.getByRole('button', { name: 'Nouveau sprint' }).click();
  await visible(dialog().getByRole('checkbox', { name: /Se connecter/ }));
  if (await dialog().getByText('Se déconnecter').count()) throw new Error('US en Sandbox proposée');
  if (!(await dialog().getByRole('button', { name: /Lancer le sprint/ }).isDisabled())) throw new Error('lancement possible sans US');
  await expectModalSize('lancement');
});
await check('R09', 'lancer un sprint depuis la page Sprint', async () => {
  await dialog().getByRole('checkbox', { name: /Se connecter/ }).click();
  await dialog().getByLabel('Nom du sprint').fill('Sprint 1');
  await dialog().getByRole('button', { name: 'Lancer le sprint (1 US, 5 pts)' }).click();
  await visible(page.getByText('Sprint « Sprint 1 » lancé'));
  await hidden(dialog());
  await hasValue(sprintMenu(), await sprintMenu().locator('option', { hasText: 'Sprint 1 — en cours' }).getAttribute('value'));
  await visible(page.getByRole('button', { name: 'Clôturer le sprint' }));
});


await nav('Backlog');
await check('R03c', 'détail US : rouvre sur Details, formulaire pré-rempli', async () => {
  await page.getByRole('tab', { name: /Accepted/ }).click();
  await card('Se connecter').click();
  await visible(dialog().getByRole('tab', { name: 'Details', selected: true }));
  const title = await dialog().getByLabel('Titre').inputValue();
  const velocity = await dialog().getByLabel('Vélocité').inputValue();
  const feature = await dialog().getByLabel('Feature').locator('option:checked').textContent();
  if (`${title}|${velocity}|${feature}` !== 'Se connecter|5|Profil') throw new Error(`obtenu ${title}|${velocity}|${feature}`);
});
await shot('us-edit');
await check('R03c', 'modifier titre, description, vélocité et feature', async () => {
  await dialog().getByLabel('Titre').fill('Se connecter en SSO');
  await dialog().getByLabel('Description', { exact: true }).fill('Via le fournisseur d’identité');
  await dialog().getByLabel('Vélocité').selectOption('8');
  await dialog().getByLabel('Feature').selectOption({ label: 'Authentification' });
  await dialog().getByRole('button', { name: 'Enregistrer' }).click();
  await visible(page.getByText('US mise à jour'));
  await hidden(dialog());
  await visible(card('Se connecter en SSO').getByText('Authentification'));
});
await check('R03c', 'modifications conservées après rechargement', async () => {
  await page.reload();
  await page.getByRole('tab', { name: /Accepted/ }).click();
  await card('Se connecter en SSO').click();
  if ((await dialog().getByLabel('Vélocité').inputValue()) !== '8') throw new Error('vélocité non conservée');
  if ((await dialog().getByLabel('Description', { exact: true }).inputValue()) !== 'Via le fournisseur d’identité') throw new Error('description non conservée');
});


// ---------- Page Sprint (spec 007) ----------
const US = 'Se connecter en SSO';
const row = () => page.getByRole('region', { name: US });
const column = (label) => row().getByLabel(label, { exact: true });
const taskCard = (title) => row().getByRole('button', { name: new RegExp(`^${title}`) });
/** Glisser-déposer « à la main » : le CDK attend des déplacements de souris progressifs. */
async function drag(title, to) {
  const from = await taskCard(title).boundingBox();
  const target = await column(to).boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 5 });
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 15 });
  await page.mouse.up();
}
const inColumn = (title, label) => visible(column(label).getByRole('button', { name: new RegExp(`^${title}`) }));

await page.keyboard.press('Escape');
await hidden(dialog());
await nav('Sprint');
await check('R10', 'tableau : ligne US (titre, feature, vélocité) et 4 colonnes', async () => {
  await visible(row().getByText('Authentification'));
  await visible(row().getByText('8 pts'));
  for (const c of ['À faire', 'En cours', 'En validation', 'Terminé']) await visible(column(c));
  await inColumn('Formulaire de connexion', 'À faire');
  await visible(taskCard('Formulaire de connexion').getByText('0/2'));
});
await check('R11', 'vélocité totale du sprint dans l’en-tête', async () => {
  await visible(page.getByText('8 pts', { exact: true }).first());
});
await check('R14', 'déplacer en Terminé avec un point non coché : refusé', async () => {
  await drag('Formulaire de connexion', 'Terminé');
  await visible(page.getByText('tous les points de validation doivent être cochés'));
  await inColumn('Formulaire de connexion', 'À faire');
});
await check('R12', 'déplacer en En cours, conservé après rechargement', async () => {
  await drag('Formulaire de connexion', 'En cours');
  await inColumn('Formulaire de connexion', 'En cours');
  await page.reload();
  await inColumn('Formulaire de connexion', 'En cours');
});
await check('R15', 'cocher les points dans la modal puis déplacer en Terminé', async () => {
  await taskCard('Formulaire de connexion').click();
  await dialog().getByRole('checkbox', { name: 'Champs requis' }).click();
  await dialog().getByRole('checkbox', { name: 'Message d’erreur' }).click();
  await page.keyboard.press('Escape');
  await hidden(dialog());
  await visible(taskCard('Formulaire de connexion').getByText('2/2'));
  await drag('Formulaire de connexion', 'Terminé');
  await inColumn('Formulaire de connexion', 'Terminé');
});
await check('R15b', 'décocher un point d’une tâche Terminé : refusé', async () => {
  await taskCard('Formulaire de connexion').click();
  await dialog().getByRole('checkbox', { name: 'Champs requis' }).click();
  await visible(page.getByText('Sors d’abord la tâche de Terminé.').or(page.getByText("Sors d'abord la tâche de Terminé.")));
  await page.keyboard.press('Escape');
  await hidden(dialog());
  await visible(taskCard('Formulaire de connexion').getByText('2/2'));
});
await check('R12b', 'carte « + » : créer une tâche dans À faire', async () => {
  await row().getByRole('button', { name: `Ajouter une tâche à « ${US} »` }).click();
  await visible(dialog().getByRole('heading', { name: 'Nouvelle tâche' }));
  await dialog().getByLabel('Nom de la tâche').fill('Tâche du sprint');
  await dialog().getByRole('button', { name: 'Ajouter la tâche' }).click();
  await hidden(dialog());
  await inColumn('Tâche du sprint', 'À faire');
});
await check('R12c', 'modifier puis supprimer une tâche depuis le tableau', async () => {
  await taskCard('Tâche du sprint').click();
  await dialog().getByRole('tab', { name: 'Details' }).click();
  await hasValue(dialog().getByLabel('Nom de la tâche'), 'Tâche du sprint');
  await dialog().getByLabel('Nom de la tâche').fill('Tâche du sprint 2');
  await dialog().getByRole('button', { name: 'Modifier la tâche' }).click();
  await hidden(dialog());
  await inColumn('Tâche du sprint 2', 'À faire');
  await taskCard('Tâche du sprint 2').click();
  await dialog().getByRole('button', { name: 'Supprimer « Tâche du sprint 2 »' }).click();
  await visible(page.getByText('Tâche « Tâche du sprint 2 » supprimée'));
  await hidden(dialog());
  if (await taskCard('Tâche du sprint 2').count()) throw new Error('tâche encore affichée');
});
await shot('sprint');

await check('R54', 'tâche du sprint : onglets Points de validation / Details ; création sans onglets', async () => {
  await taskCard('Formulaire de connexion').click();
  await visible(dialog().getByRole('tab', { name: /^Points de validation \(\d+\)$/, selected: true }));
  await visible(dialog().getByRole('list', { name: 'Points de validation' }).getByRole('checkbox', { name: 'Champs requis' }));
  await dialog().getByRole('tab', { name: 'Details' }).click();
  await hasValue(dialog().getByLabel('Nom de la tâche'), 'Formulaire de connexion');
  await page.keyboard.press('Escape');
  await hidden(dialog());
  await row().getByRole('button', { name: `Ajouter une tâche à « ${US} »` }).click();
  await visible(dialog().getByText('Pas encore de points de validation'));
  if (await dialog().getByRole('tab').count()) throw new Error('onglets à la création');
  await visible(dialog().getByLabel('Nom de la tâche'));
  await page.keyboard.press('Escape');
  await hidden(dialog());
});
await check('R49', 'toutes les modals ont la même taille, quel que soit l’onglet', async () => {
  const open = async (name, trigger, tabs = []) => {
    await trigger.click();
    await expectModalSize(name);
    for (const tab of tabs) {
      await dialog().getByRole('tab', { name: tab }).click();
      await expectModalSize(`${name} › ${tab}`);
    }
    await page.keyboard.press('Escape');
    await hidden(dialog());
  };
  await open('tâche du sprint', taskCard('Formulaire de connexion'), ['Details']);
  await open('nouvelle tâche', row().getByRole('button', { name: `Ajouter une tâche à « ${US} »` }));
  await open('clôture', page.getByRole('button', { name: 'Clôturer le sprint' }));
  await nav('Backlog');
  await open('nouvelle US', page.getByRole('button', { name: 'New Story' }), [/Tasks/]);
  await page.getByRole('tab', { name: /Accepted/ }).click();
  await open('détail US', card(US), [/Tasks/]);
  await nav('Features');
  await open('nouvelle feature', page.getByRole('button', { name: 'New Feature' }), [/User stories/]);
  await open('détail feature', page.getByRole('main').getByRole('button').filter({ hasText: / US$/ }).first(), [/User stories/]);
  await nav('Sprint');
  await visible(row());
});

await check('R16b', 'clôture : pré-cochage « Reporter » (une tâche n’est pas Terminé), cases exclusives', async () => {
  await drag('Tâche initiale', 'En cours');
  await inColumn('Tâche initiale', 'En cours');
  await page.getByRole('button', { name: 'Clôturer le sprint' }).click();
  const close = dialog().getByRole('checkbox', { name: `Clore « ${US} »` });
  const carry = dialog().getByRole('checkbox', { name: `Reporter « ${US} »` });
  if (!(await carry.isChecked()) || (await close.isChecked())) throw new Error('pré-cochage attendu : Reporter');
  await close.click();
  await isChecked(close, true);
  await isChecked(carry, false);
  await carry.click();
  await isChecked(carry, true);
});
await shot('close');
await check('R17', 'clôturer : sprint clos en lecture seule, US « Reportée »', async () => {
  await dialog().getByRole('button', { name: 'Clôturer le sprint' }).click();
  await visible(page.getByText('Sprint « Sprint 1 » clôturé'));
  await hidden(dialog());
  await visible(page.getByRole('button', { name: 'Nouveau sprint' }));
  await visible(row().getByText('Reportée'));
  if (await row().getByRole('button', { name: /Ajouter une tâche/ }).count()) throw new Error('carte « + » sur un sprint clos');
  await taskCard('Formulaire de connexion').click();
  await dialog().getByRole('tab', { name: 'Details' }).click();
  await visible(dialog().getByText('Via le fournisseur').or(dialog().getByText('Email et mot de passe')));
  if (await dialog().getByRole('button', { name: 'Modifier la tâche' }).count()) throw new Error('modification possible sur un sprint clos');
  await page.keyboard.press('Escape');
  await hidden(dialog());
});
await check('R17', 'nouveau sprint : US reportée pré-cochée, lancement bloqué sans US', async () => {
  await page.getByRole('button', { name: 'Nouveau sprint' }).click();
  const box = dialog().getByRole('checkbox', { name: new RegExp(US) });
  if (!(await box.isChecked())) throw new Error('US reportée non pré-cochée');
  await visible(dialog().getByRole('button', { name: 'Lancer le sprint (1 US, 8 pts)' }));
  await box.click();
  if (!(await dialog().getByRole('button', { name: /Lancer le sprint/ }).isDisabled())) throw new Error('lancement possible sans US');
  await box.click();
  await dialog().getByLabel('Nom du sprint').fill('Sprint 2');
  await dialog().getByRole('button', { name: 'Lancer le sprint (1 US, 8 pts)' }).click();
  await hidden(dialog());
  await hasValue(sprintMenu(), await sprintMenu().locator('option', { hasText: 'Sprint 2 — en cours' }).getAttribute('value'));
});
await check('R18', 'statuts conservés après report', async () => {
  await inColumn('Formulaire de connexion', 'Terminé');
  await inColumn('Tâche initiale', 'En cours');
});
await check('R19', 'sprint clos : photo des tâches à la clôture', async () => {
  await drag('Tâche initiale', 'En validation');
  await inColumn('Tâche initiale', 'En validation');
  await sprintMenu().selectOption({ label: 'Sprint 1' });
  await inColumn('Tâche initiale', 'En cours');
  await sprintMenu().selectOption({ label: 'Sprint 2 — en cours' });
  await inColumn('Tâche initiale', 'En validation');
});
await check('R17b', 'clôture sans case : l’US retourne dans Accepted', async () => {
  await page.getByRole('button', { name: 'Clôturer le sprint' }).click();
  await dialog().getByRole('checkbox', { name: `Reporter « ${US} »` }).click();
  await dialog().getByRole('button', { name: 'Clôturer le sprint' }).click();
  await hidden(dialog());
  await visible(row().getByText('Retournée au backlog'));
  await nav('Backlog');
  await page.getByRole('tab', { name: /Accepted/ }).click();
  await visible(card(US));
});
await check('R16', 'clôture « Clore » : US terminée, en lecture seule dans le Backlog', async () => {
  await nav('Sprint');
  await page.getByRole('button', { name: 'Nouveau sprint' }).click();
  await dialog().getByRole('checkbox', { name: new RegExp(US) }).click();
  await dialog().getByLabel('Nom du sprint').fill('Sprint 3');
  await dialog().getByRole('button', { name: /Lancer le sprint \(1 US/ }).click();
  await hidden(dialog());
  await page.getByRole('button', { name: 'Clôturer le sprint' }).click();
  await dialog().getByRole('checkbox', { name: `Clore « ${US} »` }).click();
  await dialog().getByRole('button', { name: 'Clôturer le sprint' }).click();
  await hidden(dialog());
  await visible(row().getByText('Close', { exact: true }));
  await nav('Backlog');
  await page.getByRole('tab', { name: /Done/ }).click();
  await card(US).click();
  await visible(dialog().getByText('US terminée : elle ne se modifie plus.'));
  if (!(await dialog().getByLabel('Titre').isDisabled())) throw new Error('titre modifiable');
  await page.keyboard.press('Escape');
});

// ---------- Statut des US d'une feature (spec 005) ----------
// Mise en place par l'API : une US par état dans « Authentification », et « Archiver », terminée sans feature.
const api = async (method, path, data) => {
  const res = await page.request.fetch(`${BASE}/api${path}`, { method, data });
  if (!res.ok()) throw new Error(`${method} ${path} → ${res.status()}`);
  return res.status() === 204 ? null : res.json();
};
const auth = (await api('GET', '/features')).find((f) => f.title === 'Authentification').id;
const story = async (title, feature_id, tasks = ['t']) =>
  (await api('POST', '/user-stories', { title, velocity: 1, feature_id, tasks: tasks.map((title) => ({ title })) }));
const exporter = (await story('Exporter', auth)).id;
const imported = await story('Importer', auth, ['Lire le fichier', 'Valider le format']);
const importer = imported.id;
const archiver = (await story('Archiver', null)).id;
for (const id of [exporter, importer, archiver]) await api('POST', `/user-stories/${id}/validate`);
const s4 = (await api('POST', '/sprints', { name: 'Sprint 4', user_story_ids: [importer, archiver] })).id;
await api('POST', `/sprints/${s4}/close`, { closed_user_story_ids: [archiver], carried_user_story_ids: [importer] });
await api('POST', '/sprints', { name: 'Sprint 5', user_story_ids: [importer] });
// Importer : 1 tâche en Terminé, 1 en validation (ne compte pas) → 50 %
await api('PATCH', `/tasks/${imported.tasks[0].id}/status`, { status: 'done' });
await api('PATCH', `/tasks/${imported.tasks[1].id}/status`, { status: 'in_review' });

await nav('Features');
const storyLine = (title) => featureStories().getByRole('listitem').filter({ hasText: title });
await check('R03f', 'modal feature : badge de statut de chaque US', async () => {
  await card('Authentification').click();
  await dialog().getByRole('tab', { name: /User stories/ }).click();
  for (const [title, status] of [['Se déconnecter', 'En attente'], ['Exporter', 'Planifié'], ['Importer', 'En cours'], [US, 'Terminé']])
    await visible(storyLine(title).getByText(status, { exact: true }));
});
await shot('feature-status');
await check('R03g', 'US terminée : pas d’icône « Retirer », absente de la recherche', async () => {
  await visible(dialog().getByRole('button', { name: 'Retirer « Exporter » de la feature' }));
  if (await dialog().getByRole('button', { name: `Retirer « ${US} » de la feature` }).count()) throw new Error('US terminée retirable');
  if (await dialog().getByText('Archiver').count()) throw new Error('US terminée proposée à l’ajout');
  await page.keyboard.press('Escape');
  await hidden(dialog());
});

// ---------- Barres de progression (spec 005) ----------
const bar = (title) => page.getByRole('progressbar', { name: `Avancement de « ${title} »` });
const percent = (title, expected) =>
  until(async () => (await bar(title).getAttribute('aria-valuenow')) === String(expected), `${title} : ${expected} % attendu`);
await check('R47', 'feature : US terminées sur le nombre d’US ; pas de barre sans US', async () => {
  await nav('Features');
  await percent('Authentification', 25);
  await visible(card('Authentification').getByText('25 %'));
  if (await bar('Profil').count()) throw new Error('barre sur une feature sans US');
});
await check('R46', 'US : tâches en Terminé sur le total, « En validation » non comptée, US terminée à 100 %', async () => {
  await card('Authentification').click();
  await dialog().getByRole('tab', { name: /User stories/ }).click();
  await percent('Importer', 50);
  await percent(US, 100);
  await page.keyboard.press('Escape');
  await hidden(dialog());
  await nav('Backlog');
  await page.getByRole('tab', { name: /Done/ }).click();
  await percent(US, 100);
  if (!(await bar(US).locator('[data-slot=progress-indicator]').getAttribute('class')).includes('bg-emerald-500')) throw new Error('barre à 100 % pas verte');
  await nav('Sprint');
  await percent('Importer', 50);
});
await shot('progress');
await check('R48', 'passer une tâche en Terminé sur le Sprint → la barre avance dans le Backlog', async () => {
  const importRow = page.getByRole('region', { name: 'Importer' });
  const from = await importRow.getByRole('button', { name: /^Valider le format/ }).boundingBox();
  const to = await importRow.getByLabel('Terminé', { exact: true }).boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 15 });
  await page.mouse.up();
  await percent('Importer', 100);
  await nav('Backlog');
  await page.getByRole('tab', { name: /Accepted/ }).click();
  await percent('Importer', 100);
});

// ---------- Cadre et thème (spec 008) ----------
/** Attend qu'une condition soit vraie (animations de la barre, application du thème). */
async function until(fn, message) {
  for (let i = 0; i < 50; i++) {
    if (await fn()) return;
    await page.waitForTimeout(100);
  }
  throw new Error(message);
}
const menuButton = (p) => p.getByRole('button', { name: 'Afficher ou masquer le menu' });
const sidebarBox = (p) => p.locator('app-sidebar aside').boundingBox();
const isDark = (p) => p.evaluate(() => document.documentElement.classList.contains('dark'));

await check('R40', 'barre latérale : logo, nom du projet, 4 pages avec icône, page active en bleu', async () => {
  await nav('Backlog');
  const sidebar = page.getByRole('navigation', { name: 'Navigation principale' });
  for (const name of ['Backlog', 'Features', 'Planning', 'Sprint']) await visible(sidebar.getByRole('link', { name }));
  if ((await sidebar.locator('ng-icon').count()) !== 4) throw new Error('il manque des icônes');
  await visible(page.locator('app-sidebar').getByText('FireScrum').first());
  const active = await sidebar.getByRole('link', { name: 'Backlog' }).getAttribute('class');
  if (!active.includes('bg-sidebar-accent')) throw new Error('page active non surlignée');
});
await check('R41', 'grand écran : barre repliée en icônes, conservée après rechargement', async () => {
  await menuButton(page).click();
  await until(async () => (await sidebarBox(page)).width < 120, 'barre non repliée');
  await page.reload();
  await until(async () => (await sidebarBox(page)).width < 120, 'repli non conservé');
  await nav('Features');
  await visible(page.getByRole('heading', { name: 'Features' }));
  await menuButton(page).click();
  await until(async () => (await sidebarBox(page)).width > 200, 'barre non dépliée');
});
await check('R43', 'mode sombre : pages et modals sombres, choix conservé', async () => {
  await page.getByRole('button', { name: 'Passer en mode sombre' }).click();
  await until(() => isDark(page), 'mode sombre non appliqué');
  await page.reload();
  await until(() => isDark(page), 'mode sombre non conservé');
  await nav('Backlog');
  await page.getByRole('button', { name: 'New Story' }).click();
  const bg = await dialog().evaluate((el) => getComputedStyle(el).backgroundColor);
  const [r, g, b] = bg.match(/\d+/g).map(Number);
  if (r + g + b > 200) throw new Error(`modal claire en mode sombre (${bg})`);
  await page.keyboard.press('Escape');
  await hidden(dialog());
  await page.getByRole('button', { name: 'Passer en mode clair' }).click();
  await until(async () => !(await isDark(page)), 'retour au mode clair impossible');
});
await check('R42', 'mobile : barre ouverte par-dessus la page, refermée par le fond', async () => {
  const mobile = await browser.newPage({ viewport: { width: 390, height: 780 } });
  try {
    await mobile.goto(`${BASE}/backlog`);
    const isOpen = async () => {
      const box = await sidebarBox(mobile);
      return box.x + box.width > 0;
    };
    await until(async () => !(await isOpen()), 'barre visible au chargement');
    await menuButton(mobile).click();
    await until(isOpen, 'barre non ouverte');
    await mobile.mouse.click(360, 400);
    await until(async () => !(await isOpen()), 'barre non refermée par le fond');
  } finally {
    await mobile.close();
  }
});
await check('R44', 'premier lancement avec le système en sombre : app en mode sombre', async () => {
  const dark = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
  try {
    await dark.goto(`${BASE}/backlog`);
    await until(() => isDark(dark), 'préférence système ignorée');
  } finally {
    await dark.close();
  }
});

console.log(errors.length ? `Erreurs :\n${errors.join('\n')}` : 'Aucune erreur inattendue');
console.log(`---- ${ok} OK / ${ko} KO`);
await browser.close();
process.exit(ko ? 1 : 0);
