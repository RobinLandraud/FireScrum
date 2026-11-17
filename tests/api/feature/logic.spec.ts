import { test, expect, createFeature, createStory } from '../../fixtures';

// Spec 005-features: R02, R02b, R02c
test.describe('create and edit', () => {
  test('R02 créer une feature', async ({ call }) => {
    expect((await call('POST', '/features', { title: 'Backlog' })).status(), 'créer une feature').toBe(201);
  });

  test('R02b créer une feature avec une US sans feature', async ({ api, call }) => {
    const story = await createStory(api, 'US B');
    const res = await call('POST', '/features', { title: 'F2', user_story_ids: [story.id] });
    expect(res.status(), 'créer une feature avec une US sans feature').toBe(201);
    const feature = await res.json();
    expect(
      feature.user_stories.map((s: { id: number }) => s.id),
      'la US est rattachée à la nouvelle feature',
    ).toEqual([story.id]);
  });

  test('R02c modifier une feature', async ({ api, call }) => {
    const feature = await createFeature(api, 'Backlog');
    const res = await call('PUT', `/features/${feature.id}`, { title: 'Backlog 2', description: 'desc' });
    expect(res.status(), 'modifier une feature').toBe(204);
    const [updated] = await api('GET', '/features');
    expect(`${updated.title}|${updated.description}`, 'feature modifiée').toBe('Backlog 2|desc');
  });
});

// Spec 003-backlog: R03 — spec 002-modele-et-api: R06
test.describe('nested user stories', () => {
  test('R03 la feature ne contient que ses US', async ({ api }) => {
    const feature = await createFeature(api, 'Backlog');
    const a = await createStory(api, 'US A', { featureId: feature.id });
    await createStory(api, 'US B');
    const [listed] = await api('GET', '/features');
    expect(
      listed.user_stories.map((s: { id: number }) => s.id),
      'la feature ne contient que US A',
    ).toEqual([a.id]);
  });

  test('R06 backlog imbriqué persistant', async ({ api }) => {
    const feature = await createFeature(api, 'Backlog');
    await createStory(api, 'US A', { featureId: feature.id, tasks: [{ title: 'T1', validation_points: ['p1', 'p2'] }] });
    const [listed] = await api('GET', '/features');
    expect(listed.user_stories[0].tasks[0].validation_points, 'backlog imbriqué persistant').toHaveLength(2);
  });
});
