import { test, expect, createFeature, createStory, startSprint, closeSprint } from '../../fixtures';

// Spec 005-features: R02, R02c
test.describe('title and existence', () => {
  test('R02 titre vide refusé', async ({ call }) => {
    expect((await call('POST', '/features', { title: '  ' })).status(), 'titre vide refusé').toBe(400);
  });

  test('R02c modifier : titre vide refusé, feature inexistante', async ({ api, call }) => {
    const feature = await createFeature(api, 'Backlog');
    expect((await call('PUT', `/features/${feature.id}`, { title: ' ' })).status(), 'modifier : titre vide refusé').toBe(400);
    expect((await call('PUT', '/features/9999', { title: 'x' })).status(), 'modifier une feature inexistante').toBe(404);
  });
});

// Spec 005-features: R02b, R03g
test.describe('user stories given at creation', () => {
  test('R02b US déjà rattachée ou inexistante refusée, création annulée', async ({ api, call }) => {
    const feature = await createFeature(api, 'Backlog');
    const a = await createStory(api, 'US A', { featureId: feature.id });
    expect(
      (await call('POST', '/features', { title: 'F3', user_story_ids: [a.id] })).status(),
      'US ayant déjà une feature refusée',
    ).toBe(400);
    expect(
      (await call('POST', '/features', { title: 'F3', user_story_ids: [9999] })).status(),
      'US inexistante refusée',
    ).toBe(400);
    expect(await api('GET', '/features'), 'création refusée annulée (pas de F3)').toHaveLength(1);
  });

  test('R03g créer une feature avec une US terminée refusé', async ({ api, call }) => {
    const done = await createStory(api, 'US C', { accepted: true });
    const sprint = await startSprint(api, 'S1', [done.id]);
    await closeSprint(api, sprint.id, { closed: [done.id] });
    expect(
      (await call('POST', '/features', { title: 'F4', user_story_ids: [done.id] })).status(),
      'créer une feature avec une US terminée refusé',
    ).toBe(400);
  });
});
