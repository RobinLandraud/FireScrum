import {
  test,
  expect,
  dialog,
  createStory,
  startSprint,
  setTaskStatus,
  checkPoint,
  taskCard,
  expectInColumn,
  drag,
} from '../helpers';

const US = 'Se connecter en SSO';
const TASK = 'Formulaire de connexion';

// Spec 004-taches / 007-page-sprint: R14, R15, R15b
test.describe('validation points', () => {
  let task: { id: number; validation_points: { id: number }[] };

  test.beforeEach(async ({ api }) => {
    const story = await createStory(api, US, {
      tasks: [{ title: TASK, validation_points: ['Champs requis', 'Message d’erreur'] }],
      accepted: true,
    });
    task = story.tasks[0];
    await startSprint(api, 'Sprint 1', [story.id]);
  });

  test('R14 déplacer en Terminé avec un point non coché : refusé', async ({ page }) => {
    await page.goto('/sprint');
    await expect(taskCard(page, US, TASK).getByText('0/2')).toBeVisible();
    await drag(page, US, TASK, 'Terminé');
    await expect(page.getByText('tous les points de validation doivent être cochés')).toBeVisible();
    await expectInColumn(page, US, TASK, 'À faire');
  });

  test('R15 cocher les points dans la modal puis déplacer en Terminé', async ({ page, api }) => {
    await setTaskStatus(api, task.id, 'in_progress');
    await page.goto('/sprint');
    await taskCard(page, US, TASK).click();
    await dialog(page).getByRole('checkbox', { name: 'Champs requis' }).click();
    await dialog(page).getByRole('checkbox', { name: 'Message d’erreur' }).click();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(taskCard(page, US, TASK).getByText('2/2')).toBeVisible();
    await drag(page, US, TASK, 'Terminé');
    await expectInColumn(page, US, TASK, 'Terminé');
  });

  test('R15b décocher un point d’une tâche Terminé : refusé', async ({ page, api }) => {
    for (const point of task.validation_points) await checkPoint(api, point.id);
    await setTaskStatus(api, task.id, 'done');
    await page.goto('/sprint');
    await taskCard(page, US, TASK).click();
    await dialog(page).getByRole('checkbox', { name: 'Champs requis' }).click();
    await expect(page.getByText('Sors d’abord la tâche de Terminé.').or(page.getByText("Sors d'abord la tâche de Terminé."))).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(taskCard(page, US, TASK).getByText('2/2')).toBeVisible();
  });
});
