import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const expectedRoles: string[] = route.data?.['roles'] || [];
  const user = authService.currentUser();
  
  if (user && expectedRoles.includes(user.role)) {
    return true;
  }
  
  // If not authorized or mismatch role, redirect to landing
  router.navigate(['/']);
  return false;
};
