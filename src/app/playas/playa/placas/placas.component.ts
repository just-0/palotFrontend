import { Component, inject, OnInit } from '@angular/core';
import { CurrentPlayaService } from '../../../services/current-playa.service';
import { Auto, Moto } from '../../../services/auto.model';
import { DatePipe } from '@angular/common';
import { jsPDFclient } from './utils/jsTicketPDF';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-placas',
  templateUrl: './placas.component.html',
  styleUrl: './placas.component.css'
})
export class PlacasComponent implements OnInit{
  pdfClient: jsPDFclient;
 
  placaManual: string = "";
  constructor (private form: FormBuilder, private datePipe: DatePipe ){
    this.pdfClient = new jsPDFclient(this.datePipe);

  };
  private _servicioApi = inject(CurrentPlayaService);
  filtro: string = '';
  placas: any[] = [];
  
  playa: any=[];
  ngOnInit(): void {
    this._servicioApi.getPlacas().subscribe(
      data => {
        this.placas = data;
        console.log(this.placas)
      },
      error => {
        console.error('Error al obtener las placas:', error);
      }
    );
    this._servicioApi.getPlacasMotos().subscribe(
      data => {
        this.placas = this.placas.concat(data);
        
      },
      error => {
        console.error('Error al obtener las placasMotos:', error);
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

  createManualCar(){
    if(this.placaManual == ""){
      this.pdfClient.errorMessage = 'La placa no puede estar vacia';
      this.pdfClient.showAlert = true;

        // Start fade-out after 5 seconds
        setTimeout(() => {
          this.pdfClient.fadingOut = true;
          setTimeout(() => {
            this.pdfClient.showAlert = false;
            this.pdfClient.fadingOut = false; // Reset fade-out state
            this.pdfClient.errorMessage = null; // Optionally clear the message
          }, 1000); // Match this duration with the CSS transition duration
        }, 5000); // Display alert for 5 seconds
      return;
    }
    this._servicioApi.createManualCar(this.placaManual, this.playa.id_playa,new Date,2
    ).subscribe(
      response => {
        this.placas.push(response);
        
        this.pdfClient.generateTicketPDF(response,2,this.playa);
      },
      error => {
        console.error('Error al obtener las placas:', error);
      }
    );
    
  }
  createManualMotorcycle(){
    if(this.placaManual == ""){
      this.pdfClient.errorMessage = 'La placa no puede estar vacia';
      this.pdfClient.showAlert = true;

        // Start fade-out after 5 seconds
        setTimeout(() => {
          this.pdfClient.fadingOut = true;
          setTimeout(() => {
            this.pdfClient.showAlert = false;
            this.pdfClient.fadingOut = false; // Reset fade-out state
            this.pdfClient.errorMessage = null; // Optionally clear the message
          }, 1000); // Match this duration with the CSS transition duration
        }, 5000); // Display alert for 5 seconds
      return;
    }
    this._servicioApi.createManualBike(this.placaManual, this.playa.id_playa,new Date,2
    ).subscribe(
      response => {
        this.placas.push(response);
        
        this.pdfClient.generateTicketPDF(response,2,this.playa);
      },
      error => {
        console.error('Error al obtener las placas:', error);
      }
    );
  }
  printTicket(item:Auto, newState:number ) {
    this.pdfClient.generateTicketPDF(item,newState,this.playa);
  }
  printPago(item: Auto, newState: number ){
    
    this.pdfClient.generatePagoPDF(item,newState,this.playa);
  }
}
