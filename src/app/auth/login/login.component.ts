import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../../services/login.service';
import { ThemeService } from '../../services/theme.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone: false,
})
export class LoginComponent implements OnInit, OnDestroy {
  formularioContacto: FormGroup;
  private _servicioApi = inject(LoginService);
  isLoading = false;
  errorMessage = '';
  private previousTheme: boolean = false;

  constructor(
    private form: FormBuilder, 
    private router: Router,
    private themeService: ThemeService
  ) {
    this.formularioContacto = this.form.group({
      name: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    // Guardar el tema actual y forzar modo claro
    this.previousTheme = this.themeService.getCurrentTheme();
    this.themeService.setDarkMode(false);
  }

  ngOnDestroy() {
    // Restaurar el tema anterior cuando se salga del login
    this.themeService.setDarkMode(this.previousTheme);
  }
  enviar() {
    if (this.formularioContacto.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this._servicioApi
        .checkLogin(
          this.formularioContacto.value.name,
          this.formularioContacto.value.password
        )
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response) {
              this.router.navigate(['/playas']);
            } else {
              this.errorMessage =
                'Credenciales incorrectas. Por favor, verifica tu usuario y contraseña.';
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage =
              'Error de conexión. Por favor, intenta de nuevo.';
          },
        });
    } else {
      this.errorMessage = 'Por favor, completa todos los campos.';
    }
  }
}
