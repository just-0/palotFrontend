import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { query } from '@angular/animations';
import { Auto } from './auto.model';


@Injectable({
  providedIn: 'root'
})
export class CurrentPlayaService implements OnInit{
  private baseURL = 'http://localhost:3000/';
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

  public getPlacas(): Observable<Auto[]>{
    const query = this.baseURL + "getPlacas" + "?idPlaya="+ this.CurrentPlaya.id_playa;
    
    return this._httpClient.get<Auto[]>(query);
  }

  public updateStatePlaca(placa :Auto, state: number){
    //http://localhost:3000/updateStateAuto?state=2&idAuto=2
    const id = placa.id_auto;
    const query = this.baseURL + "updateStateAuto/"+ id;
    //const query = this.baseURL + "updateStateAuto/1";

    console.log("DEBUGGG ->", id)
    return this._httpClient.put<Auto>(query,{state});
  }
  public carroPagoTicketVenta(placa :Auto, state: number, fechaHora: Date, Monto: number){
    
    

  // Obtén la fecha y hora en formato local
    
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
   
    return this._httpClient.put<Auto>(query, body);
  }

}
