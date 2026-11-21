import type { Page } from '@playwright/test';
import { test as base, expect } from '../fixtures';

// Shared fixtures and factories; `test` is overridden below with the browser console watch.
export * from '../fixtures';
export { type Page };

/** Every e2e spec imports `test` from here: shared fixtures, plus the browser console watched. */
export const test = base.extend<{ errors: string[] }>({
  // Unexpected JS or console errors fail the test. 400/404/409 are triggered on purpose by some tests.
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error' && !/status of (400|404|409)/.test(m.text())) errors.push(m.text());
      });
      await use(errors);
      expect(errors, 'unexpected errors in the browser console').toEqual([]);
    },
    { auto: true },
  ],
});

// ---------- Locators ----------

export const dialog = (page: Page) => page.getByRole('dialog');
export const card = (page: Page, title: string) => page.getByRole('button', { name: new RegExp(`^${title}`) });
export const nav = (page: Page, name: string) => page.getByRole('navigation').getByRole('link', { name }).click();
/** All modals have the same size: 1024 × 85% of the height (680 px in the 1280 × 800 window).
 *  Polls until the opening zoom animation ends, otherwise the box is measured mid-zoom. */
export const expectModalSize = (page: Page, name: string) =>
  expect
    .poll(
      async () => {
        const box = await dialog(page).boundingBox();
        return box && `${Math.round(box.width)} × ${Math.round(box.height)}`;
      },
      { message: `${name} modal size` },
    )
    .toBe('1024 × 680');

export const progressBar = (page: Page, title: string) =>
  page.getByRole('progressbar', { name: `Avancement de « ${title} »` });

// ---------- Sprint board ----------

/** The row of a user story on the Sprint page. */
export const row = (page: Page, us: string) => page.getByRole('region', { name: us });
export const column = (page: Page, us: string, label: string) => row(page, us).getByLabel(label, { exact: true });
export const taskCard = (page: Page, us: string, title: string) =>
  row(page, us).getByRole('button', { name: new RegExp(`^${title}`) });
export const addTaskButton = (page: Page, us: string) =>
  row(page, us).getByRole('button', { name: `Ajouter une tâche à « ${us} »` });

export const expectInColumn = (page: Page, us: string, title: string, label: string) =>
  expect(column(page, us, label).getByRole('button', { name: new RegExp(`^${title}`) })).toBeVisible();

/** Manual drag and drop: the CDK expects progressive mouse moves. */
export async function drag(page: Page, us: string, title: string, to: string) {
  const from = (await taskCard(page, us, title).boundingBox())!;
  const target = (await column(page, us, to).boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 5 });
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 15 });
  await page.mouse.up();
  // The drop (and the status save) fires only once the settle animation is over.
  await expect(page.locator('.cdk-drag-preview')).toHaveCount(0);
}
