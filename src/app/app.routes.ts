import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories.component').then((m) => m.CategoriesComponent),
      },
      {
        path: 'categories/:id',
        loadComponent: () => import('./features/categories/categories.component').then((m) => m.CategoriesComponent),
      },
      { path: '', redirectTo: 'categories', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
