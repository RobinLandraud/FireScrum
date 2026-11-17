import { test, expect, dialog, type Page } from '../helpers';

async function addTask(page: Page, name: string) {
  await dialog(page).getByLabel('Nom de la tâche').fill(name);
  await dialog(page).getByRole('button', { name: 'Ajouter la tâche' }).click();
}

// Spec 003-backlog: R03d, R03
test.describe('create rules', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/backlog');
  });

  test('R03d New Story : onglets Details/Tasks, création bloquée sans tâche', async ({ page }) => {
    await page.getByRole('button', { name: 'New Story' }).click();
    await expect(dialog(page).getByRole('heading', { name: 'Nouvelle user story' })).toBeVisible();
    await expect(dialog(page).getByRole('tab', { name: 'Details', selected: true })).toBeVisible();
    await dialog(page).getByLabel('Titre').fill('Brouillon');
    const create = dialog(page).getByRole('button', { name: "Créer l'US" });
    await expect(create).toBeDisabled();
    await expect(dialog(page).getByText("Ajoute au moins une tâche dans l'onglet Tasks.")).toBeVisible();
    await dialog(page).getByRole('tab', { name: 'Tasks (0)' }).click();
    await addTask(page, 'Brouillon A');
    await addTask(page, 'Brouillon B');
    await expect(dialog(page).getByRole('tab', { name: 'Tasks (2)' })).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Modifier « Brouillon A »' }).click();
    await expect(dialog(page).getByLabel('Nom de la tâche')).toHaveValue('Brouillon A');
    await dialog(page).getByLabel('Nom de la tâche').fill('Brouillon A2');
    await dialog(page).getByRole('button', { name: 'Modifier la tâche' }).click();
    await expect(dialog(page).getByText('Brouillon A2')).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Supprimer « Brouillon B »' }).click();
    await expect(dialog(page).getByRole('tab', { name: 'Tasks (1)' })).toBeVisible();
    await dialog(page).getByRole('tab', { name: 'Details' }).click();
    await expect(create).toBeEnabled();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(page.getByRole('tab', { name: 'Sandbox (0)' })).toBeVisible();
  });

  test('R03 titre blanc refusé → toast, modal reste ouverte', async ({ page }) => {
    await page.getByRole('button', { name: 'New Story' }).click();
    await dialog(page).getByLabel('Titre').fill('   ');
    await dialog(page).getByRole('tab', { name: /Tasks/ }).click();
    await addTask(page, 'Tâche initiale');
    await dialog(page).getByRole('tab', { name: 'Details' }).click();
    await dialog(page).getByRole('button', { name: "Créer l'US" }).click();
    await expect(page.getByText('le titre est requis')).toBeVisible();
    await expect(dialog(page)).toBeVisible();
  });
});
