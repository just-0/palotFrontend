import { Component, OnDestroy, OnInit } from '@angular/core';
import { CurrentPlayaService } from '../../../services/current-playa.service';
import {
  WebSocketService,
  VehicleDetectedEvent,
} from '../../../services/websocket.service';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { LoginService } from '../../../services/login.service';
import { DatePipe } from '@angular/common';
import { jsPDFclient } from './utils/jsTicketPDF';
import { Auto, Moto } from '../../../services/auto.model';

interface Tab {
  name: string;
  icon: string;
  badge?: number;
}

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: number;
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
    private webSocketService: WebSocketService,
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

  // Sistema de notificaciones mejorado
  notifications: Notification[] = [];
  private notificationIdCounter = 0;

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
    this.Playa = this.currentPlayaService.getCurrentPlaya();
    this.currentUser = this.loginService.getCurrentUser();

    if (!this.Playa || this.Playa === null) {
      setTimeout(() => {
        this.router.navigate(['/playas']);
      }, 100);
      return;
    }

    // Solo actualizar la hora cada segundo (sin polling de datos)
    this.subscription.add(
      interval(1000).subscribe(() => {
        this.fechaHora = new Date();
      })
    );

    // Cargar datos iniciales de vehículos (sin polling)
    this.loadVehicleData();

    // Configurar WebSocket para recibir notificaciones en tiempo real
    this.setupWebSocket();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();

    // Desconectar WebSocket al salir del componente
    this.webSocketService.leavePlayaRoom();
    this.webSocketService.disconnect();
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
            this.showNotification('Playa cerrada exitosamente', 'success');
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
          const errorMessage =
            error.error?.message || 'Error al cerrar la playa';
          this.showNotification(errorMessage, 'error');
          this.isCerrandoPlaya = false;
          this.slidePosition = 0;
        },
      });
  }

  // Sistema de notificaciones mejorado - aparecen en cola
  showNotification(
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) {
    // Crear nueva notificación
    const newNotification: Notification = {
      id: ++this.notificationIdCounter,
      message,
      type,
      timestamp: Date.now(),
    };

    // Agregar a la cola de notificaciones
    this.notifications.push(newNotification);

    // Crear elemento DOM
    this.createNotificationElement(newNotification);

    // Auto-remover después de 4 segundos
    setTimeout(() => {
      this.removeNotification(newNotification.id);
    }, 4000);
  }

  private createNotificationElement(notification: Notification) {
    const element = document.createElement('div');
    element.id = `notification-${notification.id}`;

    // Calcular posición basada en notificaciones existentes
    const existingNotifications = document.querySelectorAll(
      '[id^="notification-"]'
    );
    const topPosition = 16 + existingNotifications.length * 80; // 16px inicial + 80px por cada notificación

    element.className = `fixed right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 transform translate-x-full max-w-sm`;
    element.style.top = `${topPosition}px`;

    // Aplicar colores según el tipo
    if (notification.type === 'success') {
      element.className += ' bg-green-500';
    } else if (notification.type === 'error') {
      element.className += ' bg-red-500';
    } else {
      element.className += ' bg-blue-500';
    }

    // Agregar contenido con botón de cerrar
    element.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="flex-1 pr-2">${notification.message}</span>
        <button onclick="this.parentElement.parentElement.style.transform='translateX(100%)'" 
                class="ml-2 text-white hover:text-gray-200 transition-colors flex-shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(element);

    // Animar entrada
    setTimeout(() => {
      element.classList.remove('translate-x-full');
    }, 100);
  }

  private removeNotification(id: number) {
    // Remover de la lista
    this.notifications = this.notifications.filter((n) => n.id !== id);

    // Remover elemento DOM
    const element = document.getElementById(`notification-${id}`);
    if (element) {
      element.classList.add('translate-x-full');
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        // Reposicionar notificaciones restantes
        this.repositionNotifications();
      }, 300);
    }
  }

  private repositionNotifications() {
    const existingNotifications = document.querySelectorAll(
      '[id^="notification-"]'
    );
    existingNotifications.forEach((element, index) => {
      const topPosition = 16 + index * 80;
      (element as HTMLElement).style.top = `${topPosition}px`;
    });
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
      .createManualCar(this.placaManual, this.Playa.id_playa, new Date(), 1)
      .subscribe({
        next: (response: Auto) => {
          this.updateVehicleDataAfterCreation(response);
          this.pdfClient.generateTicketPDF(response, 1, this.Playa);
          this.placaManual = '';
          this.showNotification(
            'Ticket de auto generado exitosamente',
            'success'
          );
        },
        error: (error: any) => {
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
      .createManualBike(this.placaManual, this.Playa.id_playa, new Date(), 1)
      .subscribe({
        next: (response: Moto) => {
          this.updateVehicleDataAfterCreation(response);
          this.pdfClient.generateTicketPDF(response, 1, this.Playa);
          this.placaManual = '';
          this.showNotification(
            'Ticket de moto generado exitosamente',
            'success'
          );
        },
        error: (error: any) => {
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
      },
      error: (error: any) => {
        // Error silencioso para no saturar logs
      },
    });

    // Cargar motos
    this.currentPlayaService.getPlacasMotos().subscribe({
      next: (data: any[]) => {
        this.placas = this.placas.concat(data);
      },
      error: (error: any) => {
        // Error silencioso para no saturar logs
      },
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
    if (newState === 2 && item.total_pagar) {
      // Estado 2: Usar datos ya almacenados para generar ticket de venta
      this.pdfClient.generateTicketVentaPDF(item, this.Playa);
    } else {
      // Estados 0 y 1: Generar ticket normal
      this.pdfClient.generateTicketPDF(item, newState, this.Playa);
    }
  }

  printPago(item: Auto, newState: number) {
    this.pdfClient.generatePagoPDF(item, newState, this.Playa);
  }

  // Actualizar datos después de crear un vehículo manual
  private updateVehicleDataAfterCreation(newVehicle: Auto | Moto) {
    // Agregar el nuevo vehículo a la lista
    this.placas.unshift(newVehicle);
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
        item.placa
          ?.toLowerCase()
          .includes(this.filtroRegistroDiario.toLowerCase()) ||
        (item.id_auto &&
          item.id_auto.toString().includes(this.filtroRegistroDiario)) ||
        (item.id_moto &&
          item.id_moto.toString().includes(this.filtroRegistroDiario))
    );
  }

  // Métodos para estadísticas
  calcularIngresosDia(): string {
    const total = this.placas
      .filter((item) => item.state === 2)
      .reduce((sum, item) => sum + (parseFloat(item.total_pagar) || 0), 0);
    return total.toFixed(2);
  }

  contarVehiculosActivos(): number {
    return this.placas.filter((item) => item.state === 0 || item.state === 1)
      .length;
  }

  contarVehiculosFinalizados(): number {
    return this.placas.filter((item) => item.state === 2).length;
  }

  // Método para reimprimir documentos (ticket, boleta o factura)
  reprintDocument(item: Auto | Moto) {
    this.showNotification('Buscando documento para reimprimir...', 'info');

    setTimeout(() => {
      try {
        this.pdfClient.generatePagoPDF(item, item.state, this.Playa);
        this.showNotification('Documento reimpreso exitosamente', 'success');
      } catch (error) {
        this.showNotification('Error al reimprimir el documento', 'error');
      }
    }, 500);
  }

  private setupWebSocket(): void {
    if (!this.hasCameraConfigured()) {
      return;
    }

    // Conectar al WebSocket
    this.webSocketService.connect();

    // Unirse a la sala de la playa actual
    this.webSocketService.joinPlayaRoom(this.Playa.id_playa);

    // Escuchar eventos de vehículos detectados por cámaras
    this.subscription.add(
      this.webSocketService.onVehicleDetected().subscribe({
        next: (event: VehicleDetectedEvent) => {
          this.handleVehicleDetected(event);
        },
        error: (error) => {
          console.error('Error en WebSocket:', error);
        },
      })
    );

    // Monitorear estado de conexión
    this.subscription.add(
      this.webSocketService.getConnectionStatus().subscribe({
        next: (connected: boolean) => {
          if (connected) {
            console.log('WebSocket conectado');
          } else {
            console.log('WebSocket desconectado');
          }
        },
      })
    );
  }

  /**
   * Verifica si la playa tiene una cámara configurada
   */
  private hasCameraConfigured(): boolean {
    return !!(this.Playa?.cam_url && this.Playa.cam_url.trim() !== '');
  }

  /**
   * Obtiene el estado de la cámara para mostrar en la UI
   */
  getCameraStatus(): { hasCamera: boolean; status: string; color: string } {
    const hasCamera = this.hasCameraConfigured();
    const isWebSocketConnected = this.webSocketService.isConnected();

    if (!hasCamera) {
      return {
        hasCamera: false,
        status: 'Sin cámara configurada - Solo registro manual',
        color: 'text-gray-500',
      };
    }

    if (isWebSocketConnected) {
      return {
        hasCamera: true,
        status: 'Cámara conectada - Detección automática activa',
        color: 'text-green-500',
      };
    }

    return {
      hasCamera: true,
      status: 'Cámara configurada - Conectando...',
      color: 'text-yellow-500',
    };
  }

  /**
   * Maneja la llegada de un nuevo vehículo detectado por cámara
   */
  private handleVehicleDetected(event: VehicleDetectedEvent): void {
    if (event.vehicle.id_playa !== this.Playa.id_playa) {
      return;
    }

    const newVehicle = {
      id_auto: event.vehicle.id_auto,
      id_playa: event.vehicle.id_playa,
      placa: event.vehicle.placa,
      hora_entrada: event.vehicle.hora_entrada,
      hora_salida: null,
      image: event.vehicle.image,
      state: event.vehicle.state,
      total_pagar: null,
    };

    const existingIndex = this.placas.findIndex(
      (p) =>
        p.id_auto === newVehicle.id_auto ||
        (p.placa === newVehicle.placa && p.state === 1)
    );

    if (existingIndex === -1) {
      this.placas.unshift(newVehicle);
      this.showNotification(
        `Nueva placa detectada: ${newVehicle.placa}`,
        'success'
      );
    }
  }

  // ==========================================
  // NUEVAS FUNCIONES PARA MANEJO DE ESTADOS
  // ==========================================

  /**
   * Función auxiliar para comparar si dos vehículos son el mismo
   * Maneja tanto Auto como Moto de forma type-safe
   */
  private isSameVehicle(vehicle1: any, vehicle2: Auto | Moto): boolean {
    // Si ambos son autos
    if (vehicle1.id_auto && (vehicle2 as Auto).id_auto) {
      return vehicle1.id_auto === (vehicle2 as Auto).id_auto;
    }
    // Si ambos son motos
    if (vehicle1.id_moto && (vehicle2 as Moto).id_moto) {
      return vehicle1.id_moto === (vehicle2 as Moto).id_moto;
    }
    return false;
  }

  processPayment(item: Auto | Moto): void {
    const fechaHora = new Date();
    const totalHoras = this.calcularHorasEntreFechas(
      item.hora_entrada,
      fechaHora,
      this.Playa.tolerancia
    );
    const tarifa = (item as any).id_moto
      ? this.Playa.tarifaMoto
      : this.Playa.tarifaAuto;
    const montoTotal = totalHoras * tarifa;

    // Determinar si es auto o moto y llamar al método correspondiente
    const paymentObservable = (item as any).id_auto
      ? this.currentPlayaService.carroPagoTicketVenta(
          item as Auto,
          2,
          fechaHora,
          montoTotal
        )
      : this.currentPlayaService.motoPagoTicketVenta(
          item as Moto,
          2,
          fechaHora,
          montoTotal
        );

    paymentObservable.subscribe({
      next: (response: any) => {
        const index = this.placas.findIndex((p) => this.isSameVehicle(p, item));

        if (index !== -1) {
          this.placas[index].state = 2;
          this.placas[index].total_pagar = montoTotal.toFixed(2);
          // Guardar el ID del ticket generado
          if (response.documentId) {
            (this.placas[index] as any).ticket_id = response.documentId;
          }
        }

        this.showNotification(
          `Pago procesado para ${item.placa}. Total: S/. ${montoTotal.toFixed(
            2
          )}`,
          'success'
        );
      },
      error: (error: any) => {
        console.error('Error al procesar pago:', error);
        this.showNotification('Error al procesar el pago', 'error');
      },
    });
  }

  private calcularHorasEntreFechas(
    horaEntrada: string,
    salida: Date,
    tolerancia: number
  ): number {
    const entrada = new Date(horaEntrada);
    let diferenciaMs = salida.getTime() - entrada.getTime();
    const toleranciaMs = tolerancia * 60 * 1000;

    if (diferenciaMs > toleranciaMs) {
      diferenciaMs -= toleranciaMs;
    } else {
      diferenciaMs = 0;
    }

    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);
    let res = Math.ceil(diferenciaHoras);

    return res === 0 ? 1 : res;
  }

  /**
   * Genera boleta directa para un vehículo
   * Mantiene el estado en 2 (CANCELADO)
   */
  generateBoleta(item: Auto | Moto): void {
    this.showNotification('Generando boleta...', 'info');

    setTimeout(() => {
      this.showNotification(`Boleta generada para ${item.placa}`, 'success');
    }, 1000);
  }

  generateFactura(item: Auto | Moto): void {
    this.showNotification('Generando factura...', 'info');

    setTimeout(() => {
      this.showNotification(`Factura generada para ${item.placa}`, 'success');
    }, 1000);
  }

  openPersonalizadoModal(item: Auto | Moto): void {
    this.showNotification(`Documento personalizado para ${item.placa}`, 'info');
  }

  /**
   * Función auxiliar para actualizar el estado de un vehículo
   */
  private updateVehicleState(item: Auto | Moto, newState: number): void {
    this.currentPlayaService.updateStatePlaca(item, newState).subscribe({
      next: (response: any) => {
        console.log(`Estado actualizado a ${newState}:`, response);

        // Actualizar estado local
        const index = this.placas.findIndex((p) => this.isSameVehicle(p, item));

        if (index !== -1) {
          this.placas[index].state = newState;
          this.placas[index].total_pagar =
            response.total_pagar || this.placas[index].total_pagar;
        }
      },
      error: (error: any) => {
        console.error('Error al actualizar estado:', error);
        this.showNotification('Error al actualizar el estado', 'error');
      },
    });
  }

  /**
   * Método auxiliar para verificar si la facturación está habilitada
   * Maneja diferentes tipos de datos (boolean, string, etc.)
   */
  isFacturacionEnabled(): boolean {
    const facturacion = this.Playa?.facturacion;

    // Manejar diferentes tipos de datos
    if (typeof facturacion === 'boolean') {
      return facturacion;
    }

    if (typeof facturacion === 'string') {
      return facturacion.toLowerCase() === 'true' || facturacion === '1';
    }

    if (typeof facturacion === 'number') {
      return facturacion === 1;
    }

    return false;
  }
}
