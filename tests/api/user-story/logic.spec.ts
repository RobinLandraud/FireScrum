import { test, expect, createFeature, createStory, startSprint, closeSprint } from '../../fixtures';

// Spec 003-backlog: R03, R03c
test.describe('create and edit', () => {
  test('R03 créer une US dans une feature, avec 2 tâches', async ({ api, call }) => {
    const feature = await createFeature(api, 'Backlog');
    const res = await call('POST', '/user-stories', {
      title: 'US A',
      velocity: 2,
      feature_id: feature.id,
      tasks: [{ title: 'T1', description: 'Détail de T1', validation_points: ['p1', 'p2'] }, { title: 'T2' }],
    });
    expect(res.status(), 'créer une US dans une feature, avec 2 tâches').toBe(201);
    const story = await res.json();
    expect(
      story.tasks.map((t: { title: string; validation_points: unknown[] }) => `${t.title}:${t.validation_points.length}`),
      'tâches créées avec l’US',
    ).toEqual(['T1:2', 'T2:0']);
    expect(story.feature_id, 'US rattachée à la feature').toBe(feature.id);
  });

  test('R03 créer une US sans feature', async ({ call }) => {
    const res = await call('POST', '/user-stories', { title: 'US B', velocity: 3, tasks: [{ title: 't' }] });
    expect(res.status(), 'créer une US sans feature').toBe(201);
    expect((await res.json()).feature_id, 'US sans feature : feature_id null').toBeNull();
  });

  test('R03 associer une US à une feature, puis l’en retirer', async ({ api, call }) => {
    const feature = await createFeature(api, 'Backlog');
    const story = await createStory(api, 'US C', { velocity: 5 });
    const path = `/user-stories/${story.id}/feature`;
    expect((await call('PATCH', path, { feature_id: feature.id })).status(), 'associer une US à une feature').toBe(204);
    expect((await call('PATCH', path, { feature_id: null })).status(), 'retirer une US de sa feature').toBe(204);
  });

  test('R03 liste de toutes les US', async ({ api }) => {
    const feature = await createFeature(api, 'Backlog');
    await createStory(api, 'US A', { featureId: feature.id });
    await createStory(api, 'US B');
    await createStory(api, 'US C');
    expect(await api('GET', '/user-stories'), 'liste de toutes les US').toHaveLength(3);
  });

  test('R03c modifier une US', async ({ api, call }) => {
    const story = await createStory(api, 'US B', { velocity: 3 });
    const res = await call('PUT', `/user-stories/${story.id}`, {
      title: 'US B2',
      description: 'd',
      velocity: 3,
      feature_id: null,
    });
    expect(res.status(), 'modifier une US').toBe(204);
    const updated = (await api('GET', '/user-stories')).find((s: { id: number }) => s.id === story.id);
    expect(`${updated.title} ${updated.velocity} ${updated.description}`, 'US modifiée').toBe('US B2 3 d');
  });
});

// Spec 003-backlog: R07 — spec 005-features: R03f
test.describe('validation and status', () => {
  test('R07 valider une US', async ({ api, call }) => {
    const story = await createStory(api, 'US A');
    expect((await call('POST', `/user-stories/${story.id}/validate`)).status(), 'valider une US').toBe(204);
  });

  test('R03f statuts des US', async ({ api }) => {
    const done = await createStory(api, 'US C', { accepted: true });
    const inSprint = await createStory(api, 'US A', { accepted: true });
    const planned = await createStory(api, 'US G', { accepted: true });
    const pending = await createStory(api, 'US E');
    const s1 = await startSprint(api, 'S1', [done.id, inSprint.id]);
    await closeSprint(api, s1.id, { closed: [done.id], carried: [inSprint.id] });
    await startSprint(api, 'S2', [inSprint.id]);
    const stories = await api('GET', '/user-stories');
    const status = (id: number) => stories.find((s: { id: number }) => s.id === id).status;
    expect(
      [done, inSprint, planned, pending].map((s) => status(s.id)).join(' '),
      'statuts des US',
    ).toBe('done in_progress planned pending');
  });
});
