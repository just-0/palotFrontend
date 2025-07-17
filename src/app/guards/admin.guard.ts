import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {
  const loginService = inject(LoginService);
  const router = inject(Router);
  
  if (!loginService.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }
  
  if (!loginService.isAdmin()) {
    // Redirigir a playas si no es admin
    router.navigate(['/playas']);
    return false;
  }
  
  return true;
};