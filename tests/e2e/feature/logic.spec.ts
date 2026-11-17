import { test, expect, dialog, card, nav, progressBar, createFeature, createStory, type Page } from '../helpers';
import { seedStatuses } from './seed';

const search = (page: Page) => dialog(page).getByLabel('Rechercher une US à ajouter');
const found = (page: Page) => dialog(page).getByRole('list', { name: 'US trouvées' });
const featureStories = (page: Page) => dialog(page).getByRole('list', { name: 'User stories de la feature' });

/** Adds a user story without feature from the "User stories" tab of the open feature modal. */
async function addStory(page: Page, title: string) {
  await search(page).fill(title);
  await dialog(page).getByRole('button', { name: `Ajouter « ${title} » à la feature` }).click();
}

// Spec 005-features: R02, R02c
test.describe('create and edit', () => {
  test('R02 créer une feature depuis la modal', async ({ page }) => {
    await page.goto('/features');
    await page.getByRole('button', { name: 'New Feature' }).click();
    await expect(dialog(page).getByRole('heading', { name: 'Nouvelle feature' })).toBeVisible();
    await dialog(page).getByRole('tab', { name: 'User stories (0)' }).click();
    await expect(dialog(page).getByText('Aucune US sans feature. Crée-en depuis le Backlog.')).toBeVisible();
    await dialog(page).getByRole('tab', { name: 'Details' }).click();
    await dialog(page).getByLabel('Titre').fill('Authentification');
    await dialog(page).getByRole('button', { name: 'Créer la feature' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(card(page, 'Authentification')).toBeVisible();
    await expect(page.getByText('0 US')).toBeVisible();
  });

  test('R02c modifier une feature : même modal, détails pré-remplis', async ({ page, api }) => {
    await createFeature(api, 'Profil');
    await page.goto('/features');
    await card(page, 'Profil').click();
    await expect(dialog(page).getByRole('tab', { name: 'Details', selected: true })).toBeVisible();
    await expect(dialog(page).getByLabel('Titre')).toHaveValue('Profil');
    await dialog(page).getByLabel('Description').fill('Compte et préférences');
    await dialog(page).getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Feature mise à jour')).toBeVisible();
    await expect(dialog(page)).toBeHidden();
    await expect(card(page, 'Profil').getByText('Compte et préférences')).toBeVisible();
  });
});

// Spec 005-features: R03b
test.describe('user stories of a feature', () => {
  test('R03b modal feature : onglet User stories, ajouter une US sans feature', async ({ page, api }) => {
    const connect = await createStory(api, 'Se connecter');
    await createFeature(api, 'Authentification', { storyIds: [connect.id] });
    await createStory(api, 'Se déconnecter');
    await page.goto('/features');
    await card(page, 'Authentification').click();
    await dialog(page).getByRole('tab', { name: 'User stories (1)' }).click();
    await expect(featureStories(page).getByText('Se connecter')).toBeVisible();
    await search(page).fill('DECO');
    await expect(found(page).getByText('Se déconnecter')).toBeVisible();
    await search(page).fill('xyz');
    await expect(found(page).getByText('Aucune US ne correspond à « xyz ».')).toBeVisible();
    await search(page).fill('deco');
    await search(page).press('Enter');
    await expect(dialog(page).getByRole('tab', { name: 'User stories (2)' })).toBeVisible();
    await expect(dialog(page).getByText('Aucune US sans feature. Crée-en depuis le Backlog.')).toBeVisible();
    await expect(page.getByText('2 US')).toBeVisible();
  });

  test('R03b modal feature : retirer une US', async ({ page, api }) => {
    const connect = await createStory(api, 'Se connecter');
    const disconnect = await createStory(api, 'Se déconnecter');
    await createFeature(api, 'Authentification', { storyIds: [connect.id, disconnect.id] });
    await page.goto('/features');
    await card(page, 'Authentification').click();
    await dialog(page).getByRole('tab', { name: 'User stories (2)' }).click();
    await dialog(page).getByRole('button', { name: 'Retirer « Se connecter » de la feature' }).click();
    await expect(dialog(page).getByRole('tab', { name: 'User stories (1)' })).toBeVisible();
    await expect(page.getByText('1 US')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
  });

  test('R03b création de feature avec une US ajoutée en brouillon', async ({ page, api }) => {
    await createStory(api, 'Se connecter');
    await page.goto('/features');
    await page.getByRole('button', { name: 'New Feature' }).click();
    await dialog(page).getByLabel('Titre').fill('Profil');
    await dialog(page).getByRole('tab', { name: 'User stories (0)' }).click();
    await addStory(page, 'Se connecter');
    await expect(featureStories(page).getByText('Se connecter')).toBeVisible();
    await dialog(page).getByRole('tab', { name: 'Details' }).click();
    await dialog(page).getByRole('button', { name: 'Créer la feature' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(card(page, 'Profil').getByText('1 US')).toBeVisible();
  });

  test('R03b backlog : features mises à jour sur les cards', async ({ page, api }) => {
    await createFeature(api, 'Authentification');
    await createStory(api, 'Se déconnecter');
    await page.goto('/features');
    await card(page, 'Authentification').click();
    await dialog(page).getByRole('tab', { name: /User stories/ }).click();
    await addStory(page, 'Se déconnecter');
    await expect(dialog(page).getByRole('tab', { name: 'User stories (1)' })).toBeVisible();
    await page.keyboard.press('Escape');
    await nav(page, 'Backlog');
    await expect(card(page, 'Se déconnecter').getByText('Authentification')).toBeVisible();
  });
});

// Spec 005-features: R03f, R47
test.describe('status and progress', () => {
  test.beforeEach(async ({ api }) => {
    await seedStatuses(api);
  });

  test('R03f modal feature : badge de statut de chaque US', async ({ page }) => {
    await page.goto('/features');
    await card(page, 'Authentification').click();
    await dialog(page).getByRole('tab', { name: /User stories/ }).click();
    const line = (title: string) => featureStories(page).getByRole('listitem').filter({ hasText: title });
    for (const [title, status] of [
      ['Se déconnecter', 'En attente'],
      ['Exporter', 'Planifié'],
      ['Importer', 'En cours'],
      ['Se connecter', 'Terminé'],
    ])
      await expect(line(title).getByText(status, { exact: true })).toBeVisible();
  });

  test('R47 feature : US terminées sur le nombre d’US ; pas de barre sans US', async ({ page }) => {
    await page.goto('/features');
    await expect(progressBar(page, 'Authentification')).toHaveAttribute('aria-valuenow', '25');
    await expect(card(page, 'Authentification').getByText('25 %')).toBeVisible();
    await expect(progressBar(page, 'Profil')).toHaveCount(0);
  });
});
