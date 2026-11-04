import type { UserStoryStatus } from '@contracts/UserStoryStatus';

/** Libellé et couleurs du badge de statut d'une US. */
export const USER_STORY_STATUS: Record<UserStoryStatus, { label: string; class: string }> = {
  pending: { label: 'En attente', class: 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-400' },
  planned: { label: 'Planifié', class: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
  in_progress: { label: 'En cours', class: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400' },
  done: { label: 'Terminé', class: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
};
