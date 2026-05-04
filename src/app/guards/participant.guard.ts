import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const ParticipantGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isParticipant()) {
    return true;
  }

  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
