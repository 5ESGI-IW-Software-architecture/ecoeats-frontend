import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { restaurantGuard } from './core/guards/restaurant.guard';
import { clientGuard } from './core/guards/client.guard';
import { roleRedirectGuard } from './core/guards/role-redirect.guard';
import { delivererGuard } from './core/guards/deliverer.guard';

export const routes: Routes = [
  { path: '' , pathMatch: 'full', canActivate: [roleRedirectGuard], children: []},
  { path: 'login', loadComponent: () => import('./features/login/login').then((c) => c.Login) },
  { path: 'signup', loadComponent: () => import('./features/signup/signup').then((c) => c.Signup) },
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
      },
      {
        path: 'order/payment/:orderId',
        loadComponent: () => import('./features/portal/client/order-payment/order-payment').then(c => c.OrderPayment),
        canActivate: [authGuard, clientGuard],
      },
      {
        path: 'orders/status/:orderId',
        loadComponent: () => import('./features/portal/client/order-status/order-status').then(c => c.OrderStatus),
        canActivate: [authGuard, clientGuard],
      }
    ],
  },

  {
    path: 'deliverer',
    loadComponent: () => import('./features/portal/deliverer/deliverer-shell/deliverer-shell').then(c => c.DelivererShell),
    canActivate: [authGuard, delivererGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/portal/deliverer/dashboard/dashboard').then(c => c.Dashboard),
        canActivate: [authGuard, delivererGuard],
      },
    ]
  },

  { path: '**', redirectTo: '' },
];
