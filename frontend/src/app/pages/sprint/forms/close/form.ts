import { Component, inject, input, linkedSignal, output } from '@angular/core';
import type { SprintDetailOut } from '@contracts/SprintDetailOut';
import type { SprintUserStoryOut } from '@contracts/SprintUserStoryOut';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { firstValueFrom } from 'rxjs';
import { toastApiError } from '../../../../services/error';
import { SprintApi } from '../../../../services/sprint.api';

/** Choix du PO pour une US : close, reportée, ou rien (retournée au backlog). */
type Choice = 'closed' | 'carried' | null;

/** Pré-cochage : « Clore » si toutes les tâches sont Terminé, « Reporter » sinon. */
function initialChoice(story: SprintUserStoryOut): Choice {
  return story.tasks.every((t) => t.status === 'done') ? 'closed' : 'carried';
}

/** Modal de clôture : pour chaque US, « Clore » ou « Reporter » (exclusifs) ; sans case, l'US retourne au backlog. */
@Component({
  selector: 'app-close-sprint-form',
  host: { class: 'flex min-h-0 flex-1 flex-col gap-4' },
  imports: [HlmButtonImports, HlmCheckboxImports, HlmDialogImports],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export class CloseSprintForm {
  private api = inject(SprintApi);
  readonly sprint = input.required<SprintDetailOut>();
  readonly sprintClosed = output();

  protected choices = linkedSignal<Record<number, Choice>>(() =>
    Object.fromEntries(this.sprint().user_stories.map((s) => [s.id, initialChoice(s)])),
  );

  protected set(id: number, choice: 'closed' | 'carried', checked: boolean) {
    this.choices.update((c) => ({ ...c, [id]: checked ? choice : null }));
  }

  protected async close() {
    const entries = Object.entries(this.choices());
    const ids = (choice: Choice) => entries.filter(([, c]) => c === choice).map(([id]) => Number(id));
    try {
      await firstValueFrom(
        this.api.close(this.sprint().id, { closed_user_story_ids: ids('closed'), carried_user_story_ids: ids('carried') }),
      );
      toast.success(`Sprint « ${this.sprint().name} » clôturé`);
      this.sprintClosed.emit();
    } catch (err) {
      toastApiError(err);
    }
  }
}
