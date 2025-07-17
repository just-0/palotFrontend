import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private baseURL = `${environment.apiBaseUrl}/login`;
  private loggedIn = false;

  private currentUser: any = null;

  constructor(
    private _httpClient: HttpClient,
    private cookieService: CookieService
  ) {
    // Verificar si hay una cookie válida
    const cookieValue = this.cookieService.get('isLoggedIn');
    this.loggedIn = cookieValue === 'true';
    
    // Cargar información del usuario desde localStorage
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
    
    console.log('LoginService -> Cookie value:', cookieValue, 'LoggedIn:', this.loggedIn);
  }
  login() {
    this.loggedIn = true;

    // Obtener la fecha actual
    const now = new Date();

    // Crear una nueva fecha que será medianoche
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999); // Ajustar a las 23:59:59.999 para que expire justo antes de medianoche

    // Calcular la diferencia en minutos entre ahora y medianoche
    const minutesUntilMidnight =
      (midnight.getTime() - now.getTime()) / (1000 * 60);

    // Establecer la cookie con la expiración a medianoche
    this.cookieService.set('isLoggedIn', 'true', minutesUntilMidnight / 60);
  }

  isLoggedIn() {
    console.log('LoginService -> isLoggedIn() called, returning:', this.loggedIn);
    return this.loggedIn;
  }

  logout() {
    console.log('LoginService -> Logging out user');
    this.loggedIn = false;
    this.currentUser = null;
    this.cookieService.delete('isLoggedIn');
    localStorage.removeItem('currentUser');
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAdmin(): boolean {
    return this.currentUser?.tipo === 'admin';
  }

  isEmpleado(): boolean {
    return this.currentUser?.tipo === 'empleado';
  }

  getUserPlayas() {
    return this.currentUser?.playas || [];
  }
  public checkLogin(username: string, password: string): Observable<boolean> {
    const data = {
      username: username,
      password: password,
    };
    return this._httpClient.post<{success: boolean, user?: any}>(this.baseURL, data).pipe(
      map((response: {success: boolean, user?: any}) => {
        if (response.success && response.user) {
          // Guardar información del usuario
          this.currentUser = response.user;
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.login();
        }
        return response.success;
      })
    );
  }
}
