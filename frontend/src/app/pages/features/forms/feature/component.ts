import { Component, computed, inject, input, output, signal } from '@angular/core';
import type { FeatureOut } from '@contracts/FeatureOut';
import type { UserStoryOut } from '@contracts/UserStoryOut';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matAddCircleOutline, matRemoveCircleOutline } from '@ng-icons/material-icons/outline';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { firstValueFrom } from 'rxjs';
import { toastApiError } from '../../../../services/error';
import { fuzzyFilter } from '../../../../services/fuzzy';
import { AppProgress } from '../../../../components/progress/component';
import { storyProgress } from '../../../../services/progress';
import { USER_STORY_STATUS } from '../../../../services/user-story-status';
import { UserStoryApi } from '../../../../services/user-story.api';
import { FeatureForm } from './form';

/**
 * Contenu de la modal d'une feature, onglets Details et User stories.
 * Création si `feature` est `null` : les US choisies restent en brouillon jusqu'à la création.
 * Modification sinon : chaque ajout / retrait d'US est enregistré tout de suite.
 * On n'y modifie pas les US elles-mêmes.
 */
@Component({
  selector: 'app-feature',
  host: { class: 'grid gap-4' },
  imports: [HlmBadgeImports, HlmButtonImports, HlmDialogImports, HlmInputImports, HlmTabsImports, NgIcon, AppProgress, FeatureForm],
  providers: [provideIcons({ matAddCircleOutline, matRemoveCircleOutline })],
  templateUrl: './template.html',
  styleUrl: './template.scss',
})
export class FeatureEditor {
  private storyApi = inject(UserStoryApi);
  readonly feature = input<FeatureOut | null>(null);
  /** US sans feature et non terminées, proposées à l'ajout. */
  readonly unassigned = input<UserStoryOut[]>([]);
  /** Détails enregistrés (ou feature créée) : le parent ferme la modal. */
  readonly saved = output();
  /** Une US a été ajoutée ou retirée : le parent recharge, la modal reste ouverte. */
  readonly changed = output();

  protected status = USER_STORY_STATUS;
  protected progress = storyProgress;
  protected tab = signal('details');
  protected draftIds = signal<number[]>([]);
  /** Recherche approximative parmi les US sans feature. */
  protected query = signal('');

  /** US de la feature (ou choisies, en création). */
  protected stories = computed(() => {
    const f = this.feature();
    return f ? f.user_stories : this.unassigned().filter((s) => this.draftIds().includes(s.id));
  });
  /** US qu'on peut encore ajouter. */
  protected available = computed(() => this.unassigned().filter((s) => !this.draftIds().includes(s.id)));
  /** Les 5 US les plus pertinentes pour la recherche (les 5 premières si elle est vide). */
  protected results = computed(() => fuzzyFilter(this.available(), this.query(), (s) => s.title).slice(0, 5));

  /** Entrée dans la recherche : ajoute le premier résultat. */
  protected addFirst() {
    const first = this.results()[0];
    if (first) this.add(first);
  }

  protected async add(story: UserStoryOut) {
    this.query.set('');
    const f = this.feature();
    if (!f) {
      this.draftIds.update((ids) => [...ids, story.id]);
      return;
    }
    await this.setFeature(story.id, f.id);
  }

  protected async remove(story: UserStoryOut) {
    if (!this.feature()) {
      this.draftIds.update((ids) => ids.filter((i) => i !== story.id));
      return;
    }
    await this.setFeature(story.id, null);
  }

  private async setFeature(storyId: number, featureId: number | null) {
    try {
      await firstValueFrom(this.storyApi.setFeature(storyId, { feature_id: featureId }));
      this.changed.emit();
    } catch (err) {
      toastApiError(err);
    }
  }
}
