
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ShowPlayasService } from '../../../services/show-playas.service';
import { Router } from '@angular/router';
import { CurrentPlayaService } from '../../../services/current-playa.service';
import { LoginService } from '../../../services/login.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-show-playas',
    templateUrl: './show-playas.component.html',
    styleUrl: './show-playas.component.css',
    standalone: false
})
export class ShowPlayasComponent implements OnInit {
  defaultPlayaImageUrl = environment.defaultPlayaImageUrl;
  playas: any[] = []; // Array para almacenar los datos de las playas
  selectedPlaya: any = null;
  
  // Modal para crear playa
  showPlayaModal = false;
  playaForm: FormGroup;
  isLoading = false;
  currentUser: any = null;
  
  constructor(
    private showPlayasService: ShowPlayasService, 
    private currentPlayaService: CurrentPlayaService, 
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient,
    private loginService: LoginService
  ) {
    this.playaForm = this.fb.group({
      nombre: ['', Validators.required],
      direccion: [''],
      tarifaAuto: ['', [Validators.required, Validators.min(0)]],
      tarifaMoto: ['', [Validators.required, Validators.min(0)]]
    });
  }
  ngOnInit(): void {
    this.currentUser = this.loginService.getCurrentUser();
    this.loadPlayas();
  }

  loadPlayas() {
    this.showPlayasService.getPlayas().subscribe(
      data => {
        console.log(data[0]);
        this.playas = data;
      },
      error => {
        console.error('Error:', error);
      }
    );
  }


  abrirPlaya(selectedPlaya: any){
    console.log('=== ABRIENDO PLAYA ===');
    console.log('Playa seleccionada:', selectedPlaya);
    console.log('Nombre de la playa:', selectedPlaya.nombre);
    
    // Guardar la playa actual
    this.currentPlayaService.setCurrentPlaya(selectedPlaya);
    
    // Verificar que se guardó correctamente
    const playaGuardada = this.currentPlayaService.getCurrentPlaya();
    console.log('Playa guardada en servicio:', playaGuardada);
    
    // Navegar a la playa
    const ruta = ['/playa', selectedPlaya.nombre];
    console.log('Navegando a:', ruta);
    this.router.navigate(ruta);
  }

  // Métodos para el modal de crear playa
  openCreatePlayaModal() {
    if (this.currentUser?.tipo !== 'admin') {
      alert('Solo los administradores pueden crear playas');
      return;
    }
    this.playaForm.reset();
    this.showPlayaModal = true;
  }

  closePlayaModal() {
    this.showPlayaModal = false;
    this.playaForm.reset();
  }

  createPlaya() {
    if (!this.playaForm.valid) return;

    this.isLoading = true;
    const formData = {
      ...this.playaForm.value,
      nombre_admin: this.currentUser.nombre // Asignar al admin actual
    };

    this.http.post(`${environment.apiBaseUrl}/playas`, formData)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.loadPlayas(); // Recargar la lista
            this.closePlayaModal();
            alert('Playa creada exitosamente');
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating playa:', error);
          alert('Error al crear la playa');
          this.isLoading = false;
        }
      });
  }

  // Verificar si el usuario es admin
  isAdmin(): boolean {
    return this.currentUser?.tipo === 'admin';
  }
}




