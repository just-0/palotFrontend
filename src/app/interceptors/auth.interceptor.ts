import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginService } from '../services/login.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private loginService: LoginService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    
    // No agregar headers para rutas de autenticación
    if (req.url.includes('/login') || req.url.includes('/auth')) {
      return next.handle(req);
    }
    
    // Solo agregar headers si el usuario está logueado y tiene datos válidos
    if (this.loginService.isLoggedIn()) {
      const currentUser = this.loginService.getCurrentUser();
      
      if (currentUser && currentUser.id && currentUser.tipo) {
        // Clonar la request y agregar headers de autenticación
        const authReq = req.clone({
          setHeaders: {
            'userid': currentUser.id.toString(),
            'usertype': currentUser.tipo
          }
        });
        
        return next.handle(authReq);
      }
    }
    
    return next.handle(req);
  }
}