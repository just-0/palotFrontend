import { Component, inject, OnInit } from '@angular/core';
import { CurrentPlayaService } from '../../../services/current-playa.service';
import { Auto, Moto } from '../../../services/auto.model';
import { DatePipe } from '@angular/common';
import { jsPDFclient } from './utils/jsTicketPDF';
import { FormBuilder } from '@angular/forms';
import * as xml2js from 'xml2js';
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
  placasCamera: any[] = [];
  
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
    
    this._servicioApi.getPlacasCameras().subscribe(
      (response: string) => {
        this.parseXML(response).then(result => {
          
          this.placasCamera = Array.isArray(result.Plates.Plate) ? result.Plates.Plate : [result.Plates.Plate];
          console.log("Parsed Platesxd:", this.placasCamera[0]);
        }).catch(err => {
          console.error("Error parsing XML:", err);
        });
      },
      (error) => {
        console.error("Error occurred:", error);
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
  private parseXML(xmlString: string): Promise<any> {
    const parser = new xml2js.Parser({ explicitArray: false });
    return new Promise((resolve, reject) => {
      parser.parseString(xmlString, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}
