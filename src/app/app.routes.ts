import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login').then(c => c.Login) },
  {path: 'signup', loadComponent: () => import('./features/signup/signup').then(c => c.Signup) },
  { path: '', loadComponent: () => import('./features/home/home').then(c => c.Home) },
];
