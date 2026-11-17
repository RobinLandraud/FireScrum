import { createFeature, createStory, startSprint, closeSprint, type Api } from '../helpers';

/**
 * "Authentification" with one user story per status: pending, planned (accepted),
 * in progress (current sprint) and done; "Archiver", done without feature; "Profil", without user story.
 */
export async function seedStatuses(api: Api) {
  const auth = await createFeature(api, 'Authentification');
  await createFeature(api, 'Profil');
  await createStory(api, 'Se déconnecter', { featureId: auth.id });
  await createStory(api, 'Exporter', { featureId: auth.id, accepted: true });
  const importer = await createStory(api, 'Importer', { featureId: auth.id, accepted: true });
  const connect = await createStory(api, 'Se connecter', { featureId: auth.id, accepted: true });
  const archiver = await createStory(api, 'Archiver', { accepted: true });
  const s1 = await startSprint(api, 'Sprint 1', [importer.id, connect.id, archiver.id]);
  await closeSprint(api, s1.id, { closed: [connect.id, archiver.id], carried: [importer.id] });
  await startSprint(api, 'Sprint 2', [importer.id]);
}
