import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import type { NewTask } from '@contracts/NewTask';
import type { StatusUpdate } from '@contracts/StatusUpdate';
import type { TaskOut } from '@contracts/TaskOut';

@Service()
export class TaskApi {
  private http = inject(HttpClient);

  create(userStoryId: number, body: NewTask) {
    return this.http.post<TaskOut>(`/api/user-stories/${userStoryId}/tasks`, body);
  }

  /** Même corps que la création ; les points cochés dont le libellé est conservé restent cochés. */
  update(id: number, body: NewTask) {
    return this.http.put<void>(`/api/tasks/${id}`, body);
  }

  delete(id: number) {
    return this.http.delete<void>(`/api/tasks/${id}`);
  }

  /** 409 si `done` alors qu'un point de validation n'est pas coché. */
  setStatus(id: number, body: StatusUpdate) {
    return this.http.patch<void>(`/api/tasks/${id}/status`, body);
  }
}
