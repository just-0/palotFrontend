import { Component, inject, OnInit } from '@angular/core';
import { CurrentPlayaService } from '../../../services/current-playa.service';
import { Router } from '@angular/router';
import { Auto } from '../../../services/auto.model';
import { DatePipe } from '@angular/common';
import jsPDF from 'jspdf';
import numero2palabra from './utils/numero2palabra';


@Component({
  selector: 'app-placas',
  templateUrl: './placas.component.html',
  styleUrl: './placas.component.css'
})
export class PlacasComponent implements OnInit{
  constructor (private datePipe: DatePipe ){};
  private _servicioApi = inject(CurrentPlayaService);
  

  errorMessage: string | null = null;
  showAlert: boolean = false;
  fadingOut: boolean = false;

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
  convertAmountToWords(amount: number): string {
    // Configura numeral-words para usar español
    const words = numero2palabra(String(amount));
    console.log("DEBUGGGG -> ", words);
    return `SON: ${words.toUpperCase()} CON ${this.getDecimalPart(amount)}/100 SOLES`;
  }
  getDecimalPart(amount: number): string {
    // Obtiene la parte decimal del importe
    return Math.round((amount % 1) * 100).toString().padStart(2, '0');
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
  formatHora(date: string | undefined): string {
    return this.datePipe.transform(date, 'hh:mm a') || '';
  }
 calcularHorasEntreFechas(horaEntrada: string, salida: Date, tolerancia: any): number {
    const entrada = new Date(horaEntrada);
    let diferenciaMs = salida.getTime() - entrada.getTime();
    const toleranciaMs = tolerancia * 60 * 1000;
    if (diferenciaMs > toleranciaMs) {
      diferenciaMs -= toleranciaMs;
    } else {
      diferenciaMs = 0;
    }
  
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);
    let res = (Math.ceil(diferenciaHoras));
    
    return res== 0?1:res;
  }
  
  
  printTicket(item:Auto, newState:number ) {
    
    const doc = new jsPDF({
      unit: 'mm',
      format: [79, 85]
    });
  
    
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text("TICKET PLAYA", (doc.internal.pageSize.width - doc.getTextWidth("TICKET PLAYA"))/2, 7);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text("TARIFA HORA/FRACCION", (doc.internal.pageSize.width - doc.getTextWidth("TARIFA HORA/FRACCION"))/2, 13);
    doc.text(`VEHICULOS: ${this.playa.tarifa}`, (doc.internal.pageSize.width - doc.getTextWidth(`VEHICULOS: ${this.playa.tarifa}`))/2 , 17);
    doc.setFont('helvetica', 'bold');
    doc.text("ID:", 12, 24);     doc.text(String(item.id_auto) , 45, 24);
    doc.text("PLACA:", 12, 29);doc.text(item.placa || "Sin Placa", 45, 29);
    doc.text("HORA:", 12, 34);doc.text(this.datePipe.transform(item.hora_entrada, 'hh:mm a')|| "undefined", 45, 34);
    doc.text("FECHA:", 12, 39);doc.text(this.datePipe.transform(item.hora_entrada, 'dd-MM-yyyy') || "undefined", 45, 39);
    doc.addImage(item.img || "", 'PNG', 20, 45, 40, 20); // Ajusta las coordenadas y el tamaño según sea necesario

    doc.text(this.playa.direccion, (doc.internal.pageSize.width - doc.getTextWidth(this.playa.direccion))/2, 70);
    doc.text("AREQUIPA-AREQUIPA-AREQUIPA", 10, 74);
    doc.setFontSize(12);
    doc.text("GRACIAS POR SU PREFERENCIA", 5, 80);
  
    
    const pdfBlob = doc.output('blob');
    
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
  
    
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe); 
      }, 10000); 
    };

    this._servicioApi.updateStatePlaca(item, newState).subscribe(
      response => {
        console.log('Actualización exitosa:', response);
        
        
      },
      error => {
        console.error('Error en la actualización:', error);
        this.errorMessage = 'Error en la Base de Datos, informar del error inmediatamente.';
        this.showAlert = true;

        // Start fade-out after 5 seconds
        setTimeout(() => {
          this.fadingOut = true;
          setTimeout(() => {
            this.showAlert = false;
            this.fadingOut = false; // Reset fade-out state
            this.errorMessage = null; // Optionally clear the message
          }, 1000); // Match this duration with the CSS transition duration
        }, 7000); // Display alert for 5 seconds
        
      }
    );
    item.state = newState;
  }
  printPago(item: Auto, ){
    const doc = new jsPDF({
      unit: 'mm',
      format: [79, 100]
    });

    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("TICKET DE VENTA", (doc.internal.pageSize.width - doc.getTextWidth("TICKET DE VENTA"))/2, 20);
    doc.text("OR002-", (doc.internal.pageSize.width - doc.getTextWidth("0R002-"))/2, 25);
    doc.text("TICKET: ", 3, 30);
    doc.text(`PLACA: ${item.placa}`, 3, 35);
    doc.text(`Fecha Entrada: ${this.datePipe.transform(item.hora_entrada, 'dd-MM-yyyy hh:mm a')|| "undefined"}`, 3, 40);
    let fechaHora = new Date();
    //fechaHora | date:'dd/MM/yyyy'
    doc.text(`Fecha Salida: ${this.datePipe.transform(fechaHora, 'dd-MM-yyyy hh:mm a')|| "undefined"}`, 3, 45);
    doc.line(2, 48, 77, 48);
    doc.setFontSize(8);
    doc.text("CAN.", 3, 53);
    doc.text("ME.", 12, 53);
    doc.text("DESCRIPCIÓN", 18, 53);
    doc.text("PRECIO", 46, 53);
    doc.text("IMPORTE", 60, 53);
    doc.line(2, 54.5, 77, 54.5);
    doc.setFont('helvetica', 'normal');
    //const horaEntrada = '2024-08-07T07:00:00';
    //const horaSalida = new Date('2024-08-07T08:16:00');
    //const totalHoras = this.calcularHorasEntreFechas(horaEntrada,horaSalida,15)
    const totalHoras = this.calcularHorasEntreFechas(item.hora_entrada,fechaHora,15)
    
    
    doc.text(String(totalHoras), 6, 57.5);
    
    doc.text("HR", 12, 57.5);
    doc.text("SERVICIO PLAYA", 18, 57.5);
    doc.text(String(Number(this.playa.tarifa).toFixed(2)), 56.5, 57.5, { align: 'right' });
    doc.text(`${(totalHoras*this.playa.tarifa).toFixed(2)}`,73, 57.5, { align: 'right' });
    doc.line(2, 60.5, 77, 60.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    const N2W=this.convertAmountToWords(totalHoras*this.playa.tarifa); 
    doc.text(N2W,(doc.internal.pageSize.width - doc.getTextWidth(N2W))/2, 64.5);
    doc.setFontSize(10);
    doc.text("TOTAL:", 40, 71);
    doc.text(`S./ ${(totalHoras*this.playa.tarifa).toFixed(2)}`,73, 71, { align: 'right' });
    
    doc.text(this.playa.direccion.toUpperCase(), (doc.internal.pageSize.width - doc.getTextWidth(this.playa.direccion.toUpperCase()))/2, 78);
    doc.text("AREQUIPA-AREQUIPA-AREQUIPA", (doc.internal.pageSize.width - doc.getTextWidth("AREQUIPA-AREQUIPA-AREQUIPA"))/2, 82);
    doc.setFontSize(12);
    doc.text("GRACIAS POR SU PREFERENCIA", (doc.internal.pageSize.width - doc.getTextWidth("GRACIAS POR SU PREFERENCIA"))/2, 86);

    const pdfBlob = doc.output('blob');
    
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
  
    
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe); 
      }, 10000); 
    };

    
  }


}
