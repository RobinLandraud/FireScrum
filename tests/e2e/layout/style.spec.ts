import type { Locator } from '@playwright/test';
import {
  test,
  expect,
  dialog,
  nav,
  card,
  taskCard,
  addTaskButton,
  expectModalSize,
  column,
  hold,
  expectInColumn,
  type Page,
} from '../helpers';
import { US, seedRunningSprint } from '../sprint/seed';

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

// Spec 009-modals-taille-fixe: R49 (the launch modal is measured in R08)
test('R49 toutes les modals ont la même taille, quel que soit l’onglet', async ({ page, api }) => {
  await seedRunningSprint(api);
  const open = async (name: string, trigger: Locator, tabs: (string | RegExp)[] = []) => {
    await trigger.click();
    await expectModalSize(page, name);
    for (const tab of tabs) {
      await dialog(page).getByRole('tab', { name: tab }).click();
      await expectModalSize(page, `${name} › ${tab}`);
    }
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
  };

  await page.goto('/sprint');
  await open('sprint task', taskCard(page, US, 'Formulaire de connexion'), ['Details']);
  await open('new task', addTaskButton(page, US));
  await open('close', page.getByRole('button', { name: 'Clôturer le sprint' }));
  await nav(page, 'Backlog');
  await open('new US', page.getByRole('button', { name: 'New Story' }), [/Tasks/]);
  await page.getByRole('tab', { name: /Accepted/ }).click();
  await open('US detail', card(page, US), [/Tasks/]);
  await nav(page, 'Features');
  await open('new feature', page.getByRole('button', { name: 'New Feature' }), [/User stories/]);
  await open('feature detail', card(page, 'Authentification'), [/User stories/]);
});

// Spec 012-style-neumorphique: R68, R69
test.describe('Sprint drag and drop', () => {
  test.beforeEach(async ({ page, api }) => {
    await seedRunningSprint(api);
    await page.goto('/sprint');
  });

  test('R68 tâche soulevée et inclinée, trace à l’origine, colonne visée marquée, statut enregistré', async ({ page }) => {
    await hold(page, US, 'Formulaire de connexion', 'En cours');
    const preview = page.locator('.cdk-drag-preview');
    await expect(preview, 'dragged task not tilted').toHaveCSS('rotate', '-2deg');
    await expect(column(page, US, 'À faire').locator('.cdk-drag-anchor'), 'no trace left at the origin').toHaveCount(1);
    await expect(column(page, US, 'En cours'), 'hovered column not marked').toHaveClass(/cdk-drop-list-dragging/);
    await page.mouse.up();
    await expect(preview).toHaveCount(0);
    await expectInColumn(page, US, 'Formulaire de connexion', 'En cours');
    await page.reload();
    await expectInColumn(page, US, 'Formulaire de connexion', 'En cours');
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('R69 « réduire les animations » : aucune transition sur les tâches', async ({ page }) => {
      const duration = await taskCard(page, US, 'Formulaire de connexion').evaluate(
        (el) => getComputedStyle(el).transitionDuration,
      );
      expect(duration.split(',').every((d) => parseFloat(d) === 0), `transition kept (${duration})`).toBe(true);
    });
  });
});

// Spec 006-planning
test('planning : page vide (calendrier à venir)', async ({ page }) => {
  await page.goto('/planning');
  await expect(page.getByRole('heading', { name: 'Planning' })).toBeVisible();
  await expect(page.getByLabel('Nom du sprint')).toHaveCount(0);
});
