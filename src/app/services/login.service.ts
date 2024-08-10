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
    this.cookieService.set('isLoggedIn', 'true', 1);
    
  }

  logout() {
    this.loggedIn = false;
    this.cookieService.delete('isLoggedIn');

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
