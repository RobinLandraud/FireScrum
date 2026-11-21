import type { UserStoryStatus } from '@contracts/UserStoryStatus';

/** Label and colors of a US status badge. */
export const USER_STORY_STATUS: Record<UserStoryStatus, { label: string; class: string }> = {
  pending: { label: 'En attente', class: 'bg-muted text-muted-foreground' },
  planned: { label: 'Planifié', class: 'bg-info/15 text-info-foreground' },
  in_progress: { label: 'En cours', class: 'bg-warning/15 text-warning-foreground' },
  done: { label: 'Terminé', class: 'bg-success/15 text-success-foreground' },
};
