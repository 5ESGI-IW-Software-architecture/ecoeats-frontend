import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { EMPTY, catchError, throwError } from 'rxjs';

const PUBLIC_URLS = ['/auth/login', '/auth/signup', '/auth/activate'];

export const httpAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isPublic = PUBLIC_URLS.some((url) => req.url.includes(url));
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
