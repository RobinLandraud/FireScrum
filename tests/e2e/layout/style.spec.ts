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
  drag,
  expectInColumn,
  type Page,
} from '../helpers';
import { US, seedRunningSprint } from '../sprint/seed';

const sidebar = (page: Page) => page.locator('app-sidebar aside');
/** Sidebar buttons (spec 013): collapse / expand toggle next to the title, theme toggle at the bottom. */
const sidebarButton = (page: Page, name: string) => sidebar(page).getByRole('button', { name });
const sidebarWidth = async (page: Page) => (await sidebar(page).boundingBox())!.width;
const isDark = (page: Page) => page.evaluate(() => document.documentElement.classList.contains('dark'));

// Spec 008-style-tailadmin and 013-fond-vivant-surfaces-depolies: R40, R41, R43, R80
test.describe('sidebar and theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/backlog');
  });

  test('R40 barre latérale : logo, nom du projet, repli à côté du titre, 4 pages, thème en bas, pas d’en-tête', async ({
    page,
  }) => {
    const links = page.getByRole('navigation', { name: 'Navigation principale' });
    for (const name of ['Backlog', 'Features', 'Planning', 'Sprint'])
      await expect(links.getByRole('link', { name })).toBeVisible();
    await expect(links.locator('ng-icon')).toHaveCount(4);
    const title = sidebar(page).getByText('FireScrum').first();
    await expect(title).toBeVisible();
    await expect(links.getByRole('link', { name: 'Backlog' })).toHaveClass(/bg-sidebar-accent/);

    // Collapse toggle on the title's line; theme toggle below the links.
    const toggle = (await sidebarButton(page, 'Réduire le menu').boundingBox())!;
    const titleBox = (await title.boundingBox())!;
    expect(Math.abs(toggle.y + toggle.height / 2 - (titleBox.y + titleBox.height)), 'toggle not next to the title').toBeLessThan(30);
    const theme = (await sidebarButton(page, 'Passer en mode sombre').boundingBox())!;
    const linksBox = (await links.boundingBox())!;
    expect(theme.y, 'theme toggle not below the links').toBeGreaterThan(linksBox.y + linksBox.height);
    await expect(page.getByRole('banner'), 'top header shown on a large screen').toBeHidden();
  });

  test('R41 grand écran : barre repliée en icônes, bouton sous le logo, conservée après rechargement', async ({ page }) => {
    await sidebarButton(page, 'Réduire le menu').click();
    await expect.poll(() => sidebarWidth(page), { message: 'sidebar not collapsed' }).toBeLessThan(120);
    await page.reload();
    await expect.poll(() => sidebarWidth(page), { message: 'collapse not kept' }).toBeLessThan(120);
    const expand = sidebarButton(page, 'Déplier le menu');
    const logo = (await sidebar(page).locator('ng-icon[name="matLocalFireDepartmentOutline"]').boundingBox())!;
    expect((await expand.boundingBox())!.y, 'toggle not under the logo').toBeGreaterThan(logo.y + logo.height);
    await nav(page, 'Features');
    await expect(page.getByRole('heading', { name: 'Features' })).toBeVisible();
    await expand.click();
    await expect.poll(() => sidebarWidth(page), { message: 'sidebar not expanded' }).toBeGreaterThan(200);
  });

  test('R80 thème depuis le bas de la barre : icône lune puis soleil, choix conservé', async ({ page }) => {
    const icon = (name: string) => sidebarButton(page, name).locator('ng-icon').innerHTML();
    const moon = await icon('Passer en mode sombre');
    await sidebarButton(page, 'Passer en mode sombre').click();
    await expect.poll(() => isDark(page)).toBe(true);
    const sun = await icon('Passer en mode clair');
    expect(sun, 'same icon in light and dark').not.toBe(moon);
    await page.reload();
    await expect.poll(() => isDark(page), { message: 'dark mode not kept' }).toBe(true);
    await expect(sidebarButton(page, 'Passer en mode clair')).toBeVisible();
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

// Spec 008-style-tailadmin and 013-fond-vivant-surfaces-depolies: R42
test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test('R42 mobile : barre ouverte par le bouton du haut, thème en bas, refermée par le fond ou son bouton', async ({
    page,
  }) => {
    await page.goto('/backlog');
    const isOpen = async () => {
      const box = (await sidebar(page).boundingBox())!;
      return box.x + box.width > 0;
    };
    const openButton = page.getByRole('banner').getByRole('button', { name: 'Ouvrir le menu' });
    await expect.poll(isOpen, { message: 'sidebar visible on load' }).toBe(false);
    await openButton.click();
    await expect.poll(isOpen, { message: 'sidebar not opened' }).toBe(true);
    await expect(sidebarButton(page, 'Passer en mode sombre'), 'no theme toggle in the open sidebar').toBeVisible();
    await page.mouse.click(360, 400);
    await expect.poll(isOpen, { message: 'sidebar not closed by the backdrop' }).toBe(false);
    await openButton.click();
    await sidebarButton(page, 'Fermer le menu').click();
    await expect.poll(isOpen, { message: 'sidebar not closed by its button' }).toBe(false);
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

  // Issue #23: in an empty column, the CDK appends the placeholder at the end of the drop list, after the "+".
  test('#23 tâche tenue au-dessus de « À faire » vide : l’emplacement reste au-dessus du « + »', async ({ page }) => {
    for (const title of ['Formulaire de connexion', 'Tâche initiale']) {
      await drag(page, US, title, 'En cours');
      await expectInColumn(page, US, title, 'En cours');
    }

    const add = (await addTaskButton(page, US).boundingBox())!;
    await hold(page, US, 'Formulaire de connexion', 'À faire');
    await page.mouse.move(add.x + add.width / 2, add.y + add.height - 2, { steps: 10 });
    const placeholder = column(page, US, 'À faire').locator('.cdk-drag-placeholder');
    await expect(placeholder, 'no landing slot in « À faire »').toHaveCount(1);
    const slot = (await placeholder.boundingBox())!;
    const plus = (await addTaskButton(page, US).boundingBox())!;
    expect(slot.y, 'landing slot shown below the « + »').toBeLessThan(plus.y);

    await page.mouse.up();
    await expect(page.locator('.cdk-drag-preview')).toHaveCount(0);
    const task = (await taskCard(page, US, 'Formulaire de connexion').boundingBox())!;
    expect(task.y, 'dropped task below the « + »').toBeLessThan((await addTaskButton(page, US).boundingBox())!.y);
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
