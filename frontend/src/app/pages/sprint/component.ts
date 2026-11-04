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
import { CloseSprintForm } from './forms/close/form';
import { LaunchSprintForm } from './forms/launch/form';
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

  /** Du plus ancien au plus récent : le sprint actuel est le dernier. */
  protected sprints = rxResource({ stream: () => this.sprintApi.list() });
  protected ordered = computed(() => [...(this.sprints.value() ?? [])].reverse());
  protected last = computed(() => this.ordered().at(-1) ?? null);
  protected lastActive = computed(() => this.last()?.status === 'active');

  /** Sprint affiché : le dernier par défaut, et après chaque rechargement de la liste. */
  protected selectedId = linkedSignal(() => this.last()?.id ?? null);
  protected detail = rxResource({
    params: () => this.selectedId(),
    stream: ({ params: id }) => (id === null ? of(null) : this.sprintApi.get(id)),
  });
  protected readonly = computed(() => this.detail.value()?.status === 'closed');

  /**
   * Recharge le sprint affiché après un changement de tâche. `reload()` est ignoré tant qu'un chargement est en cours :
   * on le rejoue à la fin, sinon deux cases cochées vite n'afficheraient que la première.
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

  /** Pour la modal de lancement : US acceptées, et US reportées à la clôture du dernier sprint. */
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

  /** Après un lancement ou une clôture : tout recharger, le dernier sprint est sélectionné. */
  protected reloadAll() {
    this.sprints.reload();
    this.stories.reload();
    this.detail.reload();
  }
}
