import {
  test,
  expect,
  createStory,
  startSprint,
  closeSprint,
  setTaskStatus,
  checkPoint,
} from '../../fixtures';

// Spec 004-taches: R05, R05b, R05c
test.describe('edit a task', () => {
  test('R05 tâche sans nom refusée', async ({ api, call }) => {
    const story = await createStory(api, 'US B');
    const res = await call('POST', `/user-stories/${story.id}/tasks`, { title: ' ', description: 'x' });
    expect(res.status(), 'tâche sans nom refusée').toBe(400);
  });

  test('R05b modifier : nom vide refusé, tâche inexistante', async ({ api, call }) => {
    const story = await createStory(api, 'US A', { tasks: ['T1'] });
    expect((await call('PUT', `/tasks/${story.tasks[0].id}`, { title: ' ' })).status(), 'modifier : nom vide refusé').toBe(400);
    expect((await call('PUT', '/tasks/9999', { title: 'x' })).status(), 'modifier une tâche inexistante').toBe(404);
  });

  test('R05c supprimer une tâche déjà supprimée', async ({ api, call }) => {
    const story = await createStory(api, 'US A', { tasks: ['T1', 'T3'] });
    const path = `/tasks/${story.tasks[1].id}`;
    await api('DELETE', path);
    expect((await call('DELETE', path)).status(), 'supprimer une tâche déjà supprimée').toBe(404);
  });
});

// Spec 007-page-sprint: R12, R14, R15b, R05b
test.describe('status and validation points', () => {
  let task: { id: number; validation_points: { id: number }[] };

  test.beforeEach(async ({ api }) => {
    const story = await createStory(api, 'US A', {
      tasks: [{ title: 'T1', validation_points: ['p1', 'p2'] }],
      accepted: true,
    });
    task = story.tasks[0];
    await startSprint(api, 'S1', [story.id]);
  });

  test('R12 statut invalide refusé', async ({ call }) => {
    const res = await call('PATCH', `/tasks/${task.id}/status`, { status: 'merged' });
    expect(res.status(), 'statut invalide refusé').toBe(422);
  });

  test('R14 done refusé si point non coché', async ({ api, call }) => {
    await setTaskStatus(api, task.id, 'in_progress');
    await checkPoint(api, task.validation_points[0].id);
    const res = await call('PATCH', `/tasks/${task.id}/status`, { status: 'done' });
    expect(res.status(), 'done refusé si point non coché').toBe(409);
  });

  test.describe('done task', () => {
    test.beforeEach(async ({ api }) => {
      for (const point of task.validation_points) await checkPoint(api, point.id);
      await setTaskStatus(api, task.id, 'done');
    });

    test('R15b décocher un point d’une tâche Terminé refusé', async ({ call }) => {
      const res = await call('PATCH', `/validation-points/${task.validation_points[0].id}`, { checked: false });
      expect(res.status(), 'décocher un point d’une tâche Terminé refusé').toBe(409);
    });

    test('R05b ajout de point sur tâche terminée refusé', async ({ call }) => {
      const res = await call('PUT', `/tasks/${task.id}`, { title: 'T1b', validation_points: ['p1', 'p2', 'p4'] });
      expect(res.status(), 'ajout de point sur tâche terminée refusé').toBe(409);
    });
  });
});

// Spec 007-page-sprint: R05d
test('R05d US terminée : ses tâches et points ne se modifient plus', async ({ api, call }) => {
  const story = await createStory(api, 'US B', {
    tasks: [{ title: 'TB', validation_points: ['p1', 'p2'] }],
    accepted: true,
  });
  const task = story.tasks[0];
  const sprint = await startSprint(api, 'S1', [story.id]);
  await closeSprint(api, sprint.id, { closed: [story.id] });

  expect(
    (await call('POST', `/user-stories/${story.id}/tasks`, { title: 'x' })).status(),
    'ajouter une tâche à une US terminée refusé',
  ).toBe(409);
  expect((await call('PUT', `/tasks/${task.id}`, { title: 'x' })).status(), 'modifier une tâche d’une US terminée refusé').toBe(409);
  expect(
    (await call('PATCH', `/tasks/${task.id}/status`, { status: 'in_progress' })).status(),
    'déplacer une tâche d’une US terminée refusé',
  ).toBe(409);
  expect(
    (await call('PATCH', `/validation-points/${task.validation_points[0].id}`, { checked: true })).status(),
    'cocher un point d’une US terminée refusé',
  ).toBe(409);
  expect((await call('DELETE', `/tasks/${task.id}`)).status(), 'supprimer une tâche d’une US terminée refusé').toBe(409);
});
