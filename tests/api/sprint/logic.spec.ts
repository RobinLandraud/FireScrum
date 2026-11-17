import {
  test,
  expect,
  createStory,
  startSprint,
  closeSprint,
  setTaskStatus,
  checkPoint,
  type Api,
} from '../../fixtures';

const ids = (stories: { id: number }[]) => stories.map((s) => s.id);

/** Three accepted user stories (2 + 3 + 5 pts); A has T1 (points p1, p2) and T2. */
async function seedStories(api: Api) {
  const a = await createStory(api, 'US A', {
    velocity: 2,
    tasks: [{ title: 'T1', validation_points: ['p1', 'p2'] }, 'T2'],
    accepted: true,
  });
  const b = await createStory(api, 'US B', { velocity: 3, accepted: true });
  const c = await createStory(api, 'US C', { velocity: 5, accepted: true });
  return { a, b, c };
}

// Spec 006-planning: R09 — spec 007-page-sprint: R10, R11
test.describe('launch', () => {
  test('R09 lancer un sprint', async ({ api, call }) => {
    const { a, b, c } = await seedStories(api);
    const res = await call('POST', '/sprints', { name: 'S1', user_story_ids: ids([a, b, c]) });
    expect(res.status(), 'lancer un sprint').toBe(201);
  });

  test('R10 R11 sprint actuel : ses US et sa vélocité totale', async ({ api }) => {
    const { a, b, c } = await seedStories(api);
    await startSprint(api, 'S1', ids([a, b, c]));
    const current = await api('GET', '/sprints/current');
    expect(current.user_stories, '3 US dans le sprint actuel').toHaveLength(3);
    expect(current.total_velocity, 'vélocité totale 2+3+5').toBe(10);
  });
});

// Spec 007-page-sprint: R17, R18, R19, R19b
test.describe('close and carry over', () => {
  test('R17 clôturer : US closes et reportée', async ({ api, call }) => {
    const { a, b, c } = await seedStories(api);
    const s1 = await startSprint(api, 'S1', ids([a, b, c]));
    const res = await call('POST', `/sprints/${s1.id}/close`, {
      closed_user_story_ids: ids([b, c]),
      carried_user_story_ids: [a.id],
    });
    expect(res.status(), 'clôturer S1 : B et C closes, A reportée').toBe(200);
    expect(
      (await res.json()).user_stories.map((s: { outcome: string }) => s.outcome).join(','),
      'sort des US de S1 (A, B, C)',
    ).toBe('carried,closed,closed');
  });

  test.describe('next sprint', () => {
    let seed: Awaited<ReturnType<typeof seedStories>> & { d: { id: number }; s1: { id: number } };

    // S1 closed with B and C closed, A carried over (T1 done, T2 in progress); D accepted, never in a sprint.
    test.beforeEach(async ({ api }) => {
      const stories = await seedStories(api);
      const d = await createStory(api, 'US D', { accepted: true });
      const s1 = await startSprint(api, 'S1', ids([stories.a, stories.b, stories.c]));
      const [t1, t2] = stories.a.tasks;
      for (const point of t1.validation_points) await checkPoint(api, point.id);
      await setTaskStatus(api, t1.id, 'done');
      await setTaskStatus(api, t2.id, 'in_progress');
      await closeSprint(api, s1.id, { closed: ids([stories.b, stories.c]), carried: [stories.a.id] });
      seed = { ...stories, d, s1 };
    });

    test('R17 R18 lancer S2 avec l’US reportée : statuts conservés', async ({ call }) => {
      const res = await call('POST', '/sprints', { name: 'S2', user_story_ids: ids([seed.a, seed.d]) });
      expect(res.status(), 'lancer S2 avec l’US reportée et D').toBe(201);
      const s2 = await res.json();
      expect(ids(s2.user_stories), 'US de S2').toEqual(ids([seed.a, seed.d]));
      expect(
        s2.user_stories[0].tasks.map((t: { status: string }) => t.status).join(','),
        'statuts conservés après report',
      ).toBe('done,in_progress');
    });

    test('R19 R19b sprint clos : photo des tâches à la clôture', async ({ api, call }) => {
      await startSprint(api, 'S2', ids([seed.a, seed.d]));
      const t2 = seed.a.tasks[1].id;
      expect(
        (await call('PATCH', `/tasks/${t2}/status`, { status: 'in_review' })).status(),
        'faire avancer une tâche reportée',
      ).toBe(204);
      const statusOf = (sprint: { user_stories: { id: number; tasks: { id: number; status: string }[] }[] }) =>
        sprint.user_stories.find((s) => s.id === seed.a.id)!.tasks.find((t) => t.id === t2)!.status;

      const s1 = await api('GET', `/sprints/${seed.s1.id}`);
      expect(`${s1.user_stories.length} ${s1.status}`, 'sprint passé : 3 US, statut closed').toBe('3 closed');
      expect(statusOf(s1), 'photo : S1 garde le statut de la clôture').toBe('in_progress');
      expect(statusOf(await api('GET', '/sprints/current')), 'sprint en cours : statut actuel').toBe('in_review');
      expect(await api('GET', '/sprints'), 'liste des sprints').toHaveLength(2);
    });

    test('R16 R17b clôturer S2 : US close, US sans case retournée au backlog', async ({ api, call }) => {
      const s2 = await startSprint(api, 'S2', ids([seed.a, seed.d]));
      const res = await call('POST', `/sprints/${s2.id}/close`, { closed_user_story_ids: [seed.a.id] });
      expect(res.status(), 'clôturer S2 : A close, D sans case').toBe(200);
      const closed = await res.json();
      expect(
        closed.user_stories.find((s: { id: number }) => s.id === seed.d.id).outcome,
        'D retournée au backlog',
      ).toBe('returned');
      const d = (await api('GET', '/user-stories')).find((s: { id: number }) => s.id === seed.d.id);
      expect(`${d.validated} ${d.done}`, 'D toujours acceptée, pas terminée').toBe('true false');
      expect((await call('GET', '/sprints/current')).status(), 'plus de sprint en cours').toBe(404);
    });
  });
});
