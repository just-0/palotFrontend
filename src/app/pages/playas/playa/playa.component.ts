import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CurrentPlayaService } from '../../../services/current-playa.service';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { Subscription } from 'rxjs';

interface Tab {
  name: string;
  icon: string;
  badge?: number;
}

@Component({
    selector: 'app-playa',
    templateUrl: './playa.component.html',
    styleUrl: './playa.component.css',
    standalone: false
})
export class PlayaComponent implements OnInit, OnDestroy{
  constructor(
    private currentPlayaService: CurrentPlayaService,
    private router: Router
  ){}

  Playa: any = null;
  public fechaHora: Date = new Date();
  private subscription: Subscription = new Subscription();
  activeTab: number = 0;

  tabs: Tab[] = [
    {
      name: 'Lector de Placas',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>`
    },
    {
      name: 'Registro Diario',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>`
    },
    {
      name: 'Boletas',
      icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>`
    }
  ];

  ngOnInit(): void {
      console.log('=== COMPONENTE PLAYA INICIANDO ===');
      this.Playa = this.currentPlayaService.getCurrentPlaya();
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
  }
  
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  salirPlaya() {
    // Limpiar la playa actual y regresar al dashboard
    this.currentPlayaService.clearCurrentPlaya();
    this.router.navigate(['/playas']);
  }
}
 