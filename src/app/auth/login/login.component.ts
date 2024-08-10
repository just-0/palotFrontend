import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../../services/login.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  formularioContacto: FormGroup;
  private _servicioApi = inject(LoginService);

  constructor(private form: FormBuilder, private router: Router) {
    this.formularioContacto = this.form.group({
      name: ['', Validators.required],
      password: ['', Validators.required],
    });
  }
  enviar() {
    this._servicioApi
      .checkLogin(
        this.formularioContacto.value.name,
        this.formularioContacto.value.password
      )
      .subscribe((response) => {
        if(response){
          console.log("Componente Login -> Logeadoasd")
          this.router.navigate(['/playas/showPlayas']);
        }
      });
	  
  }
}
