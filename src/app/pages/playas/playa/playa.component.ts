import { Component, OnDestroy, OnInit } from '@angular/core';
import { CurrentPlayaService } from '../../../services/current-playa.service';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { LoginService } from '../../../services/login.service';
import { DatePipe } from '@angular/common';
import { jsPDFclient } from './placas/utils/jsTicketPDF';
import { Auto, Moto } from '../../../services/auto.model';

interface Tab {
  name: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-playa',
  templateUrl: './playa.component.html',
  styleUrl: './playa.component.css',
  standalone: false,
})
export class PlayaComponent implements OnInit, OnDestroy {
  constructor(
    private currentPlayaService: CurrentPlayaService,
    private router: Router,
    private http: HttpClient,
    private loginService: LoginService,
    private datePipe: DatePipe
  ) {
    this.pdfClient = new jsPDFclient(this.datePipe);
  }

  Playa: any = null;
  public fechaHora: Date = new Date();
  private subscription: Subscription = new Subscription();
  activeTab: number = 0;
  currentUser: any = null;

  // Modal para cerrar playa
  showCerrarPlayaModal = false;
  slidePosition = 0;
  isSliding = false;
  isCerrandoPlaya = false;

  // PDF Client y Placa Manual
  pdfClient: jsPDFclient;
  placaManual: string = '';
  
  // Datos de vehículos
  placas: any[] = [];
  filtro: string = '';
  filtroRegistroDiario: string = '';
  plateImageBaseUrl = environment.plateImageBaseUrl;

  tabs: Tab[] = [
    {
      name: 'Lector de Placas',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>`,
    },
    {
      name: 'Registro Diario',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>`,
    },
    {
      name: 'Boletas',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>`,
    },
  ];

  ngOnInit(): void {
    console.log('=== COMPONENTE PLAYA INICIANDO ===');
    this.Playa = this.currentPlayaService.getCurrentPlaya();
    this.currentUser = this.loginService.getCurrentUser();
    console.log('Playa obtenida del servicio:', this.Playa);

    if (!this.Playa || this.Playa === null) {
      console.error('No hay playa seleccionada, redirigiendo al dashboard');
      // Dar un pequeño delay para que se complete la navegación
      setTimeout(() => {
        this.router.navigate(['/playas']);
      }, 100);
      return;
    }

    console.log('Playa válida encontrada, iniciando componente');
    this.subscription.add(
      interval(1000).subscribe(() => {
        this.fechaHora = new Date();
      })
    );

    // Cargar datos de vehículos
    this.loadVehicleData();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  salirPlaya() {
    // Limpiar la playa actual y regresar al dashboard
    this.currentPlayaService.clearCurrentPlaya();
    this.router.navigate(['/playas']);
  }

  // Métodos para cerrar playa
  openCerrarPlayaModal() {
    this.showCerrarPlayaModal = true;
    this.slidePosition = 0;
  }

  closeCerrarPlayaModal() {
    this.showCerrarPlayaModal = false;
    this.slidePosition = 0;
    this.isSliding = false;
  }

  // Método para calcular el porcentaje del deslizador
  getSlidePercentage(): number {
    return Math.round((this.slidePosition / 240) * 100);
  }

  // Métodos para el deslizador tipo "slide to unlock"
  startSlide(event: MouseEvent | TouchEvent) {
    if (this.isCerrandoPlaya) return;

    event.preventDefault();
    this.isSliding = true;

    const startX =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const startPosition = this.slidePosition;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!this.isSliding) return;

      const currentX =
        moveEvent instanceof MouseEvent
          ? moveEvent.clientX
          : moveEvent.touches[0].clientX;
      const deltaX = currentX - startX;

      // Calcular nueva posición (máximo 240px para un contenedor de 300px)
      const newPosition = Math.min(Math.max(startPosition + deltaX, 0), 240);
      this.slidePosition = newPosition;

      // Si llega al final, cerrar la playa
      if (newPosition >= 240) {
        this.isSliding = false;
        this.cerrarPlaya();
        return;
      }
    };

    const handleEnd = () => {
      this.isSliding = false;

      // Si no llegó al final, resetear suavemente
      if (this.slidePosition < 240) {
        const resetInterval = setInterval(() => {
          this.slidePosition = Math.max(this.slidePosition - 8, 0);
          if (this.slidePosition <= 0) {
            clearInterval(resetInterval);
          }
        }, 16);
      }

      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  }

  cerrarPlaya() {
    if (this.isCerrandoPlaya) return;

    this.isCerrandoPlaya = true;

    const cerrarData = {
      usuarioCerro: this.currentUser?.nombre || this.currentUser?.id,
    };

    this.http
      .post(
        `${environment.apiBaseUrl}/playas/${this.Playa.id_playa}/cerrar`,
        cerrarData
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            console.log('Playa cerrada exitosamente');
            this.showNotification('Playa cerrada exitosamente', 'success');
            // Cerrar modal y regresar al dashboard
            this.closeCerrarPlayaModal();
            setTimeout(() => {
              this.salirPlaya();
            }, 1000);
          } else {
            this.showNotification(
              response.message || 'Error al cerrar la playa',
              'error'
            );
            this.isCerrandoPlaya = false;
            this.slidePosition = 0;
          }
        },
        error: (error) => {
          console.error('Error cerrando playa:', error);
          const errorMessage =
            error.error?.message || 'Error al cerrar la playa';
          this.showNotification(errorMessage, 'error');
          this.isCerrandoPlaya = false;
          this.slidePosition = 0;
        },
      });
  }

  // Mostrar notificaciones sin bloquear la página
  showNotification(
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) {
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

  // Métodos para crear vehículos manuales con generación de PDF
  createManualCar() {
    if (this.placaManual === '') {
      this.pdfClient.errorMessage = 'La placa no puede estar vacía';
      this.pdfClient.showAlert = true;

      setTimeout(() => {
        this.pdfClient.fadingOut = true;
        setTimeout(() => {
          this.pdfClient.showAlert = false;
          this.pdfClient.fadingOut = false;
          this.pdfClient.errorMessage = null;
        }, 1000);
      }, 5000);
      return;
    }

    this.currentPlayaService
      .createManualCar(this.placaManual, this.Playa.id_playa, new Date(), 2)
      .subscribe({
        next: (response: Auto) => {
          console.log('Auto manual creado:', response);
          // Agregar a la lista de vehículos
          this.updateVehicleDataAfterCreation(response);
          // Generar PDF del ticket
          this.pdfClient.generateTicketPDF(response, 2, this.Playa);
          // Limpiar el campo de placa
          this.placaManual = '';
          // Mostrar notificación de éxito
          this.showNotification(
            'Ticket de auto generado exitosamente',
            'success'
          );
        },
        error: (error: any) => {
          console.error('Error al crear auto manual:', error);
          this.showNotification('Error al crear el registro del auto', 'error');
        },
      });
  }

  createManualMotorcycle() {
    if (this.placaManual === '') {
      this.pdfClient.errorMessage = 'La placa no puede estar vacía';
      this.pdfClient.showAlert = true;

      setTimeout(() => {
        this.pdfClient.fadingOut = true;
        setTimeout(() => {
          this.pdfClient.showAlert = false;
          this.pdfClient.fadingOut = false;
          this.pdfClient.errorMessage = null;
        }, 1000);
      }, 5000);
      return;
    }

    this.currentPlayaService
      .createManualBike(this.placaManual, this.Playa.id_playa, new Date(), 2)
      .subscribe({
        next: (response: Moto) => {
          console.log('Moto manual creada:', response);
          // Agregar a la lista de vehículos
          this.updateVehicleDataAfterCreation(response);
          // Generar PDF del ticket
          this.pdfClient.generateTicketPDF(response, 2, this.Playa);
          // Limpiar el campo de placa
          this.placaManual = '';
          // Mostrar notificación de éxito
          this.showNotification(
            'Ticket de moto generado exitosamente',
            'success'
          );
        },
        error: (error: any) => {
          console.error('Error al crear moto manual:', error);
          this.showNotification(
            'Error al crear el registro de la moto',
            'error'
          );
        },
      });
  }

  // Métodos para cargar y gestionar datos de vehículos
  loadVehicleData() {
    // Cargar autos
    this.currentPlayaService.getPlacas().subscribe({
      next: (data: Auto[]) => {
        this.placas = data;
        console.log('Autos cargados:', this.placas);
      },
      error: (error: any) => {
        console.error('Error al obtener las placas:', error);
      }
    });

    // Cargar motos
    this.currentPlayaService.getPlacasMotos().subscribe({
      next: (data: any[]) => {
        this.placas = this.placas.concat(data);
        console.log('Motos cargadas, total vehículos:', this.placas.length);
      },
      error: (error: any) => {
        console.error('Error al obtener las placas de motos:', error);
      }
    });
  }

  // Filtrar datos para la tabla
  datosFiltrados() {
    const datosOrdenados = this.placas.sort((a, b) => {
      const fechaA = a.hora_entrada ? new Date(a.hora_entrada).getTime() : 0;
      const fechaB = b.hora_entrada ? new Date(b.hora_entrada).getTime() : 0;
      return fechaB - fechaA;
    });

    if (!this.filtro) {
      return datosOrdenados;
    }

    return datosOrdenados.filter(
      (item) =>
        item.placa?.toLowerCase().includes(this.filtro.toLowerCase()) ||
        item.hora_entrada?.includes(this.filtro) ||
        (item.id_auto && item.id_auto.toString().includes(this.filtro)) ||
        (item.id_moto && item.id_moto.toString().includes(this.filtro))
    );
  }

  // Formatear hora para mostrar en la tabla
  formatHora(date: string | undefined): string {
    return this.datePipe.transform(date, 'hh:mm a') || '';
  }

  // Métodos para imprimir tickets y pagos
  printTicket(item: Auto, newState: number) {
    this.pdfClient.generateTicketPDF(item, newState, this.Playa);
  }

  printPago(item: Auto, newState: number) {
    this.pdfClient.generatePagoPDF(item, newState, this.Playa);
  }

  // Actualizar datos después de crear un vehículo manual
  private updateVehicleDataAfterCreation(newVehicle: Auto | Moto) {
    // Agregar el nuevo vehículo a la lista
    this.placas.unshift(newVehicle);
    console.log('Vehículo agregado a la lista:', newVehicle);
  }

  // Métodos para el registro diario
  datosRegistroDiarioFiltrados() {
    const datosOrdenados = this.placas.sort((a, b) => {
      const fechaA = a.hora_entrada ? new Date(a.hora_entrada).getTime() : 0;
      const fechaB = b.hora_entrada ? new Date(b.hora_entrada).getTime() : 0;
      return fechaB - fechaA;
    });

    if (!this.filtroRegistroDiario) {
      return datosOrdenados;
    }

    return datosOrdenados.filter(
      (item) =>
        item.placa?.toLowerCase().includes(this.filtroRegistroDiario.toLowerCase()) ||
        (item.id_auto && item.id_auto.toString().includes(this.filtroRegistroDiario)) ||
        (item.id_moto && item.id_moto.toString().includes(this.filtroRegistroDiario))
    );
  }

  // Métodos para estadísticas
  calcularIngresosDia(): string {
    const total = this.placas
      .filter(item => item.state === 3 || item.state === 4)
      .reduce((sum, item) => sum + (parseFloat(item.total_pagar) || 0), 0);
    return total.toFixed(2);
  }

  contarVehiculosActivos(): number {
    return this.placas.filter(item => item.state === 1 || item.state === 2).length;
  }

  contarVehiculosFinalizados(): number {
    return this.placas.filter(item => item.state === 3 || item.state === 4).length;
  }
}
