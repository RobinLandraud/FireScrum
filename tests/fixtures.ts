import { test as base, expect, type APIResponse } from '@playwright/test';
import pg from 'pg';

export { expect };

// TODO: type the responses with contracts/ (UserStoryOut, SprintDetailOut…).
export type Api = <T = any>(method: string, path: string, data?: unknown) => Promise<T>;
export type Call = (method: string, path: string, data?: unknown) => Promise<APIResponse>;

/** Shared by the api and e2e projects: empty database before each test, API helpers. */
export const test = base.extend<{ resetDb: void; api: Api; call: Call }, { db: pg.Client }>({
  db: [
    async ({}, use) => {
      const db = new pg.Client({
        // Set by the tests service of docker-compose.test.yml.
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

  // Raw response, to check a status code (400, 404, 409…). The calls show up in the trace.
  call: async ({ request }, use) => {
    await use((method, path, data) => request.fetch(`/api${path}`, { method, data }));
  },

  // Arrange through the API: throws if the response is not OK.
  api: async ({ call }, use) => {
    await use(async (method, path, data) => {
      const res = await call(method, path, data);
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
