import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import type { ProjectOut } from '@contracts/ProjectOut';

@Service()
export class ProjectApi {
  private http = inject(HttpClient);

  get() {
    return this.http.get<ProjectOut>('/api/project');
  }
}
