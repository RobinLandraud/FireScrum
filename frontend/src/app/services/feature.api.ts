import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import type { FeatureOut } from '@contracts/FeatureOut';
import type { FeatureDetails } from '@contracts/FeatureDetails';
import type { NewFeature } from '@contracts/NewFeature';

@Service()
export class FeatureApi {
  private http = inject(HttpClient);

  /** Backlog complet : features → US → tâches → points de validation. */
  list() {
    return this.http.get<FeatureOut[]>('/api/features');
  }

  /** La feature et les US (sans feature) à y rattacher, ensemble. */
  create(body: NewFeature) {
    return this.http.post<FeatureOut>('/api/features', body);
  }

  update(id: number, body: FeatureDetails) {
    return this.http.put<void>(`/api/features/${id}`, body);
  }
}
