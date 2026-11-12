import { Component, computed, inject, input, output, signal } from '@angular/core';
import type { NewTask } from '@contracts/NewTask';
import type { TaskOut } from '@contracts/TaskOut';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matDeleteOutline } from '@ng-icons/material-icons/outline';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { firstValueFrom } from 'rxjs';
import { toastApiError } from '../../../../services/error';
import { TaskApi } from '../../../../services/task.api';
import { TASK_STATUS_LABEL } from '../../../../services/task-status';
import { ValidationPointApi } from '../../../../services/validation-point.api';
import { TaskForm } from '../../../backlog/forms/task/form';

/**
 * Contenu de la modal d'une tâche sur la page Sprint.
 * Création si `task` est `null` (carte « + »), modification sinon.
 * En lecture seule (sprint clos), affiche la tâche telle qu'à la clôture.
 */
@Component({
  selector: 'app-sprint-task',
  host: { class: 'flex flex-1 flex-col gap-4' },
  imports: [HlmButtonImports, HlmCheckboxImports, HlmDialogImports, HlmTabsImports, NgIcon, TaskForm],
  providers: [provideIcons({ matDeleteOutline })],
  templateUrl: './template.html',
  styleUrl: './template.scss',
})
export class SprintTask {
  private taskApi = inject(TaskApi);
  private pointApi = inject(ValidationPointApi);
  readonly task = input<TaskOut | null>(null);
  readonly userStoryId = input.required<number>();
  readonly readonly = input(false);
  /** Tâche créée, modifiée ou supprimée : le parent ferme la modal et recharge. */
  readonly saved = output();
  /** Point coché ou décoché : le parent recharge, la modal reste ouverte. */
  readonly changed = output();
  /** « Annuler » en modification : le parent ferme la modal. */
  readonly dismissed = output();

  protected statusLabel = TASK_STATUS_LABEL;
  /** Open tab: validation points first, since that is mostly why a task is opened during a sprint. */
  protected tab = signal('points');
  protected formValue = computed<NewTask | null>(() => {
    const t = this.task();
    return t ? { title: t.title, description: t.description, validation_points: t.validation_points.map((p) => p.label) } : null;
  });

  protected async submit(body: NewTask) {
    const t = this.task();
    try {
      if (t) {
        await firstValueFrom(this.taskApi.update(t.id, body));
      } else {
        await firstValueFrom(this.taskApi.create(this.userStoryId(), body));
      }
      this.saved.emit();
    } catch (err) {
      toastApiError(err);
    }
  }

  protected async check(pointId: number, checked: boolean) {
    try {
      await firstValueFrom(this.pointApi.update(pointId, { checked }));
    } catch (err) {
      toastApiError(err);
    }
    this.changed.emit();
  }

  protected async remove() {
    const t = this.task();
    if (!t) return;
    try {
      await firstValueFrom(this.taskApi.delete(t.id));
      toast.success(`Tâche « ${t.title} » supprimée`);
      this.saved.emit();
    } catch (err) {
      toastApiError(err);
    }
  }
}
