import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../../store/auth.store';
import { AuthService } from '../auth/auth.service';
import { checkRole } from '../utils/guards.utils';
import { Observable } from 'rxjs';

export const restaurantGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  return checkRole('restaurant', authStore, authService, router);
};
