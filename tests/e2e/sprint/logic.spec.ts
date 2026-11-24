import {
  test,
  expect,
  dialog,
  card,
  nav,
  row,
  column,
  taskCard,
  addTaskButton,
  expectInColumn,
  expectModalSize,
  launchBox,
  drag,
  progressBar,
  createStory,
  startSprint,
  closeSprint,
  setTaskStatus,
  type Page,
} from '../helpers';
import { US, seedRunningSprint } from './seed';

const sprintMenu = (page: Page) => page.getByLabel('Sprint affiché');
const closeButton = (page: Page) => page.getByRole('button', { name: 'Clôturer le sprint' });
const closeBox = (page: Page) => dialog(page).getByRole('checkbox', { name: `Clore « ${US} »` });
const carryBox = (page: Page) => dialog(page).getByRole('checkbox', { name: `Reporter « ${US} »` });

// Spec 006-planning: R08, R09
test.describe('launch', () => {
  test('R08 sprint : aucun sprint, modal de lancement avec seulement les US acceptées', async ({ page, api }) => {
    await createStory(api, 'Se connecter', { velocity: 5, accepted: true });
    await createStory(api, 'Se déconnecter');
    await page.goto('/sprint');
    await expect(page.getByText("Aucun sprint pour l'instant.")).toBeVisible();
    await expect(sprintMenu(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Nouveau sprint' }).click();
    await expect(launchBox(page, 'Se connecter')).toBeVisible();
    await expect(dialog(page).getByText('Se déconnecter')).toHaveCount(0);
    await expectModalSize(page, 'launch');
  });

  test('R09 lancer un sprint depuis la page Sprint', async ({ page, api }) => {
    await createStory(api, 'Se connecter', { velocity: 5, accepted: true });
    await page.goto('/sprint');
    await page.getByRole('button', { name: 'Nouveau sprint' }).click();
    await launchBox(page, 'Se connecter').click();
    await dialog(page).getByLabel('Nom du sprint').fill('Sprint 1');
    await dialog(page).getByRole('button', { name: 'Lancer le sprint (1 US, 5 pts)' }).click();
    await expect(page.getByText('Sprint « Sprint 1 » lancé')).toBeVisible();
    await expect(dialog(page)).toBeHidden();
    await expect(sprintMenu(page).locator('option:checked')).toHaveText('Sprint 1 — en cours');
    await expect(closeButton(page)).toBeVisible();
  });
});

// Spec 007-page-sprint: R10, R11
test.describe('board', () => {
  test.beforeEach(async ({ page, api }) => {
    await seedRunningSprint(api);
    await page.goto('/sprint');
  });

  test('R10 tableau : ligne US (titre, feature, vélocité) et 4 colonnes', async ({ page }) => {
    await expect(row(page, US).getByText('Authentification')).toBeVisible();
    await expect(row(page, US).getByText('8 pts')).toBeVisible();
    for (const c of ['À faire', 'En cours', 'En validation', 'Terminé']) await expect(column(page, US, c)).toBeVisible();
    await expectInColumn(page, US, 'Formulaire de connexion', 'À faire');
    await expect(taskCard(page, US, 'Formulaire de connexion').getByText('0/2')).toBeVisible();
  });

  test('R11 vélocité totale du sprint dans l’en-tête', async ({ page }) => {
    await expect(page.getByText('8 pts', { exact: true }).first()).toBeVisible();
  });
});

// Spec 007-page-sprint: R16, R16b, R17, R17b
test.describe('close', () => {
  test.beforeEach(async ({ page, api }) => {
    await seedRunningSprint(api, { advanced: true });
    await page.goto('/sprint');
  });

  test('R16b clôture : pré-cochage « Reporter » (une tâche n’est pas Terminé), cases exclusives', async ({ page }) => {
    await closeButton(page).click();
    await expect(carryBox(page)).toBeChecked();
    await expect(closeBox(page)).not.toBeChecked();
    await closeBox(page).click();
    await expect(closeBox(page)).toBeChecked();
    await expect(carryBox(page)).not.toBeChecked();
    await carryBox(page).click();
    await expect(carryBox(page)).toBeChecked();
  });

  test('R17 clôturer : sprint clos en lecture seule, US « Reportée »', async ({ page }) => {
    await closeButton(page).click();
    await dialog(page).getByRole('button', { name: 'Clôturer le sprint' }).click();
    await expect(page.getByText('Sprint « Sprint 1 » clôturé')).toBeVisible();
    await expect(dialog(page)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Nouveau sprint' })).toBeVisible();
    await expect(row(page, US).getByText('Reportée')).toBeVisible();
    await expect(addTaskButton(page, US)).toHaveCount(0);
    await taskCard(page, US, 'Formulaire de connexion').click();
    await dialog(page).getByRole('tab', { name: 'Details' }).click();
    await expect(dialog(page).getByText('Email et mot de passe')).toBeVisible();
    await expect(dialog(page).getByRole('button', { name: 'Modifier la tâche' })).toHaveCount(0);
  });

  test('R17b clôture sans case : l’US retourne dans Accepted', async ({ page }) => {
    await closeButton(page).click();
    await carryBox(page).click();
    await dialog(page).getByRole('button', { name: 'Clôturer le sprint' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(row(page, US).getByText('Retournée au backlog')).toBeVisible();
    await nav(page, 'Backlog');
    await page.getByRole('tab', { name: /Accepted/ }).click();
    await expect(card(page, US)).toBeVisible();
  });

  test('R16 clôture « Clore » : US terminée, en lecture seule dans le Backlog', async ({ page }) => {
    await closeButton(page).click();
    await closeBox(page).click();
    await dialog(page).getByRole('button', { name: 'Clôturer le sprint' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(row(page, US).getByText('Close', { exact: true })).toBeVisible();
    await nav(page, 'Backlog');
    await page.getByRole('tab', { name: /Done/ }).click();
    await card(page, US).click();
    await expect(dialog(page).getByText('US terminée : elle ne se modifie plus.')).toBeVisible();
    await expect(dialog(page).getByLabel('Titre')).toBeDisabled();
  });
});

// Spec 007-page-sprint: R17, R18, R19
test.describe('carried over', () => {
  test('R17 nouveau sprint : US reportée pré-cochée', async ({ page, api }) => {
    const { story, sprint } = await seedRunningSprint(api, { advanced: true });
    await closeSprint(api, sprint.id, { carried: [story.id] });
    await page.goto('/sprint');
    await page.getByRole('button', { name: 'Nouveau sprint' }).click();
    await expect(launchBox(page, US)).toBeChecked();
    await dialog(page).getByLabel('Nom du sprint').fill('Sprint 2');
    await dialog(page).getByRole('button', { name: 'Lancer le sprint (1 US, 8 pts)' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(sprintMenu(page).locator('option:checked')).toHaveText('Sprint 2 — en cours');
  });

  test.describe('in the next sprint', () => {
    test.beforeEach(async ({ page, api }) => {
      const { story, sprint } = await seedRunningSprint(api, { advanced: true });
      await closeSprint(api, sprint.id, { carried: [story.id] });
      await startSprint(api, 'Sprint 2', [story.id]);
      await page.goto('/sprint');
    });

    test('R18 statuts conservés après report', async ({ page }) => {
      await expectInColumn(page, US, 'Formulaire de connexion', 'Terminé');
      await expectInColumn(page, US, 'Tâche initiale', 'En cours');
    });

    test('R19 sprint clos : photo des tâches à la clôture', async ({ page }) => {
      await drag(page, US, 'Tâche initiale', 'En validation');
      await expectInColumn(page, US, 'Tâche initiale', 'En validation');
      await sprintMenu(page).selectOption({ label: 'Sprint 1' });
      await expectInColumn(page, US, 'Tâche initiale', 'En cours');
      await sprintMenu(page).selectOption({ label: 'Sprint 2 — en cours' });
      await expectInColumn(page, US, 'Tâche initiale', 'En validation');
    });
  });
});

// Spec 005-features: R48
test('R48 passer une tâche en Terminé sur le Sprint → la barre avance dans le Backlog', async ({ page, api }) => {
  const importer = await createStory(api, 'Importer', { tasks: ['Lire le fichier', 'Valider le format'], accepted: true });
  await startSprint(api, 'Sprint 1', [importer.id]);
  await setTaskStatus(api, importer.tasks[0].id, 'done');
  await setTaskStatus(api, importer.tasks[1].id, 'in_review');
  await page.goto('/sprint');
  await expect(progressBar(page, 'Importer')).toHaveAttribute('aria-valuenow', '50');
  await drag(page, 'Importer', 'Valider le format', 'Terminé');
  await expect(progressBar(page, 'Importer')).toHaveAttribute('aria-valuenow', '100');
  await nav(page, 'Backlog');
  await page.getByRole('tab', { name: /Accepted/ }).click();
  await expect(progressBar(page, 'Importer')).toHaveAttribute('aria-valuenow', '100');
});
