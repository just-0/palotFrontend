
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
  isLoadingPlayas = true; // Estado de carga de playas
  
  // Modal para crear/editar playa
  showPlayaModal = false;
  playaForm: FormGroup;
  isLoading = false;
  currentUser: any = null;
  editingPlaya: any = null;
  
  // Modal para eliminar playa
  showDeleteModal = false;
  playaToDelete: any = null;
  deleteConfirmationText = '';
  isDeletingPlaya = false;
  
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
      tarifaMoto: ['', [Validators.required, Validators.min(0)]],
      tolerancia: ['', [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]], // Tolerancia en minutos (obligatorio, entero)
      facturacion: [false], // Campo para facturación SUNAT
      cam_url: [''], // URL de la cámara
      cam_user: [''], // Usuario de la cámara
      cam_password: [''] // Contraseña de la cámara
    });
  }
  ngOnInit(): void {
    this.currentUser = this.loginService.getCurrentUser();
    this.loadPlayas();
  }

  loadPlayas() {
    this.isLoadingPlayas = true;
    this.showPlayasService.getPlayas().subscribe(
      data => {
        console.log('Playas cargadas:', data);
        this.playas = data || [];
        this.isLoadingPlayas = false;
        
        // Si es empleado y no tiene playas asignadas, mostrar mensaje
        if (this.currentUser?.tipo === 'empleado' && (!data || data.length === 0)) {
          console.log('Empleado sin playas asignadas');
        }
      },
      error => {
        console.error('Error al cargar playas:', error);
        this.playas = [];
        this.isLoadingPlayas = false;
      }
    );
  }


  abrirPlaya(selectedPlaya: any){
    console.log('=== ABRIENDO PLAYA ===');
    console.log('Playa seleccionada:', selectedPlaya);
    console.log('Nombre de la playa:', selectedPlaya.nombre);
    
    // Primero abrir la playa en la base de datos
    const abrirData = {
      usuarioAbrio: this.currentUser?.nombre || this.currentUser?.id
    };

    this.http.post(`${environment.apiBaseUrl}/playas/${selectedPlaya.id_playa}/abrir`, abrirData)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            console.log('Playa abierta exitosamente en la base de datos');
            
            // Recargar las playas para actualizar el estado
            this.loadPlayas();
            
            // Guardar la playa actual con el estado actualizado
            const playaActualizada = { ...selectedPlaya, estado: 'abierto' };
            this.currentPlayaService.setCurrentPlaya(playaActualizada);
            
            // Navegar a la playa
            const ruta = ['/playa', selectedPlaya.nombre];
            console.log('Navegando a:', ruta);
            this.router.navigate(ruta);
          } else {
            this.showNotification(response.message || 'Error al abrir la playa', 'error');
          }
        },
        error: (error) => {
          console.error('Error abriendo playa:', error);
          const errorMessage = error.error?.message || 'Error al abrir la playa';
          this.showNotification(errorMessage, 'error');
        }
      });
  }

  // Mostrar notificaciones sin bloquear la página
  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 transform translate-x-full`;
    
    // Aplicar colores según el tipo
    if (type === 'success') {
      notification.className += ' bg-green-500';
    } else if (type === 'error') {
      notification.className += ' bg-red-500';
    } else {
      notification.className += ' bg-blue-500';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remover después de 3 segundos
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Métodos para el modal de crear/editar playa
  openCreatePlayaModal() {
    if (this.currentUser?.tipo !== 'admin') {
      alert('Solo los administradores pueden crear playas');
      return;
    }
    this.editingPlaya = null;
    this.playaForm.reset();
    this.showPlayaModal = true;
  }

  openEditPlayaModal(playa: any) {
    if (this.currentUser?.tipo !== 'admin') {
      alert('Solo los administradores pueden editar playas');
      return;
    }
    this.editingPlaya = playa;
    this.playaForm.patchValue({
      nombre: playa.nombre,
      direccion: playa.direccion || '',
      tarifaAuto: playa.tarifaAuto || '',
      tarifaMoto: playa.tarifaMoto || '',
      tolerancia: playa.tolerancia || '',
      facturacion: playa.facturacion || false,
      cam_url: playa.cam_url || '',
      cam_user: playa.cam_user || '',
      cam_password: playa.cam_password || ''
    });
    this.showPlayaModal = true;
  }

  closePlayaModal() {
    this.showPlayaModal = false;
    this.editingPlaya = null;
    this.playaForm.reset();
  }

  createPlaya() {
    if (!this.playaForm.valid) return;

    this.isLoading = true;
    
    if (this.editingPlaya) {
      // Actualizar playa existente
      const formData = {
        ...this.playaForm.value
      };

      this.http.put(`${environment.apiBaseUrl}/playas/${this.editingPlaya.id_playa}`, formData)
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadPlayas(); // Recargar la lista
              this.closePlayaModal();
            } else {
              alert(response.message || 'Error al actualizar la playa');
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error updating playa:', error);
            const errorMessage = error.error?.message || 'Error al actualizar la playa';
            alert(errorMessage);
            this.isLoading = false;
          }
        });
    } else {
      // Crear nueva playa
      const formData = {
        ...this.playaForm.value,
        nombre_admin: this.currentUser.id // Usar el ID del usuario actual
      };

      this.http.post(`${environment.apiBaseUrl}/playas`, formData)
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadPlayas(); // Recargar la lista
              this.closePlayaModal();
            } else {
              alert(response.message || 'Error al crear la playa');
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error creating playa:', error);
            const errorMessage = error.error?.message || 'Error al crear la playa';
            alert(errorMessage);
            this.isLoading = false;
          }
        });
    }
  }

  // Verificar si el usuario es admin
  isAdmin(): boolean {
    return this.currentUser?.tipo === 'admin';
  }

  // Métodos para eliminar playa
  openDeletePlayaModal(playa: any) {
    this.playaToDelete = playa;
    this.deleteConfirmationText = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.playaToDelete = null;
    this.deleteConfirmationText = '';
  }

  confirmDeletePlaya() {
    if (this.deleteConfirmationText !== this.playaToDelete?.nombre) {
      return;
    }

    this.isDeletingPlaya = true;
    
    this.http.delete(`${environment.apiBaseUrl}/playas/${this.playaToDelete.id_playa}`)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.loadPlayas(); // Recargar la lista
            this.closeDeleteModal();
          } else {
            alert(response.message || 'Error al eliminar la playa');
          }
          this.isDeletingPlaya = false;
        },
        error: (error) => {
          console.error('Error deleting playa:', error);
          const errorMessage = error.error?.message || 'Error al eliminar la playa';
          alert(errorMessage);
          this.isDeletingPlaya = false;
        }
      });
  }

  // Verificar si un campo es inválido y ha sido tocado
  isFieldInvalid(fieldName: string): boolean {
    const field = this.playaForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Manejar el toggle de facturación
  onFacturacionToggle(event: any) {
    const isChecked = event.target.checked;
    this.playaForm.patchValue({ facturacion: isChecked });
  }

  // Obtener número de playas abiertas
  getPlayasAbiertas(): number {
    return this.playas.filter(playa => playa.estado === 'abierto').length;
  }

  // Determinar el texto del botón según el estado de la playa
  getPlayaButtonText(playa: any): string {
    if (playa.estado === 'abierto') {
      return 'Ir a Playa';
    } else if (playa.horaAbierto && playa.horaCerrado) {
      // Si ya fue abierta y cerrada antes
      return 'Volver a Abrir';
    } else {
      // Primera vez o nunca abierta
      return 'Iniciar Playa';
    }
  }

  // Determinar la clase CSS del botón según el estado
  getPlayaButtonClass(playa: any): string {
    if (playa.estado === 'abierto') {
      return 'w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl';
    } else if (playa.horaAbierto && playa.horaCerrado) {
      return 'w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl';
    } else {
      return 'w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl';
    }
  }

  // Determinar el ícono del botón según el estado
  getPlayaButtonIcon(playa: any): string {
    if (playa.estado === 'abierto') {
      return 'M13 10V3L4 14h7v7l9-11h-7z'; // Icono de ir/entrar
    } else if (playa.horaAbierto && playa.horaCerrado) {
      return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'; // Icono de reiniciar
    } else {
      return 'M13 10V3L4 14h7v7l9-11h-7z'; // Icono de iniciar
    }
  }

  // Manejar la acción del botón según el estado de la playa
  handlePlayaAction(playa: any) {
    if (playa.estado === 'abierto') {
      // Si está abierta, solo navegar
      this.irAPlaya(playa);
    } else {
      // Si está cerrada, abrir primero
      this.abrirPlaya(playa);
    }
  }

  // Navegar a la playa sin abrirla (cuando ya está abierta)
  irAPlaya(selectedPlaya: any) {
    console.log('=== NAVEGANDO A PLAYA ABIERTA ===');
    console.log('Playa seleccionada:', selectedPlaya);
    
    // Guardar la playa actual
    this.currentPlayaService.setCurrentPlaya(selectedPlaya);
    
    // Navegar a la playa
    const ruta = ['/playa', selectedPlaya.nombre];
    console.log('Navegando a:', ruta);
    this.router.navigate(ruta);
  }
}




