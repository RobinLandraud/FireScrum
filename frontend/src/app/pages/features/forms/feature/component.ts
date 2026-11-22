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
import { FeatureForm } from './form/component';

/**
 * Content of a feature modal, Details and User stories tabs.
 * Creation if `feature` is `null`: the chosen USs stay as drafts until creation.
 * Edit otherwise: each US addition / removal is saved right away.
 * The USs themselves are not edited here.
 */
@Component({
  selector: 'app-feature',
  host: { class: 'flex flex-1 flex-col gap-4' },
  imports: [HlmBadgeImports, HlmButtonImports, HlmDialogImports, HlmInputImports, HlmTabsImports, NgIcon, AppProgress, FeatureForm],
  providers: [provideIcons({ matAddCircleOutline, matRemoveCircleOutline })],
  templateUrl: './template.html',
  styleUrl: './template.scss',
})
export class FeatureEditor {
  private storyApi = inject(UserStoryApi);
  readonly feature = input<FeatureOut | null>(null);
  /** Unfinished USs without a feature, offered for adding. */
  readonly unassigned = input<UserStoryOut[]>([]);
  /** Details saved (or feature created): the parent closes the modal. */
  readonly saved = output();
  /** A US was added or removed: the parent reloads, the modal stays open. */
  readonly changed = output();

  protected status = USER_STORY_STATUS;
  protected progress = storyProgress;
  protected tab = signal('details');
  protected draftIds = signal<number[]>([]);
  /** Fuzzy search among the USs without a feature. */
  protected query = signal('');

  /** USs of the feature (or chosen ones, in creation). */
  protected stories = computed(() => {
    const f = this.feature();
    return f ? f.user_stories : this.unassigned().filter((s) => this.draftIds().includes(s.id));
  });
  /** USs that can still be added. */
  protected available = computed(() => this.unassigned().filter((s) => !this.draftIds().includes(s.id)));
  /** The 5 most relevant USs for the search (the first 5 if it is empty). */
  protected results = computed(() => fuzzyFilter(this.available(), this.query(), (s) => s.title).slice(0, 5));

  /** Enter in the search: adds the first result. */
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
