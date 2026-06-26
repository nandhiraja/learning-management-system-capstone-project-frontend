import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
 {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent),
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes)
  },
    {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard]
  },
    {
    path: 'courses',
    loadChildren: () => import('./features/courses/courses.routes').then((m) => m.coursesRoutes)
  },
  {
    path: 'learning',
    loadChildren: () => import('./features/learning/learning.routes').then((m) => m.learningRoutes),
    canActivate: [authGuard]
  },
   {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then((m) => m.CartComponent),
    canActivate: [authGuard]
  },


  {
    path: '**',
    redirectTo: ''
  }
];
