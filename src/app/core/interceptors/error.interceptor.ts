import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't show toast for 401s (handled by auth interceptor)
      if (error.status === 401) {
        return throwError(() => error);
      }

      const message = extractErrorMessage(error);
      toastService.error(message);

      return throwError(() => error);
    }),
  );
};

function extractErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Nema konekcije sa serverom. Proverite internet vezu.';
  }

  if (error.status === 403) {
    return 'Nemate dozvolu za ovu akciju.';
  }

  if (error.status === 404) {
    return 'Traženi resurs nije pronađen.';
  }

  if (error.status >= 500) {
    return 'Greška na serveru. Pokušajte ponovo.';
  }

  // Try to extract message from backend response
  const body = error.error as { message?: string | string[] } | null;
  if (body?.message) {
    return Array.isArray(body.message) ? body.message[0] : body.message;
  }

  return 'Došlo je do greške. Pokušajte ponovo.';
}
