import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../../shared/services/auth.store';
import { AuthService } from '../auth/auth.service';
import { checkRole } from '../utils/guards.utils';

export const delivererGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  return checkRole('deliverer', authStore, authService, router);
};
