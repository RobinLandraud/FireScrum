import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import type { UserStoryOut } from '@contracts/UserStoryOut';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { AppProgress } from '../../components/progress/component';
import { FeatureApi } from '../../services/feature.api';
import { storyProgress } from '../../services/progress';
import { UserStoryApi } from '../../services/user-story.api';
import { UserStoryEditor } from './forms/user-story/component';

/** Onglets du backlog : à valider, validées (pas encore terminées), terminées. */
const TABS = [
  { id: 'sandbox', label: 'Sandbox', empty: 'Aucune US à valider.', match: (s: UserStoryOut) => !s.validated },
  { id: 'accepted', label: 'Accepted', empty: 'Aucune US acceptée.', match: (s: UserStoryOut) => s.validated && !s.done },
  { id: 'done', label: 'Done', empty: 'Aucune US terminée.', match: (s: UserStoryOut) => s.done },
];

@Component({
  selector: 'app-backlog-page',
  imports: [HlmButtonImports, HlmCardImports, HlmDialogImports, HlmTabsImports, AppProgress, UserStoryEditor],
  templateUrl: './template.html',
  styleUrl: './template.scss',
})
export class BacklogPage {
  private storyApi = inject(UserStoryApi);
  private featureApi = inject(FeatureApi);

  protected progress = storyProgress;
  protected stories = rxResource({ stream: () => this.storyApi.list() });
  protected features = rxResource({ stream: () => this.featureApi.list() });

  protected tab = signal('sandbox');
  protected tabs = computed(() => {
    const stories = this.stories.value() ?? [];
    return TABS.map((t) => ({ ...t, stories: stories.filter(t.match) }));
  });
  private featureTitles = computed(() => new Map((this.features.value() ?? []).map((f) => [f.id, f.title])));

  protected featureTitle(story: UserStoryOut) {
    return story.feature_id === null ? null : (this.featureTitles().get(story.feature_id) ?? null);
  }

  protected onCreated() {
    this.tab.set('sandbox');
    this.stories.reload();
  }
}
