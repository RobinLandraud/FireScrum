import { test, expect } from '../../fixtures';

// Health check (formerly only in the Bruno collection)
test('Health : l’API et la base répondent', async ({ call }) => {
  const res = await call('GET', '/health');
  expect(res.status(), 'API joignable').toBe(200);
  expect((await res.json()).db, 'base joignable').toBe(true);
});
