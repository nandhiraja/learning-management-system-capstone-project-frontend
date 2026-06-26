import { Routes } from '@angular/router';

export const learningRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent)
  }
];
