import { inject } from "@angular/core";
import { Auto } from "../../../../services/auto.model";
import jsPDF from 'jspdf';
import { DatePipe } from '@angular/common';
import { CurrentPlayaService } from "../../../../services/current-playa.service";
import numero2palabra from "./numero2palabra";
export class jsPDFclient{
  
    constructor(private datePipe: DatePipe) {}
    private _servicioApi = inject(CurrentPlayaService);
    public totalHoras: number = 0;
    errorMessage: string | null = null;
    showAlert: boolean = false;
    fadingOut: boolean = false;
  
  public generateTicketPDF(item:Auto, newState:number, playa: any) {
    
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
    doc.text(`VEHICULOS: ${playa.tarifa}`, (doc.internal.pageSize.width - doc.getTextWidth(`VEHICULOS: ${playa.tarifa}`))/2 , 17);
    doc.setFont('helvetica', 'bold');
    doc.text("ID:", 12, 24);     doc.text(String(item.id_auto) , 45, 24);
    doc.text("PLACA:", 12, 29);doc.text(item.placa || "Sin Placa", 45, 29);
    doc.text("HORA:", 12, 34);doc.text(this.datePipe.transform(item.hora_entrada, 'hh:mm a')|| "undefined", 45, 34);
    doc.text("FECHA:", 12, 39);doc.text(this.datePipe.transform(item.hora_entrada, 'dd-MM-yyyy') || "undefined", 45, 39);
    doc.addImage(item.img || "", 'PNG', 20, 45, 40, 20); // Ajusta las coordenadas y el tamaño según sea necesario

    doc.text(playa.direccion, (doc.internal.pageSize.width - doc.getTextWidth(playa.direccion))/2, 70);
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
        }, 10000); // Display alert for 5 seconds
        
      }
    );
    item.state = newState;
  }

  public generatePagoPDF(item: Auto, newState: number, playa: any ){
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
    this.totalHoras = this.calcularHorasEntreFechas(item.hora_entrada,fechaHora,15)
    
    
    doc.text(String(this.totalHoras), 6, 57.5);
    
    doc.text("HR", 12, 57.5);
    doc.text("SERVICIO PLAYA", 18, 57.5);
    doc.text(String(Number(playa.tarifa).toFixed(2)), 56.5, 57.5, { align: 'right' });
    doc.text(`${(this.totalHoras*playa.tarifa).toFixed(2)}`,73, 57.5, { align: 'right' });
    doc.line(2, 60.5, 77, 60.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    const N2W=this.convertAmountToWords(this.totalHoras*playa.tarifa); 
    doc.text(N2W,(doc.internal.pageSize.width - doc.getTextWidth(N2W))/2, 64.5);
    doc.setFontSize(10);
    doc.text("TOTAL:", 40, 71);
    doc.text(`S./ ${(this.totalHoras*playa.tarifa).toFixed(2)}`,73, 71, { align: 'right' });
    
    doc.text(playa.direccion.toUpperCase(), (doc.internal.pageSize.width - doc.getTextWidth(playa.direccion.toUpperCase()))/2, 78);
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



    this._servicioApi.carroPagoTicketVenta(item, newState, fechaHora, this.totalHoras*playa.tarifa).subscribe(
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
        }, 10000); // Display alert for 5 seconds
        
      }
    );
    item.state = newState;
  }
  private calcularHorasEntreFechas(horaEntrada: string, salida: Date, tolerancia: any): number {
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
  private convertAmountToWords(amount: number): string {
    // Configura numeral-words para usar español
    const words = numero2palabra(String(amount));
    
    return `SON: ${words.toUpperCase()} CON ${this.getDecimalPart(amount)}/100 SOLES`;
  }
  private getDecimalPart(amount: number): string {
    // Obtiene la parte decimal del importe
    return Math.round((amount % 1) * 100).toString().padStart(2, '0');
  }
  public formatHora(date: string | undefined): string {
    return this.datePipe.transform(date, 'hh:mm a') || '';
  }
}



