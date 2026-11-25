import { test, expect, nav, type Page } from '../helpers';

// Animated background (spec 013-fond-vivant-surfaces-depolies). Its state is read from `data-state`:
// animating | still | paused | fallback. R75 (halos following the pointer) is a visual check only.

const background = (page: Page) => page.locator('app-background');
const canvas = (page: Page) => background(page).locator('canvas');

/** Simulates the tab being hidden or shown again (a headless page is always visible). */
const setTabVisibility = (page: Page, state: 'hidden' | 'visible') =>
  page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', { value, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);

// Spec 013: R76, R78, R79 — with WebGL, off by default in the e2e tests (see helpers.ts).
test.describe('background with WebGL', () => {
  test.use({ webgl: true });

  test.beforeEach(async ({ page }) => {
    await page.goto('/backlog');
  });

  test('R79 onglet caché : animation en pause, puis reprise au retour', async ({ page }) => {
    await expect(background(page)).toHaveAttribute('data-state', 'animating');
    await setTabVisibility(page, 'hidden');
    await expect(background(page), 'not paused in a hidden tab').toHaveAttribute('data-state', 'paused');
    await setTabVisibility(page, 'visible');
    await expect(background(page), 'not resumed').toHaveAttribute('data-state', 'animating');
  });

  test('R78 décor : invisible au lecteur d’écran, jamais focus, clic qui traverse', async ({ page }) => {
    await expect(canvas(page)).toHaveAttribute('aria-hidden', 'true');
    await expect(background(page)).toHaveCSS('pointer-events', 'none');
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const onBackground = await page.evaluate(() => !!document.activeElement?.closest('app-background'));
      expect(onBackground, 'the background took the focus').toBe(false);
    }
    // A click on a link, with the background behind it, reaches the link.
    await nav(page, 'Features');
    await expect(page.getByRole('heading', { name: 'Features' })).toBeVisible();
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('R76 « réduire les animations » : fond fixe', async ({ page }) => {
      await expect(background(page)).toHaveAttribute('data-state', 'still');
      await page.mouse.move(600, 300);
      await expect(background(page), 'animates after a pointer move').toHaveAttribute('data-state', 'still');
    });
  });
});

// Spec 013: R77 — WebGL off (the e2e default): the static CSS fallback, and the app works.
test('R77 sans WebGL : dégradé fixe, sans erreur, l’app fonctionne', async ({ page }) => {
  await page.goto('/backlog');
  await expect(background(page)).toHaveAttribute('data-state', 'fallback');
  await expect(canvas(page)).toBeHidden();
  const image = await background(page).evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(image, 'no fallback gradient').toContain('radial-gradient');
  await nav(page, 'Features');
  await expect(page.getByRole('heading', { name: 'Features' })).toBeVisible();
  // Console errors fail the test on their own (the `errors` fixture of helpers.ts).
});
