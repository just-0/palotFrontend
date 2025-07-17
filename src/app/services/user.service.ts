import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string | number;
  nombre: string;
  tipo: 'admin' | 'empleado';
  numDias?: number;
  playas: Array<{
    id_playa: number;
    nombre: string;
  }>;
}

export interface CreateUserRequest {
  nombre: string;
  password: string;
  tipo: 'admin' | 'empleado';
  numDias?: number;
  playasAsignadas?: number[];
}

export interface UpdateUserRequest {
  nombre?: string;
  password?: string;
  numDias?: number;
  playasAsignadas?: number[];
  tipo: 'admin' | 'empleado';
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<{ success: boolean; data: User[] }> {
    return this.http.get<{ success: boolean; data: User[] }>(this.apiUrl);
  }

  createUser(userData: CreateUserRequest): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.post<{ success: boolean; message: string; data: any }>(this.apiUrl, userData);
  }

  updateUser(id: string | number, userData: UpdateUserRequest): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.put<{ success: boolean; message: string; data: any }>(`${this.apiUrl}/${id}`, userData);
  }

  deleteUser(id: string | number, tipo: 'admin' | 'empleado'): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}/${tipo}`);
  }

  getUserPlayas(id: string | number, tipo: 'admin' | 'empleado'): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/${id}/${tipo}/playas`);
  }
}