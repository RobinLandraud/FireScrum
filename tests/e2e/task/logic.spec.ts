import {
  test,
  expect,
  dialog,
  card,
  createStory,
  startSprint,
  taskCard,
  addTaskButton,
  expectInColumn,
  drag,
  type Page,
} from '../helpers';

const taskName = (page: Page) => dialog(page).getByLabel('Nom de la tâche');
const taskList = (page: Page) => dialog(page).getByRole('list', { name: 'Tâches' });

// Spec 004-taches: R05, R05b, R05c
test.describe('tasks of a user story (Backlog)', () => {
  test('R05 onglet Tasks : ajouter une tâche (nom, description, points)', async ({ page, api }) => {
    await createStory(api, 'Se connecter', { velocity: 5, tasks: ['Tâche initiale'] });
    await page.goto('/backlog');
    await card(page, 'Se connecter').click();
    await expect(dialog(page).getByRole('tab', { name: 'Details', selected: true })).toBeVisible();
    await expect(dialog(page).getByLabel('Vélocité')).toHaveValue('5');
    await dialog(page).getByRole('tab', { name: 'Tasks (1)' }).click();
    await expect(dialog(page).getByText('Tâche initiale')).toBeVisible();
    await taskName(page).fill('Formulaire de login');
    await dialog(page).getByLabel('Description de la tâche').fill('Email et mot de passe');
    await dialog(page).getByLabel('Points de validation, un par ligne').fill('Champs requis\nMessage d’erreur');
    await dialog(page).getByRole('button', { name: 'Ajouter la tâche' }).click();
    await expect(dialog(page).getByRole('tab', { name: 'Tasks (2)' })).toBeVisible();
    await expect(taskList(page).getByText('Formulaire de login')).toBeVisible();
    await expect(dialog(page).getByText('Email et mot de passe')).toHaveCount(0);
    await expect(taskName(page)).toHaveValue('');
  });

  test.describe('existing task', () => {
    test.beforeEach(async ({ page, api }) => {
      await createStory(api, 'Se connecter', {
        tasks: [
          'Tâche initiale',
          {
            title: 'Formulaire de login',
            description: 'Email et mot de passe',
            validation_points: ['Champs requis', 'Message d’erreur'],
          },
        ],
      });
      await page.goto('/backlog');
      await card(page, 'Se connecter').click();
      await dialog(page).getByRole('tab', { name: 'Tasks (2)' }).click();
    });

    test('R05b modifier une tâche : champs remplis, bouton « Modifier la tâche »', async ({ page }) => {
      await dialog(page).getByRole('button', { name: 'Modifier « Formulaire de login »' }).click();
      await expect(taskName(page)).toHaveValue('Formulaire de login');
      await expect(dialog(page).getByLabel('Description de la tâche')).toHaveValue('Email et mot de passe');
      await expect(dialog(page).getByLabel('Points de validation, un par ligne')).toHaveValue(
        'Champs requis\nMessage d’erreur',
      );
      await taskName(page).fill('Formulaire de connexion');
      await dialog(page).getByRole('button', { name: 'Modifier la tâche' }).click();
      await expect(taskList(page).getByText('Formulaire de connexion')).toBeVisible();
      await expect(dialog(page).getByRole('button', { name: 'Ajouter la tâche' })).toBeVisible();
      await expect(taskName(page)).toHaveValue('');
    });

    test('R05b annuler la modification remet le formulaire à vide', async ({ page }) => {
      await dialog(page).getByRole('button', { name: 'Modifier « Formulaire de login »' }).click();
      await dialog(page).getByRole('button', { name: 'Annuler' }).click();
      await expect(dialog(page).getByRole('button', { name: 'Ajouter la tâche' })).toBeVisible();
      await expect(taskName(page)).toHaveValue('');
    });

    test('R05c supprimer une tâche', async ({ page }) => {
      await taskName(page).fill('Tâche jetable');
      await dialog(page).getByRole('button', { name: 'Ajouter la tâche' }).click();
      await expect(dialog(page).getByRole('tab', { name: 'Tasks (3)' })).toBeVisible();
      await dialog(page).getByRole('button', { name: 'Supprimer « Tâche jetable »' }).click();
      await expect(page.getByText('Tâche « Tâche jetable » supprimée')).toBeVisible();
      await expect(dialog(page).getByRole('tab', { name: 'Tasks (2)' })).toBeVisible();
    });
  });
});

// Spec 007-page-sprint: R12, R12b, R12c — spec 009-modals-taille-fixe: R54
test.describe('tasks on the Sprint page', () => {
  const US = 'Se connecter en SSO';

  test.beforeEach(async ({ page, api }) => {
    const story = await createStory(api, US, {
      tasks: [
        { title: 'Formulaire de connexion', validation_points: ['Champs requis', 'Message d’erreur'] },
        'Tâche du sprint',
      ],
      accepted: true,
    });
    await startSprint(api, 'Sprint 1', [story.id]);
    await page.goto('/sprint');
  });

  test('R12 déplacer en En cours, conservé après rechargement', async ({ page }) => {
    await drag(page, US, 'Formulaire de connexion', 'En cours');
    await expectInColumn(page, US, 'Formulaire de connexion', 'En cours');
    await page.reload();
    await expectInColumn(page, US, 'Formulaire de connexion', 'En cours');
  });

  test('R12b carte « + » : créer une tâche dans À faire', async ({ page }) => {
    await addTaskButton(page, US).click();
    await expect(dialog(page).getByRole('heading', { name: 'Nouvelle tâche' })).toBeVisible();
    await taskName(page).fill('Nouvelle tâche du sprint');
    await dialog(page).getByRole('button', { name: 'Ajouter la tâche' }).click();
    await expect(dialog(page)).toBeHidden();
    await expectInColumn(page, US, 'Nouvelle tâche du sprint', 'À faire');
  });

  test('R12c modifier puis supprimer une tâche depuis le tableau', async ({ page }) => {
    await taskCard(page, US, 'Tâche du sprint').click();
    await dialog(page).getByRole('tab', { name: 'Details' }).click();
    await expect(taskName(page)).toHaveValue('Tâche du sprint');
    await taskName(page).fill('Tâche du sprint 2');
    await dialog(page).getByRole('button', { name: 'Modifier la tâche' }).click();
    await expect(dialog(page)).toBeHidden();
    await expectInColumn(page, US, 'Tâche du sprint 2', 'À faire');
    await taskCard(page, US, 'Tâche du sprint 2').click();
    await dialog(page).getByRole('button', { name: 'Supprimer « Tâche du sprint 2 »' }).click();
    await expect(page.getByText('Tâche « Tâche du sprint 2 » supprimée')).toBeVisible();
    await expect(dialog(page)).toBeHidden();
    await expect(taskCard(page, US, 'Tâche du sprint 2')).toHaveCount(0);
  });

  test('R54 tâche du sprint : onglets Points de validation / Details ; création sans onglets', async ({ page }) => {
    await taskCard(page, US, 'Formulaire de connexion').click();
    await expect(dialog(page).getByRole('tab', { name: /^Points de validation \(\d+\)$/, selected: true })).toBeVisible();
    await expect(
      dialog(page).getByRole('list', { name: 'Points de validation' }).getByRole('checkbox', { name: 'Champs requis' }),
    ).toBeVisible();
    await dialog(page).getByRole('tab', { name: 'Details' }).click();
    await expect(taskName(page)).toHaveValue('Formulaire de connexion');
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await addTaskButton(page, US).click();
    await expect(dialog(page).getByText('Pas encore de points de validation')).toBeVisible();
    await expect(dialog(page).getByRole('tab')).toHaveCount(0);
    await expect(taskName(page)).toBeVisible();
  });
});
