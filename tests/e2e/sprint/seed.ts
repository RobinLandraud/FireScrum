import { createFeature, createStory, startSprint, setTaskStatus, checkPoint, type Api } from '../helpers';

export const US = 'Se connecter en SSO';

/**
 * "Sprint 1" running with US (8 pts, feature "Authentification") and two tasks:
 * "Formulaire de connexion" (2 validation points) and "Tâche initiale".
 * With `advanced`, the first one is Done (points checked) and the second one In progress.
 */
export async function seedRunningSprint(api: Api, { advanced = false } = {}) {
  const auth = await createFeature(api, 'Authentification');
  const story = await createStory(api, US, {
    velocity: 8,
    featureId: auth.id,
    tasks: [
      {
        title: 'Formulaire de connexion',
        description: 'Email et mot de passe',
        validation_points: ['Champs requis', 'Message d’erreur'],
      },
      'Tâche initiale',
    ],
    accepted: true,
  });
  const [form, initial] = story.tasks;
  const sprint = await startSprint(api, 'Sprint 1', [story.id]);
  if (advanced) {
    for (const point of form.validation_points) await checkPoint(api, point.id);
    await setTaskStatus(api, form.id, 'done');
    await setTaskStatus(api, initial.id, 'in_progress');
  }
  return { story, sprint, form, initial };
}
