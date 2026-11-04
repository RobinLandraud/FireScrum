import type { FeatureOut } from '@contracts/FeatureOut';
import type { UserStoryOut } from '@contracts/UserStoryOut';

export interface Progress {
  value: number;
  max: number;
}

/** Tâches en Terminé sur toutes les tâches ; une US terminée est complète. */
export function storyProgress(story: UserStoryOut): Progress {
  const max = story.tasks.length;
  return { value: story.done ? max : story.tasks.filter((t) => t.status === 'done').length, max };
}

/** US terminées sur toutes les US de la feature. */
export function featureProgress(feature: FeatureOut): Progress {
  return { value: feature.user_stories.filter((s) => s.done).length, max: feature.user_stories.length };
}
