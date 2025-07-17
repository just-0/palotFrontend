import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../services/login.service'; 
import { inject } from '@angular/core';

export const guardLoginGuard: CanActivateFn = (route, state) => {
  const _servicioApi = inject(LoginService);
  const router = inject(Router);
  
  console.log("Guard Login -> Verificando autenticación:", _servicioApi.isLoggedIn());
  
  if (_servicioApi.isLoggedIn()) {
    return true;
  } else {
    console.log("Guard Login -> Usuario no autenticado, redirigiendo al login");
    router.navigate(['/auth/login']);
    return false;
  }
};
