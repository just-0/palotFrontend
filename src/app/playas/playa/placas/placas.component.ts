import { Component, inject, OnInit } from '@angular/core';
import { CurrentPlayaService } from '../../../services/current-playa.service';
import { Auto } from '../../../services/auto.model';
import { DatePipe } from '@angular/common';
import { jsPDFclient } from './utils/jsTicketPDF';

@Component({
  selector: 'app-placas',
  templateUrl: './placas.component.html',
  styleUrl: './placas.component.css'
})
export class PlacasComponent implements OnInit{
  pdfClient: jsPDFclient;
  constructor (private datePipe: DatePipe ){
    this.pdfClient = new jsPDFclient(this.datePipe);
  };
  private _servicioApi = inject(CurrentPlayaService);
  filtro: string = '';
  placas: Auto[] = [];
  playa: any=[];
  ngOnInit(): void {
    this._servicioApi.getPlacas().subscribe(
      data => {
        this.placas = data;
        console.log(this.placas);
      },
      error => {
        console.error('Error al obtener las placas:', error);
      }
    );
    this.playa = this._servicioApi.getCurrentPlaya();
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
  
    return datosOrdenados.filter(item => 
      item.placa?.includes(this.filtro) || 
      item.hora_entrada?.includes(this.filtro) ||
      item.id_auto.toString().includes(this.filtro)
    );
  }
  printTicket(item:Auto, newState:number ) {
    this.pdfClient.generateTicketPDF(item,newState,this.playa);
  }
  printPago(item: Auto, newState: number ){
    this.pdfClient.generatePagoPDF(item,newState,this.playa);
  }
}
