import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginService } from '../services/login.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private loginService: LoginService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('=== INTERCEPTOR DEBUG ===');
    console.log('Request URL:', req.url);
    
    // No agregar headers para rutas de autenticación
    if (req.url.includes('/login') || req.url.includes('/auth')) {
      console.log('AuthInterceptor: Skipping auth headers for login/auth route:', req.url);
      return next.handle(req);
    }

    console.log('Is logged in:', this.loginService.isLoggedIn());
    
    // Solo agregar headers si el usuario está logueado y tiene datos válidos
    if (this.loginService.isLoggedIn()) {
      const currentUser = this.loginService.getCurrentUser();
      console.log('Current user:', currentUser);
      
      if (currentUser && currentUser.id && currentUser.tipo) {
        console.log('AuthInterceptor: Adding auth headers for user:', currentUser.nombre);
        console.log('Headers to add:', { userid: currentUser.id.toString(), usertype: currentUser.tipo });
        
        // Clonar la request y agregar headers de autenticación
        const authReq = req.clone({
          setHeaders: {
            'userid': currentUser.id.toString(),
            'usertype': currentUser.tipo
          }
        });
        
        return next.handle(authReq);
      } else {
        console.log('AuthInterceptor: User data incomplete:', { 
          hasUser: !!currentUser, 
          hasId: currentUser?.id, 
          hasTipo: currentUser?.tipo 
        });
      }
    }
    
    console.log('AuthInterceptor: No auth headers added for:', req.url);
    return next.handle(req);
  }
}