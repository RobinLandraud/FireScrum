import { test, expect } from '../../fixtures';

// Spec 002-modele-et-api: R01
test('R01 projet unique', async ({ call }) => {
  const res = await call('GET', '/project');
  expect(res.status(), 'projet unique').toBe(200);
  expect((await res.json()).name, 'nom du projet').toBe('FireScrum');
});

// Health check (formerly only in the Bruno collection)
test('Health : l’API et la base répondent', async ({ call }) => {
  const res = await call('GET', '/health');
  expect(res.status(), 'API joignable').toBe(200);
  expect((await res.json()).db, 'base joignable').toBe(true);
});
