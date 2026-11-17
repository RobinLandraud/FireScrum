import { test, expect, createFeature, createStory, startSprint, closeSprint } from '../../fixtures';

// Spec 003-backlog: R03, R04
test.describe('create', () => {
  test('R04 vélocité non Fibonacci refusée', async ({ call }) => {
    const res = await call('POST', '/user-stories', { title: 'X', velocity: 4, tasks: [{ title: 't' }] });
    expect(res.status(), 'vélocité non Fibonacci refusée').toBe(400);
  });

  test('R03 feature inexistante, sans tâche ou tâche sans nom refusées', async ({ call }) => {
    const create = (data: object) => call('POST', '/user-stories', { title: 'X', velocity: 1, ...data });
    expect(
      (await create({ feature_id: 9999, tasks: [{ title: 't' }] })).status(),
      'US sur feature inexistante',
    ).toBe(404);
    expect((await create({ tasks: [] })).status(), 'US sans tâche refusée').toBe(400);
    expect((await create({ tasks: [{ title: ' ' }] })).status(), 'US avec une tâche sans nom refusée').toBe(400);
  });

  test('R03 associer à une feature inexistante, ou une US inexistante', async ({ api, call }) => {
    const feature = await createFeature(api, 'Backlog');
    const story = await createStory(api, 'US C');
    expect(
      (await call('PATCH', `/user-stories/${story.id}/feature`, { feature_id: 9999 })).status(),
      'associer à une feature inexistante',
    ).toBe(404);
    expect(
      (await call('PATCH', '/user-stories/9999/feature', { feature_id: feature.id })).status(),
      'associer une US inexistante',
    ).toBe(404);
  });
});

// Spec 003-backlog: R03c, R03e
test.describe('edit', () => {
  test('R03c modifier : vélocité invalide, feature ou US inexistante', async ({ api, call }) => {
    const story = await createStory(api, 'US B', { velocity: 3 });
    const path = `/user-stories/${story.id}`;
    expect((await call('PUT', path, { title: 'US B2', velocity: 4 })).status(), 'modifier : vélocité invalide').toBe(400);
    expect(
      (await call('PUT', path, { title: 'US B2', velocity: 3, feature_id: 9999 })).status(),
      'modifier : feature inexistante',
    ).toBe(404);
    expect(
      (await call('PUT', '/user-stories/9999', { title: 'X', velocity: 3 })).status(),
      'modifier une US inexistante',
    ).toBe(404);
  });

  test('R03e US terminée : modification et changement de feature refusés', async ({ api, call }) => {
    const done = await createStory(api, 'US B', { accepted: true });
    const sprint = await startSprint(api, 'S1', [done.id]);
    await closeSprint(api, sprint.id, { closed: [done.id] });
    expect(
      (await call('PUT', `/user-stories/${done.id}`, { title: 'x', velocity: 1 })).status(),
      'modifier une US terminée refusé',
    ).toBe(409);
    expect(
      (await call('PATCH', `/user-stories/${done.id}/feature`, { feature_id: null })).status(),
      'changer la feature d’une US terminée refusé',
    ).toBe(409);
  });
});
