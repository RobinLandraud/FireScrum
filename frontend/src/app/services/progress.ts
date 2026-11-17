import type { FeatureOut } from '@contracts/FeatureOut';
import type { UserStoryOut } from '@contracts/UserStoryOut';

export interface Progress {
  value: number;
  max: number;
}

/** Tasks in "Terminé" out of all tasks; a finished US is complete. */
export function storyProgress(story: UserStoryOut): Progress {
  const max = story.tasks.length;
  return { value: story.done ? max : story.tasks.filter((t) => t.status === 'done').length, max };
}

/** Finished USs out of all USs of the feature. */
export function featureProgress(feature: FeatureOut): Progress {
  return { value: feature.user_stories.filter((s) => s.done).length, max: feature.user_stories.length };
}
