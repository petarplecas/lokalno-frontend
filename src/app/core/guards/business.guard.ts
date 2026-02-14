import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models';

export const businessGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.userRole();

  if (role === Role.BUSINESS || role === Role.ADMIN) {
    return true;
  }

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  return router.createUrlTree(['/']);
};
