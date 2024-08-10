import { CanActivateFn } from '@angular/router';
import { LoginService } from '../services/login.service'; 
import { inject } from '@angular/core';

export const guardLoginGuard: CanActivateFn = (route, state) => {
  const _servicioApi = inject(LoginService);
  console.log("DEBUGGGGGxd ->", _servicioApi.isLoggedIn())
  return _servicioApi.isLoggedIn();
};
