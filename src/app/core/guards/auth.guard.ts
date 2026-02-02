import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const roles = authService.getUserRoles(); // Get current user roles

    if (roles.includes('ADMIN')) {
      router.navigate(['/stayView']);
    }
    else {
      router.navigate(['/dashboard']);
    }
    return false;
  }

  return true;
};
