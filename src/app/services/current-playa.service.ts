import { Injectable, OnInit } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { query } from '@angular/animations';
import { Auto } from './auto.model';
import { Moto } from './auto.model';

@Injectable({
  providedIn: 'root'
})
export class CurrentPlayaService implements OnInit{
  private baseURL = 'http://localhost:3000/';
  private baseURLCAMERA = 'http://192.168.1.64/';
  CurrentPlaya: any = [];
  
  constructor(private _httpClient: HttpClient) {}

  ngOnInit(): void {
    
    const storedPlaya = localStorage.getItem('currentPlaya');
    if (storedPlaya) {
      this.CurrentPlaya = JSON.parse(storedPlaya);
    }
  }

  public setCurrentPlaya(selectedPlaya: any): void {
    this.CurrentPlaya = selectedPlaya;
    localStorage.setItem('currentPlaya', JSON.stringify(this.CurrentPlaya));
  }

  public getCurrentPlaya(): any {
    const storedPlaya = localStorage.getItem('currentPlaya');
    if (storedPlaya) {
      this.CurrentPlaya = JSON.parse(storedPlaya);
    } else {
      this.CurrentPlaya = null;
    }
    //console.log('Current Playa:', this.CurrentPlaya);
    return this.CurrentPlaya;
  }
  public getPlacasMotos(): Observable<any[]>{
    const query = this.baseURL + "getPlacasMotos" + "?idPlaya="+ this.CurrentPlaya.id_playa;
    
    return this._httpClient.get<any[]>(query);
  }

  public getPlacas(): Observable<Auto[]>{
    const query = this.baseURL + "getPlacas" + "?idPlaya="+ this.CurrentPlaya.id_playa;
    
    return this._httpClient.get<Auto[]>(query);
  }

  public updateStatePlaca(placa :any, state: number){
    //http://localhost:3000/updateStateAuto?state=2&idAuto=2
    
    let id = 0;
    let query = "" ;
    if("id_auto" in placa){
      id = placa.id_auto;
      query = this.baseURL + "updateStateAuto/"+ id;
    }
    else {
      id = placa.id_moto;
      query = this.baseURL + "updateStateMoto/"+ id;
    }
 
    return this._httpClient.put<void>(query,{state});
  }
  public carroPagoTicketVenta(placa :Auto, state: number, fechaHora: Date, Monto: number){
    const horaEntrada = placa.hora_entrada;
    const horaSalida = fechaHora;
    const body = {
      id: placa.id_auto, // Incluye el ID en el cuerpo
      state,
      horaEntrada,
      horaSalida,
      Monto
    };
    const query = `${this.baseURL}carroPagoTicketVenta`;
    return this._httpClient.put<any>(query, body);
  }
  public motoPagoTicketVenta(placa :any, state: number, fechaHora: Date, Monto: number){
    const horaEntrada = placa.hora_entrada;
    const horaSalida = fechaHora;
    const body = {
      id: placa.id_moto, // Incluye el ID en el cuerpo
      state,
      horaEntrada,
      horaSalida,
      Monto
    };
    
    const query = `${this.baseURL}motoPagoTicketVenta`;
    return this._httpClient.put<any>(query, body);

  }
  public createManualCar(placa :string, id_playa: number, fechaHora: Date, state: number){
    const query = `${this.baseURL}createManualCar`;
    const horaEntrada = fechaHora;
    const body = {
      placa,
      id_playa,
      horaEntrada,
      state,
    };
    
    return this._httpClient.put<Auto>(query, body);
  }
  public createManualBike(placa :string, id_playa: number, fechaHora: Date, state: number){
    const query = `${this.baseURL}createManualBike`;
    const horaEntrada = fechaHora;
    const body = {
      placa,
      id_playa,
      horaEntrada,
      state,
    };

    return this._httpClient.put<Moto>(query, body);
  }
  public getBoletas(): Observable<any[]>{
    const query = this.baseURL + "getBoletas"+ "?id_playa="+ this.CurrentPlaya.id_playa;
   
    return this._httpClient.get<any[]>(query);
  }

  public getPlacasCameras(): Observable<any> {
    // URL del endpoint
    const url = 'http://localhost:3000/api/ISAPI/Traffic/channels/1/vehicleDetect/plates/';

    // Configurar los headers
    const headers = new HttpHeaders({
      'Content-Type': 'application/xml',
      'Authorization': 'Basic ' + btoa('admin:Hik12345')  // Autenticación básica
    });

    // Crear el cuerpo vacío como texto
    const body = '<HttpHostNotificationList version="2.0" xmlns="http://www.hikvision.com/ver20/XMLSchema"></HttpHostNotificationList>';

    // Hacer la petición POST con el cuerpo
    return this._httpClient.post(url, body, { headers, responseType: 'text' as 'json' });
}
}
