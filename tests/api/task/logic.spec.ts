import { test, expect, createStory, startSprint, checkPoint, type Api } from '../../fixtures';

/** Points of a task, as "label" or "label+" when checked: "p1+,p2,p3". */
async function points(api: Api, taskId: number) {
  const tasks = (await api('GET', '/user-stories')).flatMap((s: { tasks: unknown[] }) => s.tasks);
  const task = tasks.find((t: { id: number }) => t.id === taskId);
  return task.validation_points.map((p: { label: string; checked: boolean }) => p.label + (p.checked ? '+' : '')).join(',');
}

// Spec 004-taches: R05, R05b, R05c
test.describe('tasks of a user story', () => {
  test('R05 ajouter une tâche avec points', async ({ api, call }) => {
    const story = await createStory(api, 'US B');
    const res = await call('POST', `/user-stories/${story.id}/tasks`, {
      title: 'TB',
      description: 'Détail de TB',
      validation_points: ['p1', 'p2'],
    });
    expect(res.status(), 'ajouter une tâche avec points').toBe(201);
    const task = await res.json();
    expect(`${task.title}|${task.description}`, 'nom et description').toBe('TB|Détail de TB');
    expect(task.status, 'statut initial todo').toBe('todo');
  });

  test('R05b modifier une tâche : points synchronisés par libellé', async ({ api, call }) => {
    const story = await createStory(api, 'US A', { tasks: [{ title: 'T1', validation_points: ['p1', 'p2'] }] });
    const task = story.tasks[0];
    await checkPoint(api, task.validation_points[0].id);
    const update = (validation_points: string[]) =>
      call('PUT', `/tasks/${task.id}`, { title: 'T1b', description: 'd2', validation_points });
    expect((await update(['p1', 'p2', 'p3'])).status(), 'modifier une tâche (ajout de p3)').toBe(204);
    expect(await points(api, task.id), 'point coché conservé, p3 ajouté').toBe('p1+,p2,p3');
    expect((await update(['p1', 'p2'])).status(), 'retirer p3').toBe(204);
    expect(await points(api, task.id), 'p3 supprimé').toBe('p1+,p2');
  });

  test('R05c supprimer une tâche', async ({ api, call }) => {
    const story = await createStory(api, 'US A', { tasks: ['T1', { title: 'T3', validation_points: ['q'] }] });
    expect((await call('DELETE', `/tasks/${story.tasks[1].id}`)).status(), 'supprimer une tâche').toBe(204);
  });
});

// Spec 007-page-sprint: R12, R15, R18
test.describe('status in the sprint', () => {
  let task: { id: number; validation_points: { id: number }[] };
  let bare: { id: number };

  test.beforeEach(async ({ api }) => {
    const story = await createStory(api, 'US A', {
      tasks: [{ title: 'T1', validation_points: ['p1', 'p2'] }, 'T2'],
      accepted: true,
    });
    [task, bare] = story.tasks;
    await startSprint(api, 'S1', [story.id]);
  });

  test('R12 déplacer en in_progress', async ({ call }) => {
    const res = await call('PATCH', `/tasks/${task.id}/status`, { status: 'in_progress' });
    expect(res.status(), 'déplacer en in_progress').toBe(204);
  });

  test('R15 cocher tous les points, puis done accepté', async ({ api, call }) => {
    await checkPoint(api, task.validation_points[0].id);
    expect(
      (await call('PATCH', `/validation-points/${task.validation_points[1].id}`, { checked: true })).status(),
      'cocher le 2e point',
    ).toBe(204);
    expect(
      (await call('PATCH', `/tasks/${task.id}/status`, { status: 'done' })).status(),
      'done accepté si tous cochés',
    ).toBe(204);
  });

  test('R18 tâche sans point en in_progress', async ({ call }) => {
    const res = await call('PATCH', `/tasks/${bare.id}/status`, { status: 'in_progress' });
    expect(res.status(), 'tâche sans point en in_progress').toBe(204);
  });
});
