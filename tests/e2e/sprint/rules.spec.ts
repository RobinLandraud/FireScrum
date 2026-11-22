import { test, expect, dialog, launchBox, createStory, closeSprint, type Page } from '../helpers';
import { US, seedRunningSprint } from './seed';

const launchButton = (page: Page) => dialog(page).getByRole('button', { name: /Lancer le sprint/ });

// Spec 006-planning / 007-page-sprint: R08, R17
test.describe('launch needs a user story', () => {
  test('R08 lancement bloqué sans US', async ({ page, api }) => {
    await createStory(api, 'Se connecter', { velocity: 5, accepted: true });
    await page.goto('/sprint');
    await page.getByRole('button', { name: 'Nouveau sprint' }).click();
    await expect(launchBox(page, 'Se connecter')).toBeVisible();
    await expect(launchButton(page)).toBeDisabled();
  });

  test('R17 nouveau sprint : lancement bloqué si on décoche l’US reportée', async ({ page, api }) => {
    const { story, sprint } = await seedRunningSprint(api, { advanced: true });
    await closeSprint(api, sprint.id, { carried: [story.id] });
    await page.goto('/sprint');
    await page.getByRole('button', { name: 'Nouveau sprint' }).click();
    const box = launchBox(page, US);
    await expect(box).toBeChecked();
    await box.click();
    await expect(launchButton(page)).toBeDisabled();
  });
});
