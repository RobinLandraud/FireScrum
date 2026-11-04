import type { TaskStatus } from '@contracts/TaskStatus';

/** Colonnes du tableau de sprint, dans l'ordre. */
export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'À faire' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'in_review', label: 'En validation' },
  { value: 'done', label: 'Terminé' },
];

export const TASK_STATUS_LABEL = Object.fromEntries(TASK_STATUSES.map((s) => [s.value, s.label])) as Record<TaskStatus, string>;
