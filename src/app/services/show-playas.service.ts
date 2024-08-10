import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShowPlayasService {
  private baseURL = 'http://localhost:3000/showPlayas';

  constructor(private _httpClient: HttpClient) {}
 
  public getPlayas(): Observable<any> {
    
    return this._httpClient.get<any>(this.baseURL);
  }

  
}
/*  */