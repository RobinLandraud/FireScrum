import { test as base, expect, type Page } from '@playwright/test';
import pg from 'pg';

export { expect, type Page };

export type Api = <T = any>(method: string, path: string, data?: unknown) => Promise<T>;

/** Every spec imports `test` from here: empty database before each test, console watched. */
export const test = base.extend<{ resetDb: void; errors: string[]; api: Api }, { db: pg.Client }>({
  db: [
    async ({}, use) => {
      const db = new pg.Client({
        // Set by the e2e service of docker-compose.test.yml.
        host: process.env.DB_HOST,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
      });
      await db.connect();
      await use(db);
      await db.end();
    },
    { scope: 'worker' },
  ],

  // Keeps the `project` row, created by the first migration.
  resetDb: [
    async ({ db }, use) => {
      await db.query(
        'TRUNCATE feature, user_story, task, validation_point, sprint, sprint_user_story RESTART IDENTITY CASCADE',
      );
      await use();
    },
    { auto: true },
  ],

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

  // Arrange through the API: the calls show up in the trace.
  api: async ({ request }, use) => {
    await use(async (method, path, data) => {
      const res = await request.fetch(`/api${path}`, { method, data });
      if (!res.ok()) throw new Error(`${method} ${path} → ${res.status()} ${await res.text()}`);
      return res.status() === 204 ? null : res.json();
    });
  },
});

// ---------- Seed factories (arrange through the API) ----------

type TaskSeed = string | { title: string; description?: string; validation_points?: string[] };

export const createFeature = (api: Api, title: string, { description = '', storyIds = [] as number[] } = {}) =>
  api('POST', '/features', { title, description, user_story_ids: storyIds });

/** A user story with its tasks; `accepted` validates it (Accepted tab). */
export async function createStory(
  api: Api,
  title: string,
  { velocity = 1, featureId = null as number | null, tasks = ['t'] as TaskSeed[], accepted = false } = {},
) {
  const story = await api('POST', '/user-stories', {
    title,
    description: '',
    velocity,
    feature_id: featureId,
    tasks: tasks.map((t) => (typeof t === 'string' ? { title: t } : t)).map((t) => ({ description: '', validation_points: [], ...t })),
  });
  if (accepted) await api('POST', `/user-stories/${story.id}/validate`);
  return story;
}

export const startSprint = (api: Api, name: string, storyIds: number[]) =>
  api('POST', '/sprints', { name, user_story_ids: storyIds });

export const closeSprint = (api: Api, id: number, { closed = [] as number[], carried = [] as number[] } = {}) =>
  api('POST', `/sprints/${id}/close`, { closed_user_story_ids: closed, carried_user_story_ids: carried });

export const setTaskStatus = (api: Api, id: number, status: 'todo' | 'in_progress' | 'in_review' | 'done') =>
  api('PATCH', `/tasks/${id}/status`, { status });

export const checkPoint = (api: Api, id: number) => api('PATCH', `/validation-points/${id}`, { checked: true });

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
}
