import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { restaurantGuard } from './core/guards/restaurant.guard';
import { clientGuard } from './core/guards/client.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login').then((c) => c.Login) },
  { path: 'signup', loadComponent: () => import('./features/signup/signup').then((c) => c.Signup) },
  // Restaurant
  {
    path: 'restaurant',
    loadComponent: () =>
      import('./features/portal/restaurant/restaurant-shell/restaurant-shell').then(
        (c) => c.RestaurantShell,
      ),
    canActivate: [authGuard, restaurantGuard],
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'menu',
        loadComponent: () =>
          import('./features/portal/restaurant/restaurant-menu/restaurant-menu').then(
            (c) => c.RestaurantMenu,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/portal/restaurant/restaurant-profile/restaurant-profile').then(
            (c) => c.RestaurantProfile,
          ),
      },
      {
        path: 'incoming-orders',
        loadComponent: () =>
          import('./features/portal/restaurant/incoming-orders/incoming-orders').then(
            (c) => c.IncomingOrders,
          ),
      },
      {
        path: 'active-orders',
        loadComponent: () =>
          import('./features/portal/restaurant/active-orders/active-orders').then(
            (c) => c.ActiveOrders,
          ),
      },
    ],
  },
  // Client Routes ============
  {
    path: 'portal',
    loadComponent: () =>
      import('./features/portal/client/client-shell/client-shell').then((c) => c.ClientShell),
    canActivate: [authGuard, clientGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/portal/client/client-home/client-home').then((c) => c.ClientHome),
        canActivate: [authGuard, clientGuard],
      },
      {
        path: 'restaurant/:id',
        loadComponent: () =>
          import('./features/portal/client/restaurant/restaurant').then(
            (c) => c.Restaurant,
          ),
        canActivate: [authGuard, clientGuard],
      }
    ],
  },

  { path: '**', redirectTo: '' },
];
