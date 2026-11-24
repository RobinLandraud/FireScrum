import {
  test,
  expect,
  dialog,
  velocity,
  card,
  nav,
  progressBar,
  createFeature,
  createStory,
  startSprint,
  closeSprint,
  setTaskStatus,
  type Page,
} from '../helpers';

/** Creates a user story from the "New Story" modal (a task is required). */
async function newStory(page: Page, title: string, { velocity: points = 0, feature = '' } = {}) {
  await page.getByRole('button', { name: 'New Story' }).click();
  await dialog(page).getByLabel('Titre').fill(title);
  if (points) await velocity(page, points).check();
  if (feature) await dialog(page).getByLabel('Feature').selectOption({ label: feature });
  await dialog(page).getByRole('tab', { name: /Tasks/ }).click();
  await dialog(page).getByLabel('Nom de la tâche').fill('Tâche initiale');
  await dialog(page).getByRole('button', { name: 'Ajouter la tâche' }).click();
  await dialog(page).getByRole('tab', { name: 'Details' }).click();
  await dialog(page).getByRole('button', { name: "Créer l'US" }).click();
}

/** Opens a user story of the Accepted tab. */
async function openAccepted(page: Page, title: string) {
  await page.goto('/backlog');
  await page.getByRole('tab', { name: /Accepted/ }).click();
  await card(page, title).click();
}

// Spec 003-backlog: empty backlog, R03
test.describe('create', () => {
  test('backlog vide, onglets avec compteurs', async ({ page }) => {
    await page.goto('/backlog');
    await expect(page.getByRole('tab', { name: 'Sandbox (0)' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Accepted (0)' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Done (0)' })).toBeVisible();
    await expect(page.getByText('Aucune US à valider.')).toBeVisible();
  });

  test('R03 New Story avec feature → card dans Sandbox', async ({ page, api }) => {
    await createFeature(api, 'Authentification');
    await page.goto('/backlog');
    await newStory(page, 'Se connecter', { velocity: 5, feature: 'Authentification' });
    await expect(dialog(page)).toBeHidden();
    await expect(page.getByRole('tab', { name: 'Sandbox (1)' })).toBeVisible();
    await expect(card(page, 'Se connecter').getByText('Authentification')).toBeVisible();
  });

  test('R03 New Story sans feature → « Sans feature »', async ({ page }) => {
    await page.goto('/backlog');
    await newStory(page, 'Se déconnecter');
    await expect(dialog(page)).toBeHidden();
    await expect(card(page, 'Se déconnecter').getByText('Sans feature')).toBeVisible();
  });
});

// Spec 003-backlog: R03c, R07
test.describe('edit and accept', () => {
  test.beforeEach(async ({ api }) => {
    const profil = await createFeature(api, 'Profil');
    await createFeature(api, 'Authentification');
    await createStory(api, 'Se connecter', { velocity: 5, featureId: profil.id, accepted: true });
  });

  test('R03c détail US : rouvre sur Details, formulaire pré-rempli', async ({ page }) => {
    await openAccepted(page, 'Se connecter');
    await expect(dialog(page).getByRole('tab', { name: 'Details', selected: true })).toBeVisible();
    await expect(dialog(page).getByLabel('Titre')).toHaveValue('Se connecter');
    await expect(velocity(page, 5)).toBeChecked();
    await expect(dialog(page).getByLabel('Feature').locator('option:checked')).toHaveText('Profil');
  });

  test('R03c modifier titre, description, vélocité et feature', async ({ page }) => {
    await openAccepted(page, 'Se connecter');
    await dialog(page).getByLabel('Titre').fill('Se connecter en SSO');
    await dialog(page).getByLabel('Description', { exact: true }).fill('Via le fournisseur d’identité');
    await velocity(page, 8).check();
    await dialog(page).getByLabel('Feature').selectOption({ label: 'Authentification' });
    await dialog(page).getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('US mise à jour')).toBeVisible();
    await expect(dialog(page)).toBeHidden();
    await expect(card(page, 'Se connecter en SSO').getByText('Authentification')).toBeVisible();
  });

  test('R03c modifications conservées après rechargement', async ({ page }) => {
    await openAccepted(page, 'Se connecter');
    await dialog(page).getByLabel('Description', { exact: true }).fill('Via le fournisseur d’identité');
    await velocity(page, 8).check();
    await dialog(page).getByRole('button', { name: 'Enregistrer' }).click();
    await expect(dialog(page)).toBeHidden();
    await page.reload();
    await page.getByRole('tab', { name: /Accepted/ }).click();
    await card(page, 'Se connecter').click();
    await expect(velocity(page, 8)).toBeChecked();
    await expect(dialog(page).getByLabel('Description', { exact: true })).toHaveValue('Via le fournisseur d’identité');
  });

  test('R74 vélocité : la bille se glisse jusqu’à une autre valeur', async ({ page }) => {
    await openAccepted(page, 'Se connecter');
    const from = await velocity(page, 5).boundingBox();
    const to = await velocity(page, 21).boundingBox();
    if (!from || !to) throw new Error('velocity picker not laid out');
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 });
    await expect(velocity(page, 21)).toBeChecked();
    await page.mouse.up();
    await expect(velocity(page, 21)).toBeChecked();
    await dialog(page).getByRole('button', { name: 'Enregistrer' }).click();
    await expect(dialog(page)).toBeHidden();
    await card(page, 'Se connecter').click();
    await expect(velocity(page, 21)).toBeChecked();
  });

  test('R07 Accepter → l’US passe dans Accepted', async ({ page, api }) => {
    await createStory(api, 'Se déconnecter');
    await page.goto('/backlog');
    await card(page, 'Se déconnecter').click();
    await dialog(page).getByRole('button', { name: 'Accepter' }).click();
    await expect(page.getByText('« Se déconnecter » acceptée')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Accepted (2)' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Sandbox (0)' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('tab', { name: 'Accepted (2)' }).click();
    await expect(card(page, 'Se déconnecter')).toBeVisible();
  });
});

// Spec 005-features: R46
test('R46 US : tâches en Terminé sur le total, « En validation » non comptée, US terminée à 100 %', async ({ page, api }) => {
  const auth = await createFeature(api, 'Authentification');
  const done = await createStory(api, 'Se connecter', { featureId: auth.id, accepted: true });
  const importer = await createStory(api, 'Importer', {
    featureId: auth.id,
    tasks: ['Lire le fichier', 'Valider le format'],
    accepted: true,
  });
  const s1 = await startSprint(api, 'Sprint 1', [done.id, importer.id]);
  await closeSprint(api, s1.id, { closed: [done.id], carried: [importer.id] });
  await startSprint(api, 'Sprint 2', [importer.id]);
  // Importer: 1 task in Done, 1 in review (not counted) → 50 %
  await setTaskStatus(api, importer.tasks[0].id, 'done');
  await setTaskStatus(api, importer.tasks[1].id, 'in_review');

  await page.goto('/features');
  await card(page, 'Authentification').click();
  await dialog(page).getByRole('tab', { name: /User stories/ }).click();
  await expect(progressBar(page, 'Importer')).toHaveAttribute('aria-valuenow', '50');
  await expect(progressBar(page, 'Se connecter')).toHaveAttribute('aria-valuenow', '100');
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();

  await nav(page, 'Backlog');
  await page.getByRole('tab', { name: /Done/ }).click();
  await expect(progressBar(page, 'Se connecter')).toHaveAttribute('aria-valuenow', '100');
  await expect(progressBar(page, 'Se connecter').locator('[data-slot=progress-indicator]')).toHaveClass(/bg-success/);

  await nav(page, 'Sprint');
  await expect(progressBar(page, 'Importer')).toHaveAttribute('aria-valuenow', '50');
});

// Test helper `card`: a title is matched as plain text, whole (code review, point 9)
test('card() : titre exact, caractères spéciaux sans effet, pas de confusion avec un titre plus long', async ({ page, api }) => {
  await createStory(api, 'Se connecter');
  await createStory(api, 'Se connecter en SSO (v2)');
  await page.goto('/backlog');
  await expect(card(page, 'Se connecter'), 'prefix of another title').toHaveCount(1);
  await expect(card(page, 'Se connecter en SSO (v2)'), 'parentheses in the title').toHaveCount(1);
});
