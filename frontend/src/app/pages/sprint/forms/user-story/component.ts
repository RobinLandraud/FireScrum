import { CdkDrag, type CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import type { SprintOutcome } from '@contracts/SprintOutcome';
import type { SprintUserStoryOut } from '@contracts/SprintUserStoryOut';
import type { TaskOut } from '@contracts/TaskOut';
import type { TaskStatus } from '@contracts/TaskStatus';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matAddCircleOutline } from '@ng-icons/material-icons/outline';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { firstValueFrom } from 'rxjs';
import { AppProgress } from '../../../../components/progress/component';
import { toastApiError } from '../../../../services/error';
import { storyProgress } from '../../../../services/progress';
import { TaskApi } from '../../../../services/task.api';
import { TASK_STATUSES } from '../../../../services/task-status';
import { SprintTask } from '../task/component';

const OUTCOME_LABEL: Record<SprintOutcome, string> = {
  closed: 'Close',
  carried: 'Reportée',
  returned: 'Retournée au backlog',
};

/**
 * Ligne d'une US sur le tableau du sprint : en-tête (titre, feature, vélocité) et tâches en kanban.
 * Une tâche se déplace entre les colonnes de sa ligne uniquement (`cdkDropListGroup` par ligne).
 */
@Component({
  selector: 'app-sprint-story',
  host: { class: 'block' },
  imports: [CdkDrag, CdkDropList, CdkDropListGroup, HlmBadgeImports, HlmDialogImports, NgIcon, AppProgress, SprintTask],
  providers: [provideIcons({ matAddCircleOutline })],
  templateUrl: './template.html',
  styleUrl: './template.scss',
})
export class SprintStory {
  private taskApi = inject(TaskApi);
  readonly story = input.required<SprintUserStoryOut>();
  readonly featureTitle = input<string | null>(null);
  /** Sprint clos : pas de déplacement, pas de modification, pas de carte « + ». */
  readonly readonly = input(false);
  /** Une tâche a changé : le parent recharge le sprint. */
  readonly changed = output();

  protected columns = TASK_STATUSES;
  protected progress = computed(() => storyProgress(this.story()));
  protected outcomeLabel = computed(() => {
    const outcome = this.story().outcome;
    return outcome ? OUTCOME_LABEL[outcome] : null;
  });

  /** Statut affiché tout de suite après un déplacement, avant la réponse de l'API (remis à zéro au rechargement). */
  private moved = linkedSignal<SprintUserStoryOut, Record<number, TaskStatus>>({ source: this.story, computation: () => ({}) });
  protected tasksByStatus = computed(() => {
    const moved = this.moved();
    const byStatus: Record<TaskStatus, TaskOut[]> = { todo: [], in_progress: [], in_review: [], done: [] };
    for (const t of this.story().tasks) byStatus[moved[t.id] ?? t.status].push(t);
    return byStatus;
  });

  /** Modal de tâche : id de la tâche ouverte, `'new'` pour la carte « + », `null` si fermée. */
  protected opened = signal<number | 'new' | null>(null);
  protected openedTask = computed(() => {
    const id = this.opened();
    return typeof id === 'number' ? (this.story().tasks.find((t) => t.id === id) ?? null) : null;
  });

  protected checkedCount(task: TaskOut) {
    return task.validation_points.filter((p) => p.checked).length;
  }

  protected async drop(event: CdkDragDrop<TaskStatus, TaskStatus, TaskOut>) {
    const status = event.container.data;
    const task = event.item.data;
    if (event.previousContainer === event.container) return;
    this.moved.update((m) => ({ ...m, [task.id]: status }));
    try {
      await firstValueFrom(this.taskApi.setStatus(task.id, { status }));
    } catch (err) {
      toastApiError(err);
      this.moved.update((m) => {
        const rest = { ...m };
        delete rest[task.id];
        return rest;
      });
      return;
    }
    this.changed.emit();
  }

  protected closeTask(reload: boolean) {
    this.opened.set(null);
    if (reload) this.changed.emit();
  }
}
