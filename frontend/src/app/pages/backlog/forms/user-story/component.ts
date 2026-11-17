import { Component, computed, inject, input, output, signal } from '@angular/core';
import type { FeatureOut } from '@contracts/FeatureOut';
import type { NewTask } from '@contracts/NewTask';
import type { UserStoryOut } from '@contracts/UserStoryOut';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matDeleteOutline, matEditOutline } from '@ng-icons/material-icons/outline';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { firstValueFrom } from 'rxjs';
import { toastApiError } from '../../../../services/error';
import { TaskApi } from '../../../../services/task.api';
import { UserStoryApi } from '../../../../services/user-story.api';
import { TaskForm } from '../task/form';
import { UserStoryForm } from './form';

/** Row of the task list: `key` = task id (existing US) or draft index (creation). */
interface TaskRow {
  key: number;
  title: string;
}

/**
 * Content of a US modal, Details and Tasks tabs.
 * Creation if `story` is `null`: tasks stay as drafts until the US is created.
 * Edit otherwise: each action on a task is saved right away.
 */
@Component({
  selector: 'app-user-story',
  host: { class: 'flex flex-1 flex-col gap-4' },
  imports: [HlmBadgeImports, HlmButtonImports, HlmDialogImports, HlmTabsImports, NgIcon, TaskForm, UserStoryForm],
  providers: [provideIcons({ matEditOutline, matDeleteOutline })],
  templateUrl: './template.html',
  styleUrl: './template.scss',
})
export class UserStoryEditor {
  private storyApi = inject(UserStoryApi);
  private taskApi = inject(TaskApi);
  readonly story = input<UserStoryOut | null>(null);
  readonly features = input<FeatureOut[]>([]);
  /** Details saved (or US created): the parent closes the modal. */
  readonly saved = output();
  /** A task or the status changed: the parent reloads the USs, the modal stays open. */
  readonly changed = output();

  protected tab = signal('details');
  protected drafts = signal<NewTask[]>([]);
  /** Task being edited in the bottom form, `null` in add mode. */
  protected editingKey = signal<number | null>(null);

  protected rows = computed<TaskRow[]>(() => {
    const s = this.story();
    return s ? s.tasks.map((t) => ({ key: t.id, title: t.title })) : this.drafts().map((d, i) => ({ key: i, title: d.title }));
  });

  protected editingTask = computed<NewTask | null>(() => {
    const key = this.editingKey();
    if (key === null) return null;
    const s = this.story();
    if (!s) return this.drafts()[key] ?? null;
    const t = s.tasks.find((task) => task.id === key);
    return t ? { title: t.title, description: t.description, validation_points: t.validation_points.map((p) => p.label) } : null;
  });

  protected state = computed(() => {
    const s = this.story();
    if (!s) return null;
    if (s.done) return { label: 'Done', variant: 'default' } as const;
    if (s.validated) return { label: 'Accepted', variant: 'secondary' } as const;
    return { label: 'Sandbox', variant: 'outline' } as const;
  });

  protected async submitTask(body: NewTask) {
    const key = this.editingKey();
    const s = this.story();
    this.editingKey.set(null);
    if (!s) {
      this.drafts.update((d) => (key === null ? [...d, body] : d.map((t, i) => (i === key ? body : t))));
      return;
    }
    try {
      if (key === null) {
        await firstValueFrom(this.taskApi.create(s.id, body));
      } else {
        await firstValueFrom(this.taskApi.update(key, body));
      }
      this.changed.emit();
    } catch (err) {
      toastApiError(err);
    }
  }

  protected async deleteTask(row: TaskRow) {
    this.editingKey.set(null);
    if (!this.story()) {
      this.drafts.update((d) => d.filter((_, i) => i !== row.key));
      return;
    }
    try {
      await firstValueFrom(this.taskApi.delete(row.key));
      toast.success(`Tâche « ${row.title} » supprimée`);
      this.changed.emit();
    } catch (err) {
      toastApiError(err);
    }
  }

  protected async validate() {
    const s = this.story();
    if (!s) return;
    try {
      await firstValueFrom(this.storyApi.validate(s.id));
      toast.success(`« ${s.title} » acceptée`);
      this.changed.emit();
    } catch (err) {
      toastApiError(err);
    }
  }
}
