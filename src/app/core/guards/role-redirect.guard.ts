import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../../shared/services/auth.store';

export const roleRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authService.getAccessTokens()) {
    return router.createUrlTree(['/login']);
  }

  const userRole = authStore.user()?.role;
  switch (userRole) {
    case 'client':
      return router.createUrlTree(['/portal']);
    case 'deliverer':
      return router.createUrlTree(['/deliverer']);
    case 'restaurant':
      return router.createUrlTree(['/restaurant']);
    default:
      return router.createUrlTree(['/login']);
  }
};
