import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import type { FeatureOut } from '@contracts/FeatureOut';
import type { FeatureDetails } from '@contracts/FeatureDetails';
import type { NewFeature } from '@contracts/NewFeature';

@Service()
export class FeatureApi {
  private http = inject(HttpClient);

  /** Full backlog: features → USs → tasks → validation points. */
  list() {
    return this.http.get<FeatureOut[]>('/api/features');
  }

  /** The feature and the USs (without a feature) to attach to it, together. */
  create(body: NewFeature) {
    return this.http.post<FeatureOut>('/api/features', body);
  }

  update(id: number, body: FeatureDetails) {
    return this.http.put<void>(`/api/features/${id}`, body);
  }
}
