import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(AuthService);

  // Only attach Bearer token to API requests (not to external URLs)
  const isApiRequest = req.url.startsWith(environment.apiUrl);
  if (!isApiRequest) {
    return next(req);
  }

  // Don't attach token to auth endpoints that use cookies
  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/logout');

  let clonedReq = req;

  // Attach Bearer token from memory if available
  const token = authService.token();
  if (token && !isAuthEndpoint) {
    clonedReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401s for non-auth endpoints
      if (
        error.status === 401 &&
        !isAuthEndpoint &&
        !isRefreshing
      ) {
        isRefreshing = true;

        return authService.refreshAccessToken().pipe(
          switchMap((refreshed) => {
            isRefreshing = false;

            if (!refreshed) {
              authService.logout();
              return throwError(() => error);
            }

            // Retry the original request with the new token
            const newToken = authService.token();
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            authService.logout();
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
