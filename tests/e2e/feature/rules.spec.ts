import { test, expect, dialog, card } from '../helpers';
import { seedStatuses } from './seed';

// Spec 005-features: R03g
test('R03g US terminée : pas d’icône « Retirer », absente de la recherche', async ({ page, api }) => {
  await seedStatuses(api);
  await page.goto('/features');
  await card(page, 'Authentification').click();
  await dialog(page).getByRole('tab', { name: /User stories/ }).click();
  await expect(dialog(page).getByRole('button', { name: 'Retirer « Exporter » de la feature' })).toBeVisible();
  await expect(dialog(page).getByRole('button', { name: 'Retirer « Se connecter » de la feature' })).toHaveCount(0);
  await expect(dialog(page).getByText('Archiver')).toHaveCount(0);
});
