import { Component, inject } from '@angular/core';
import { OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CurrentPlayaService } from '../../../services/current-playa.service';
@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit {
  public boletas:any[] = [];
  
  public playa: any=[];
  filtro: string = '';
  constructor(private _servicioApi: CurrentPlayaService,private datePipe: DatePipe){}
  
  ngOnInit(): void {
    this.playa = this._servicioApi.getCurrentPlaya();
    this._servicioApi.getBoletas().subscribe(
      data => {
        this.boletas = data;
        
      },
      error => {
        console.error('Error al obtener las boletas:', error);
      }
    );    
  }

  public formatHora(date: string | undefined): string {
    return this.datePipe.transform(date, 'hh:mm a') || '';
  }

  
  public datosFiltrados() {
    
    const datosFiltrados = this.boletas.filter(item => 
      item.placa?.toLowerCase().includes(this.filtro.toLowerCase()) || 
      this.formatHora(item.hora_entrada).includes(this.filtro) ||
      item.id.toString().includes(this.filtro)
    );

    
    return datosFiltrados.sort((a, b) => {
      const fechaA = a.hora_entrada ? new Date(a.hora_entrada).getTime() : 0;
      const fechaB = b.hora_entrada ? new Date(b.hora_entrada).getTime() : 0;
      return fechaA - fechaB; // Orden ascendente
    });
  }
}
