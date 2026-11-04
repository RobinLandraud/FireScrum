import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import type { FeatureUpdate } from '@contracts/FeatureUpdate';
import type { NewUserStory } from '@contracts/NewUserStory';
import type { UserStoryOut } from '@contracts/UserStoryOut';
import type { UserStoryUpdate } from '@contracts/UserStoryUpdate';

@Service()
export class UserStoryApi {
  private http = inject(HttpClient);

  /** Toutes les US du projet, avec ou sans feature. */
  list() {
    return this.http.get<UserStoryOut[]>('/api/user-stories');
  }

  /** L'US et au moins une tâche, créées ensemble. */
  create(body: NewUserStory) {
    return this.http.post<UserStoryOut>('/api/user-stories', body);
  }

  update(id: number, body: UserStoryUpdate) {
    return this.http.put<void>(`/api/user-stories/${id}`, body);
  }

  validate(id: number) {
    return this.http.post<void>(`/api/user-stories/${id}/validate`, null);
  }

  /** `feature_id: null` retire l'US de sa feature. */
  setFeature(id: number, body: FeatureUpdate) {
    return this.http.patch<void>(`/api/user-stories/${id}/feature`, body);
  }
}
