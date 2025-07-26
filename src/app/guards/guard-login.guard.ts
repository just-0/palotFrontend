import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../services/login.service'; 
import { inject } from '@angular/core';

export const guardLoginGuard: CanActivateFn = (route, state) => {
  const _servicioApi = inject(LoginService);
  const router = inject(Router);
  
  if (_servicioApi.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/auth/login']);
    return false;
  }
};
