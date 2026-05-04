import { UserRoles } from '../auth/auth.types';
import { AuthStore } from '../../store/auth.store';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';

export function checkRole(
  role: UserRoles,
  authStore: AuthStore,
  authService: AuthService,
  router: Router,
): Observable<boolean> | boolean {
  const user = authStore.user();

  if (user) {
    if (user.role !== role) {
      router.navigate([`/${user.role.toLowerCase()}`]);
      return false;
    }
    return true;
  }

  return authService.me$().pipe(
    tap((fetchedUser) => authStore.setUser(fetchedUser)),
    map((fetchedUser) => {
      if (fetchedUser.role !== role) {
        router.navigate(['/']);
        return false;
      }
      return true;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    }),
  );
}
