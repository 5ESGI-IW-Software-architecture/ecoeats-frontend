import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../../store/auth.store';
import { AuthService } from '../auth/auth.service';
import { checkRole } from '../utils/guards.utils';

export const clientGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  return checkRole('client', authStore, authService, router);
};
