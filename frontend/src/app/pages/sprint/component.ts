import { Component, computed, effect, inject, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import type { UserStoryOut } from '@contracts/UserStoryOut';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { of } from 'rxjs';
import { FeatureApi } from '../../services/feature.api';
import { SprintApi } from '../../services/sprint.api';
import { UserStoryApi } from '../../services/user-story.api';
import { CloseSprintForm } from './forms/close/component';
import { LaunchSprintForm } from './forms/launch/component';
import { SprintStory } from './forms/user-story/component';

@Component({
  selector: 'app-sprint-page',
  imports: [HlmBadgeImports, HlmButtonImports, HlmDialogImports, CloseSprintForm, LaunchSprintForm, SprintStory],
  templateUrl: './template.html',
  styleUrl: './template.scss',
})
export class SprintPage {
  private sprintApi = inject(SprintApi);
  private storyApi = inject(UserStoryApi);
  private featureApi = inject(FeatureApi);

  /** Oldest to newest: the current sprint is the last one. */
  protected sprints = rxResource({ stream: () => this.sprintApi.list() });
  protected ordered = computed(() => [...(this.sprints.value() ?? [])].reverse());
  protected last = computed(() => this.ordered().at(-1) ?? null);
  protected lastActive = computed(() => this.last()?.status === 'active');

  /** Displayed sprint: the last one by default, and after each reload of the list. */
  protected selectedId = linkedSignal(() => this.last()?.id ?? null);
  protected detail = rxResource({
    params: () => this.selectedId(),
    stream: ({ params: id }) => (id === null ? of(null) : this.sprintApi.get(id)),
  });
  protected readonly = computed(() => this.detail.value()?.status === 'closed');

  /**
   * Reloads the displayed sprint after a task change. `reload()` is ignored while a load is in progress:
   * it is replayed at the end, otherwise two boxes checked quickly would only show the first one.
   */
  private reloadPending = false;
  protected refresh() {
    if (!this.detail.reload()) this.reloadPending = true;
  }
  constructor() {
    effect(() => {
      if (!this.detail.isLoading() && this.reloadPending) {
        this.reloadPending = false;
        this.detail.reload();
      }
    });
  }

  private features = rxResource({ stream: () => this.featureApi.list() });
  private featureTitles = computed(() => new Map((this.features.value() ?? []).map((f) => [f.id, f.title])));
  protected featureTitle = (story: { feature_id: number | null }) =>
    story.feature_id === null ? null : (this.featureTitles().get(story.feature_id) ?? null);

  /** For the launch modal: accepted USs, and USs carried over when the last sprint was closed. */
  private stories = rxResource({ stream: () => this.storyApi.list() });
  protected accepted = computed(() => (this.stories.value() ?? []).filter((s: UserStoryOut) => s.validated && !s.done));
  private lastDetail = rxResource({
    params: () => (this.last()?.status === 'closed' ? this.last()!.id : null),
    stream: ({ params: id }) => (id === null ? of(null) : this.sprintApi.get(id)),
  });
  protected carriedIds = computed(() =>
    (this.lastDetail.value()?.user_stories ?? []).filter((s) => s.outcome === 'carried').map((s) => s.id),
  );

  protected select(event: Event) {
    this.selectedId.set(Number((event.target as HTMLSelectElement).value));
  }

  /** After a launch or a closing: reload everything, the last sprint is selected. */
  protected reloadAll() {
    this.sprints.reload();
    this.stories.reload();
    this.detail.reload();
  }
}
