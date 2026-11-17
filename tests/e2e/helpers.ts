import { test as base, expect, type Page } from '@playwright/test';
import pg from 'pg';

export { expect, type Page };

type Api = <T = any>(method: string, path: string, data?: unknown) => Promise<T>;

/** Every spec imports `test` from here: empty database before each test, console watched. */
export const test = base.extend<{ resetDb: void; errors: string[]; api: Api }, { db: pg.Client }>({
  db: [
    async ({}, use) => {
      const db = new pg.Client({
        host: '127.0.0.1',
        port: Number(process.env.DB_PORT ?? 5443),
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
export const progressBar = (page: Page, title: string) =>
  page.getByRole('progressbar', { name: `Avancement de « ${title} »` });
