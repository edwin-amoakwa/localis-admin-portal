import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionStore } from './session-store';

/** Adds the bearer token to API calls, and signs out when the server says the session has expired. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const token = SessionStore.token();
  const isApi = request.url.startsWith(environment.baseUrl);

  const outgoing =
    token && isApi ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (isApi && token && error instanceof HttpErrorResponse && error.status === 401) {
        SessionStore.clear();
        // A full reload resets every in-memory signal that still holds the old user.
        router.navigate(['/login'], { queryParams: { expired: 1 } }).then(() => location.reload());
      }
      return throwError(() => error);
    }),
  );
};
