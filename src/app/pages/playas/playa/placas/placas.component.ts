import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CurrentPlayaService } from '../../../../services/current-playa.service';
import {
  WebSocketService,
  VehicleDetectedEvent,
} from '../../../../services/websocket.service';
import { Auto, Moto } from '../../../../services/auto.model';
import { DatePipe } from '@angular/common';
import { jsPDFclient } from './utils/jsTicketPDF';
import { FormBuilder } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-placas',
  templateUrl: './placas.component.html',
  styleUrl: './placas.component.css',
  standalone: false,
})
export class PlacasComponent implements OnInit, OnDestroy {
  pdfClient: jsPDFclient;
  plateImageBaseUrl = environment.plateImageBaseUrl;

  placaManual: string = '';
  private _servicioApi = inject(CurrentPlayaService);
  private _webSocketService = inject(WebSocketService);

  filtro: string = '';
  placas: any[] = [];
  playa: any = [];

  // Subscripciones para cleanup
  private subscriptions: Subscription = new Subscription();

  constructor(private form: FormBuilder, private datePipe: DatePipe) {
    this.pdfClient = new jsPDFclient(this.datePipe);
  }
  ngOnInit(): void {
    this.playa = this._servicioApi.getCurrentPlaya();

    if (!this.playa) {
      console.error('No hay playa seleccionada');
      return;
    }

    // Cargar datos iniciales
    this.loadInitialData();

    // Configurar WebSocket para recibir notificaciones en tiempo real
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    // Limpiar subscripciones
    this.subscriptions.unsubscribe();

    // Salir de la sala de WebSocket
    this._webSocketService.leavePlayaRoom();
  }

  /**
   * Carga los datos iniciales de vehículos (autos y motos)
   */
  private loadInitialData(): void {
    // Cargar autos
    this.subscriptions.add(
      this._servicioApi.getPlacas().subscribe({
        next: (data: Auto[]) => {
          this.placas = data;
          console.log('Autos cargados:', this.placas.length);
        },
        error: (error: any) => {
          console.error('Error al obtener las placas:', error);
        },
      })
    );

    // Cargar motos
    this.subscriptions.add(
      this._servicioApi.getPlacasMotos().subscribe({
        next: (data: any[]) => {
          this.placas = this.placas.concat(data);
          console.log('Total vehículos cargados:', this.placas.length);
        },
        error: (error: any) => {
          console.error('Error al obtener las motos:', error);
        },
      })
    );
  }

  /**
   * Configura WebSocket para recibir notificaciones de vehículos detectados en tiempo real
   * Solo se activa si la playa tiene una cámara configurada
   */
  private setupWebSocket(): void {
    // Verificar si la playa tiene cámara configurada
    if (!this.hasCameraConfigured()) {
      console.log('📷 Playa sin cámara configurada - WebSocket no necesario');
      return;
    }

    console.log('📷 Playa con cámara detectada - Activando WebSocket');

    // Conectar al WebSocket
    this._webSocketService.connect();

    // Unirse a la sala de la playa actual
    this._webSocketService.joinPlayaRoom(this.playa.id_playa);

    // Escuchar eventos de vehículos detectados por cámaras
    this.subscriptions.add(
      this._webSocketService.onVehicleDetected().subscribe({
        next: (event: VehicleDetectedEvent) => {
          this.handleVehicleDetected(event);
        },
        error: (error) => {
          console.error('Error en WebSocket:', error);
        },
      })
    );

    // Monitorear estado de conexión
    this.subscriptions.add(
      this._webSocketService.getConnectionStatus().subscribe({
        next: (connected: boolean) => {
          if (connected) {
            console.log(
              '✅ WebSocket conectado - Listo para recibir detecciones de cámara'
            );
          } else {
            console.log('❌ WebSocket desconectado');
          }
        },
      })
    );
  }

  /**
   * Verifica si la playa tiene una cámara configurada
   */
  private hasCameraConfigured(): boolean {
    return !!(this.playa?.cam_url && this.playa.cam_url.trim() !== '');
  }

  /**
   * Obtiene el estado de la cámara para mostrar en la UI
   */
  getCameraStatus(): { hasCamera: boolean; status: string; color: string } {
    const hasCamera = this.hasCameraConfigured();
    const isWebSocketConnected = this._webSocketService.isConnected();

    if (!hasCamera) {
      return {
        hasCamera: false,
        status: 'Sin cámara configurada',
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
    console.log('🚗 Nueva detección de cámara:', event.vehicle);

    // Verificar que el vehículo pertenece a esta playa
    if (event.vehicle.id_playa !== this.playa.id_playa) {
      return;
    }

    // Crear objeto compatible con la estructura existente
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

    // Verificar si el vehículo ya existe en la lista (evitar duplicados)
    const existingIndex = this.placas.findIndex(
      (p) =>
        p.id_auto === newVehicle.id_auto ||
        (p.placa === newVehicle.placa && p.state === 1)
    );

    if (existingIndex === -1) {
      // Agregar al inicio de la lista (más reciente primero)
      this.placas.unshift(newVehicle);
      console.log(
        `✅ Vehículo agregado: ${newVehicle.placa} (Total: ${this.placas.length})`
      );

      // Opcional: Mostrar notificación visual
      this.showVehicleDetectedNotification(newVehicle);
    } else {
      console.log(`⚠️ Vehículo ya existe: ${newVehicle.placa}`);
    }
  }

  /**
   * Muestra una notificación visual cuando se detecta un nuevo vehículo
   */
  private showVehicleDetectedNotification(vehicle: any): void {
    // Crear elemento de notificación temporal
    const notification = document.createElement('div');
    notification.className =
      'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>Nueva placa detectada: <strong>${vehicle.placa}</strong></span>
      </div>
    `;

    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);

    // Auto-remover después de 3 segundos
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
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
        item.placa?.includes(this.filtro) ||
        item.hora_entrada?.includes(this.filtro) ||
        item.id_auto.toString().includes(this.filtro)
    );
  }

  createManualCar() {
    if (this.placaManual == '') {
      this.pdfClient.errorMessage = 'La placa no puede estar vacia';
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
    this._servicioApi
      .createManualCar(this.placaManual, this.playa.id_playa, new Date(), 2)
      .subscribe(
        (response: Auto) => {
          this.placas.push(response);

          this.pdfClient.generateTicketPDF(response, 2, this.playa);
        },
        (error: any) => {
          console.error('Error al obtener las placas:', error);
        }
      );
  }
  createManualMotorcycle() {
    if (this.placaManual == '') {
      this.pdfClient.errorMessage = 'La placa no puede estar vacia';
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
    this._servicioApi
      .createManualBike(this.placaManual, this.playa.id_playa, new Date(), 2)
      .subscribe(
        (response: Moto) => {
          this.placas.push(response);

          this.pdfClient.generateTicketPDF(response, 2, this.playa);
        },
        (error: any) => {
          console.error('Error al obtener las placas:', error);
        }
      );
  }
  printTicket(item: Auto, newState: number) {
    this.pdfClient.generateTicketPDF(item, newState, this.playa);
  }
  printPago(item: Auto, newState: number) {
    this.pdfClient.generatePagoPDF(item, newState, this.playa);
  }
}
