import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import type { PointUpdate } from '@contracts/PointUpdate';

@Service()
export class ValidationPointApi {
  private http = inject(HttpClient);

  update(id: number, body: PointUpdate) {
    return this.http.patch<void>(`/api/validation-points/${id}`, body);
  }
}
