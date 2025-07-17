import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../../services/login.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone: false,
})
export class LoginComponent {
  formularioContacto: FormGroup;
  private _servicioApi = inject(LoginService);
  isLoading = false;
  errorMessage = '';

  constructor(private form: FormBuilder, private router: Router) {
    this.formularioContacto = this.form.group({
      name: ['', Validators.required],
      password: ['', Validators.required],
    });
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
              console.log('Componente Login -> Logueado correctamente');
              this.router.navigate(['/playas']);
            } else {
              console.log('Componente Login -> Credenciales incorrectas');
              this.errorMessage =
                'Credenciales incorrectas. Por favor, verifica tu usuario y contraseña.';
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Componente Login -> Error en el login:', error);
            this.errorMessage =
              'Error de conexión. Por favor, intenta de nuevo.';
          },
        });
    } else {
      console.log('Componente Login -> Formulario inválido');
      this.errorMessage = 'Por favor, completa todos los campos.';
    }
  }
}
