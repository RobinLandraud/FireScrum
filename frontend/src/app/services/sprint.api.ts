import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import type { CloseSprint } from '@contracts/CloseSprint';
import type { NewSprint } from '@contracts/NewSprint';
import type { SprintDetailOut } from '@contracts/SprintDetailOut';
import type { SprintOut } from '@contracts/SprintOut';

@Service()
export class SprintApi {
  private http = inject(HttpClient);

  /** Du plus récent au plus ancien. */
  list() {
    return this.http.get<SprintOut[]>('/api/sprints');
  }

  /** 404 si aucun sprint en cours. */
  current() {
    return this.http.get<SprintDetailOut>('/api/sprints/current');
  }

  get(id: number) {
    return this.http.get<SprintDetailOut>(`/api/sprints/${id}`);
  }

  launch(body: NewSprint) {
    return this.http.post<SprintDetailOut>('/api/sprints', body);
  }

  close(id: number, body: CloseSprint) {
    return this.http.post<SprintDetailOut>(`/api/sprints/${id}/close`, body);
  }
}
