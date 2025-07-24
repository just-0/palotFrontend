import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VehicleDetectedEvent {
  type: 'vehicle-entry';
  vehicle: {
    id_auto: number;
    id_playa: number;
    placa: string;
    hora_entrada: string;
    image?: string;
    state: number;
  };
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private currentPlayaId: number | null = null;

  constructor() {}

  /**
   * Conecta al servidor WebSocket
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    try {
      this.socket = io(environment.apiBaseUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket conectado');
        this.connectionStatus.next(true);
        
        // Si hay una playa seleccionada, unirse a su sala
        if (this.currentPlayaId) {
          this.joinPlayaRoom(this.currentPlayaId);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('❌ WebSocket desconectado');
        this.connectionStatus.next(false);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión WebSocket:', error);
        this.connectionStatus.next(false);
      });

    } catch (error) {
      console.error('❌ Error al conectar WebSocket:', error);
      this.connectionStatus.next(false);
    }
  }

  /**
   * Desconecta del servidor WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus.next(false);
      this.currentPlayaId = null;
    }
  }

  /**
   * Se une a la sala de una playa específica para recibir notificaciones
   */
  joinPlayaRoom(playaId: number): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ WebSocket no conectado, guardando playa para conectar después');
      this.currentPlayaId = playaId;
      return;
    }

    this.currentPlayaId = playaId;
    this.socket.emit('join-playa', playaId);
    console.log(`📍 Unido a la sala de playa: ${playaId}`);
  }

  /**
   * Sale de la sala actual de playa
   */
  leavePlayaRoom(): void {
    if (this.socket?.connected && this.currentPlayaId) {
      this.socket.emit('leave-playa', this.currentPlayaId);
      console.log(`📍 Saliendo de la sala de playa: ${this.currentPlayaId}`);
    }
    this.currentPlayaId = null;
  }

  /**
   * Escucha eventos de vehículos detectados por cámaras
   */
  onVehicleDetected(): Observable<VehicleDetectedEvent> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('WebSocket no conectado');
        return;
      }

      this.socket.on('vehicle-detected', (data: VehicleDetectedEvent) => {
        console.log('🚗 Vehículo detectado por cámara:', data);
        observer.next(data);
      });

      // Cleanup function
      return () => {
        if (this.socket) {
          this.socket.off('vehicle-detected');
        }
      };
    });
  }

  /**
   * Obtiene el estado de conexión como Observable
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Obtiene la playa actual
   */
  getCurrentPlayaId(): number | null {
    return this.currentPlayaId;
  }
}