import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import type { UserStoryOut } from '@contracts/UserStoryOut';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { firstValueFrom } from 'rxjs';
import { toastApiError } from '../../../../services/error';
import { SprintApi } from '../../../../services/sprint.api';

/** Modal de lancement : un nom et les US acceptées à embarquer (les US reportées sont déjà cochées). */
@Component({
  selector: 'app-launch-sprint-form',
  host: { class: 'grid gap-4' },
  imports: [FormField, HlmButtonImports, HlmCardImports, HlmCheckboxImports, HlmDialogImports, HlmInputImports],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export class LaunchSprintForm {
  private api = inject(SprintApi);
  /** US acceptées et non terminées. */
  readonly stories = input<UserStoryOut[]>([]);
  /** US reportées à la clôture du sprint précédent : pré-cochées. */
  readonly carriedIds = input<number[]>([]);
  readonly featureTitle = input<(story: UserStoryOut) => string | null>(() => null);
  /** Id du sprint lancé : le parent ferme la modal et le sélectionne. */
  readonly launched = output<number>();

  private model = signal({ name: '' });
  protected form = form(this.model, (f) => required(f.name));
  protected selectedIds = linkedSignal(() => this.carriedIds().filter((id) => this.stories().some((s) => s.id === id)));
  protected selectedVelocity = computed(() =>
    this.stories()
      .filter((s) => this.selectedIds().includes(s.id))
      .reduce((total, s) => total + s.velocity, 0),
  );

  protected toggle(id: number, checked: boolean) {
    this.selectedIds.update((ids) => (checked ? [...ids, id] : ids.filter((i) => i !== id)));
  }

  protected launch(event: Event) {
    event.preventDefault();
    submit(this.form, async () => {
      try {
        const sprint = await firstValueFrom(this.api.launch({ name: this.model().name, user_story_ids: this.selectedIds() }));
        toast.success(`Sprint « ${sprint.name} » lancé`);
        this.launched.emit(sprint.id);
      } catch (err) {
        toastApiError(err);
      }
    });
  }
}
