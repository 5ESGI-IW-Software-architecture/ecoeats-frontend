import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { EMPTY, catchError, throwError } from 'rxjs';

const PUBLIC_ROUTES: { url: string; method: string }[] = [
  { url: '/api/auth/login', method: 'POST' },
  { url: '/api/auth/activate', method: 'POST' },
  { url: '/api/restaurants', method: 'POST' },
  { url: '/api/deliverers', method: 'POST' },
  { url: '/api/clients', method: 'POST' },
];

export const httpAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const path = new URL(req.url).pathname;

  const isPublic = PUBLIC_ROUTES.some((route) => req.method == route.method && path == route.url);
  console.log(path, isPublic)

  if (isPublic) return next(req);

  const accessToken = authService.getAccessTokens();
  if (!accessToken) {
    router.navigate(['/login']);
    return EMPTY;
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  ).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.clearTokens();
        router.navigate(['/login']);
        return EMPTY;
      }
      return throwError(() => error);
    }),
  );
};
