import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ShowPlayasService {
  constructor(private _httpClient: HttpClient) {}

  public getPlayas(): Observable<any> {
    // El backend se encarga del filtrado basado en el tipo de usuario
    // El interceptor enviará automáticamente los headers de autenticación
    return this._httpClient.get<any>(`${environment.apiBaseUrl}/playas`);
  }
}
