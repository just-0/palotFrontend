import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoginService } from './services/login.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: false,
})
export class AppComponent implements OnInit {
  title = 'PaLotFrontend';
  showNavbar = false;
  currentUser: any = null;

  constructor(private router: Router, private loginService: LoginService) {}

  ngOnInit() {
    // Show navbar only on main routes, not on auth or individual playa routes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          const url = event.url;
          // Actualizar información del usuario actual
          this.currentUser = this.loginService.getCurrentUser();
          
          // Show navbar only on main routes (incluir /usuarios para admin)
          this.showNavbar = url === '/playas' || 
                           url.startsWith('/dashboard') || 
                           url.startsWith('/configuracion') ||
                           url.startsWith('/usuarios');
        }
      });
  }

  logout() {
    // Limpiar la sesión del servicio de login
    this.loginService.logout();
    localStorage.removeItem('token'); // or however you store auth
    this.router.navigate(['/auth/login']);
  }
}
