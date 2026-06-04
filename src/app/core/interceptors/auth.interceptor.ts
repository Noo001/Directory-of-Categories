import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip login and refresh token endpoints
  if (req.url.includes('/front/logon') && !req.url.includes('/current-user')) {
    return next(req);
  }

  const token = authService.getAccessToken();
  if (token) {
    req = addToken(req, token);
  }

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        if (req.url.includes('/front/logon/refresh-token')) {
          authService.logout();
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          return authService.refreshAccessToken().pipe(
            switchMap((response) => {
              isRefreshing = false;
              return next(addToken(req, response.token));
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}
