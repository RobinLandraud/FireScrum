import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { AppProgress } from '../../components/progress/component';
import { FeatureApi } from '../../services/feature.api';
import { featureProgress } from '../../services/progress';
import { UserStoryApi } from '../../services/user-story.api';
import { FeatureEditor } from './forms/feature/component';

@Component({
  selector: 'app-features-page',
  imports: [HlmButtonImports, HlmCardImports, HlmDialogImports, AppProgress, FeatureEditor],
  templateUrl: './template.html',
  styleUrl: './template.scss',
})
export class FeaturesPage {
  private featureApi = inject(FeatureApi);
  private storyApi = inject(UserStoryApi);

  protected progress = featureProgress;
  protected features = rxResource({ stream: () => this.featureApi.list() });
  private stories = rxResource({ stream: () => this.storyApi.list() });
  /** US qu'on peut ajouter à une feature : celles qui n'en ont pas. */
  protected unassigned = computed(() => (this.stories.value() ?? []).filter((s) => s.feature_id === null && !s.done));

  protected reload() {
    this.features.reload();
    this.stories.reload();
  }
}
