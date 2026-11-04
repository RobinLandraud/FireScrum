import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import type { FeatureOut } from '@contracts/FeatureOut';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { firstValueFrom } from 'rxjs';
import { toastApiError } from '../../../../services/error';
import { FeatureApi } from '../../../../services/feature.api';

const EMPTY = { title: '', description: '' };

/** Détails d'une feature : création (avec les US choisies `userStoryIds`), ou modification si `feature` est fourni. */
@Component({
  selector: 'app-feature-form',
  host: { class: 'block' },
  imports: [FormField, HlmButtonImports, HlmInputImports, HlmLabelImports, HlmTextareaImports],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export class FeatureForm {
  private api = inject(FeatureApi);
  readonly feature = input<FeatureOut | null>(null);
  /** US à rattacher à la création (création uniquement). */
  readonly userStoryIds = input<number[]>([]);
  readonly saved = output();

  /** Identifiants des champs, uniques par feature (pour les `<label for>`). */
  protected idPrefix = computed(() => `feature-${this.feature()?.id ?? 'new'}`);

  private model = linkedSignal(() => {
    const f = this.feature();
    return f ? { title: f.title, description: f.description } : EMPTY;
  });
  protected form = form(this.model, (f) => required(f.title));

  protected save(event: Event) {
    event.preventDefault();
    submit(this.form, async () => {
      const feature = this.feature();
      try {
        if (feature) {
          await firstValueFrom(this.api.update(feature.id, this.model()));
          toast.success('Feature mise à jour');
        } else {
          await firstValueFrom(this.api.create({ ...this.model(), user_story_ids: this.userStoryIds() }));
        }
        this.saved.emit();
      } catch (err) {
        toastApiError(err);
      }
    });
  }
}
