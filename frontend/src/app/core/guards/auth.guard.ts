import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.validateToken().pipe(
    map(isValid => {
      if (isValid) {
        return true;
      } else {
        // Redirect to login if not authenticated
        router.navigate(['/auth/login']);
        return false;
      }
    })
  );
};

export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.validateToken().pipe(
    map(isValid => {
      if (isValid) {
        // If already authenticated, redirect to chat
        router.navigate(['/chat']);
        return false;
      } else {
        // Allow access to login page
        return true;
      }
    })
  );
};
