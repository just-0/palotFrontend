import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private baseURL = 'http://localhost:3000/login'; //Cambiarlo por la API backend
  private loggedIn = false;

  constructor(private _httpClient: HttpClient, private cookieService: CookieService) {
    this.loggedIn = this.cookieService.get('isLoggedIn') === 'true';

  }
  login() {
    this.loggedIn = true;
  
    // Obtener la fecha actual
    const now = new Date();
  
    // Crear una nueva fecha que será medianoche
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999); // Ajustar a las 23:59:59.999 para que expire justo antes de medianoche
  
    // Calcular la diferencia en minutos entre ahora y medianoche
    const minutesUntilMidnight = (midnight.getTime() - now.getTime()) / (1000 * 60);
  
    // Establecer la cookie con la expiración a medianoche
    this.cookieService.set('isLoggedIn', 'true', minutesUntilMidnight / 60);
  }

  isLoggedIn() {
    return this.loggedIn;
  }
  public checkLogin(username: string, password: string): Observable<boolean> {
    const data = {
      username: username,
      password: password,
    };
    return this._httpClient.post<any>(this.baseURL, data).pipe(
      map((response) => {
        if (response.success) {
          this.login();
          

        }
        return response.success;
      })
    );
  }
}
