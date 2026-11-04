import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import type { FeatureOut } from '@contracts/FeatureOut';
import type { NewTask } from '@contracts/NewTask';
import type { UserStoryOut } from '@contracts/UserStoryOut';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { firstValueFrom } from 'rxjs';
import { toastApiError } from '../../../../services/error';
import { UserStoryApi } from '../../../../services/user-story.api';

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];
/** Les listes déroulantes manipulent des chaînes ; converties à l'envoi. `feature: ''` = sans feature. */
const EMPTY = { title: '', description: '', velocity: '1', feature: '' };

/** Détails d'une US : création (avec les tâches en brouillon `tasks`), ou modification si `story` est fourni. */
@Component({
  selector: 'app-user-story-form',
  host: { class: 'block' },
  imports: [FormField, HlmButtonImports, HlmInputImports, HlmLabelImports, HlmTextareaImports],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export class UserStoryForm {
  private api = inject(UserStoryApi);
  readonly features = input<FeatureOut[]>([]);
  readonly story = input<UserStoryOut | null>(null);
  /** Tâches à créer avec l'US (création uniquement) : au moins une est requise. */
  readonly tasks = input<NewTask[]>([]);
  readonly saved = output();

  protected fibonacci = FIBONACCI;
  /** Identifiants des champs, uniques par US (pour les `<label for>`). */
  protected idPrefix = computed(() => `us-${this.story()?.id ?? 'new'}`);

  private model = linkedSignal(() => {
    const s = this.story();
    return s
      ? {
          title: s.title,
          description: s.description,
          velocity: String(s.velocity),
          feature: s.feature_id === null ? '' : String(s.feature_id),
        }
      : EMPTY;
  });
  protected form = form(this.model, (f) => required(f.title));

  protected save(event: Event) {
    event.preventDefault();
    submit(this.form, async () => {
      const { title, description, velocity, feature } = this.model();
      const body = { title, description, velocity: Number(velocity), feature_id: feature ? Number(feature) : null };
      const story = this.story();
      try {
        if (story) {
          await firstValueFrom(this.api.update(story.id, body));
          toast.success('US mise à jour');
        } else {
          await firstValueFrom(this.api.create({ ...body, tasks: this.tasks() }));
        }
        this.saved.emit();
      } catch (err) {
        toastApiError(err);
      }
    });
  }
}
