import { test, expect, createStory, startSprint, closeSprint } from '../../fixtures';

// Spec 006-planning: R08, R09, R17b
test.describe('launch', () => {
  test('R08 sprint avec une US non validée ou terminée refusé', async ({ api, call }) => {
    const pending = await createStory(api, 'US A');
    expect(
      (await call('POST', '/sprints', { name: 'S1', user_story_ids: [pending.id] })).status(),
      'sprint avec US non validée refusé',
    ).toBe(400);

    const done = await createStory(api, 'US B', { accepted: true });
    const s1 = await startSprint(api, 'S1', [done.id]);
    await closeSprint(api, s1.id, { closed: [done.id] });
    expect(
      (await call('POST', '/sprints', { name: 'S2', user_story_ids: [done.id] })).status(),
      'US terminée refusée dans un sprint',
    ).toBe(400);
  });

  test('R09 deuxième sprint actif refusé', async ({ api, call }) => {
    const story = await createStory(api, 'US A', { accepted: true });
    await startSprint(api, 'S1', [story.id]);
    expect((await call('POST', '/sprints', { name: 'S2' })).status(), 'deuxième sprint actif refusé').toBe(409);
  });

  test('R17b lancement sans US refusé', async ({ call }) => {
    expect((await call('POST', '/sprints', { name: 'S2' })).status(), 'lancement sans US refusé').toBe(400);
  });
});

// Spec 007-page-sprint: R16, R17
test.describe('close', () => {
  test('R17 clôture : US à la fois close et reportée, ou hors du sprint, refusée', async ({ api, call }) => {
    const inSprint = await createStory(api, 'US B', { accepted: true });
    const outside = await createStory(api, 'US D', { accepted: true });
    const s1 = await startSprint(api, 'S1', [inSprint.id]);
    const close = (data: object) => call('POST', `/sprints/${s1.id}/close`, data);
    expect(
      (await close({ closed_user_story_ids: [inSprint.id], carried_user_story_ids: [inSprint.id] })).status(),
      'clôture : US à la fois close et reportée refusée',
    ).toBe(400);
    expect(
      (await close({ closed_user_story_ids: [outside.id] })).status(),
      'clôture : US hors du sprint refusée',
    ).toBe(400);
  });

  test('R16 re-clôture refusée', async ({ api, call }) => {
    const story = await createStory(api, 'US A', { accepted: true });
    const s1 = await startSprint(api, 'S1', [story.id]);
    await closeSprint(api, s1.id, { closed: [story.id] });
    expect((await call('POST', `/sprints/${s1.id}/close`, {})).status(), 're-clôture refusée').toBe(409);
  });
});
