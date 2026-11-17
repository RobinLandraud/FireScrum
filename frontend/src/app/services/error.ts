import { HttpErrorResponse } from '@angular/common/http';
import { toast } from '@spartan-ng/brain/sonner';

/** Shows the message returned by the API (`{ "error": "..." }`). */
export function toastApiError(err: unknown) {
  const message = err instanceof HttpErrorResponse ? (err.error?.error ?? err.message) : String(err);
  toast.error(message);
}
