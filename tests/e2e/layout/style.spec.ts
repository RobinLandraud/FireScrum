import { test, expect, dialog, nav, type Page } from '../helpers';

const menuButton = (page: Page) => page.getByRole('button', { name: 'Afficher ou masquer le menu' });
const sidebarWidth = async (page: Page) => (await page.locator('app-sidebar aside').boundingBox())!.width;
const isDark = (page: Page) => page.evaluate(() => document.documentElement.classList.contains('dark'));

// Spec 008-style-tailadmin: R40, R41, R43
test.describe('sidebar and theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/backlog');
  });

  test('R40 barre latérale : logo, nom du projet, 4 pages avec icône, page active en bleu', async ({ page }) => {
    const sidebar = page.getByRole('navigation', { name: 'Navigation principale' });
    for (const name of ['Backlog', 'Features', 'Planning', 'Sprint'])
      await expect(sidebar.getByRole('link', { name })).toBeVisible();
    await expect(sidebar.locator('ng-icon')).toHaveCount(4);
    await expect(page.locator('app-sidebar').getByText('FireScrum').first()).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Backlog' })).toHaveClass(/bg-sidebar-accent/);
  });

  test('R41 grand écran : barre repliée en icônes, conservée après rechargement', async ({ page }) => {
    await menuButton(page).click();
    await expect.poll(() => sidebarWidth(page), { message: 'sidebar not collapsed' }).toBeLessThan(120);
    await page.reload();
    await expect.poll(() => sidebarWidth(page), { message: 'collapse not kept' }).toBeLessThan(120);
    await nav(page, 'Features');
    await expect(page.getByRole('heading', { name: 'Features' })).toBeVisible();
    await menuButton(page).click();
    await expect.poll(() => sidebarWidth(page), { message: 'sidebar not expanded' }).toBeGreaterThan(200);
  });

  test('R43 mode sombre : pages et modals sombres, choix conservé', async ({ page }) => {
    await page.getByRole('button', { name: 'Passer en mode sombre' }).click();
    await expect.poll(() => isDark(page)).toBe(true);
    await page.reload();
    await expect.poll(() => isDark(page), { message: 'dark mode not kept' }).toBe(true);
    await page.getByRole('button', { name: 'New Story' }).click();
    const bg = await dialog(page).evaluate((el) => getComputedStyle(el).backgroundColor);
    const [r, g, b] = bg.match(/\d+/g)!.map(Number);
    expect(r + g + b, `light modal in dark mode (${bg})`).toBeLessThanOrEqual(200);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await page.getByRole('button', { name: 'Passer en mode clair' }).click();
    await expect.poll(() => isDark(page)).toBe(false);
  });
});

// Spec 008-style-tailadmin: R42
test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test('R42 mobile : barre ouverte par-dessus la page, refermée par le fond', async ({ page }) => {
    await page.goto('/backlog');
    const isOpen = async () => {
      const box = (await page.locator('app-sidebar aside').boundingBox())!;
      return box.x + box.width > 0;
    };
    await expect.poll(isOpen, { message: 'sidebar visible on load' }).toBe(false);
    await menuButton(page).click();
    await expect.poll(isOpen, { message: 'sidebar not opened' }).toBe(true);
    await page.mouse.click(360, 400);
    await expect.poll(isOpen, { message: 'sidebar not closed by the backdrop' }).toBe(false);
  });
});

// Spec 008-style-tailadmin: R44
test.describe('system dark theme', () => {
  test.use({ colorScheme: 'dark' });

  test('R44 premier lancement avec le système en sombre : app en mode sombre', async ({ page }) => {
    await page.goto('/backlog');
    await expect.poll(() => isDark(page), { message: 'system preference ignored' }).toBe(true);
  });
});

// Spec 006-planning
test('planning : page vide (calendrier à venir)', async ({ page }) => {
  await page.goto('/planning');
  await expect(page.getByRole('heading', { name: 'Planning' })).toBeVisible();
  await expect(page.getByLabel('Nom du sprint')).toHaveCount(0);
});
