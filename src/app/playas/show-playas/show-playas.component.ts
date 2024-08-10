
import { Component, OnInit, inject } from '@angular/core';
import { ShowPlayasService } from '../../services/show-playas.service';
import { Router } from '@angular/router';
import { CurrentPlayaService } from '../../services/current-playa.service';

@Component({
  selector: 'app-show-playas',
  templateUrl: './show-playas.component.html',
  styleUrl: './show-playas.component.css'
})
export class ShowPlayasComponent implements OnInit {

  
  constructor(private showPlayasService: ShowPlayasService, private currentPlayaService: CurrentPlayaService, private router: Router) {}
  playas: any[] = []; // Array para almacenar los datos de las playas
  selectedPlaya: any = null;
  ngOnInit(): void {
    this.showPlayasService.getPlayas().subscribe(
      
      data => {
        console.log(data[0]);
        this.playas = data;
      },
      error => {
        console.error('Error:', error);
      }
    );
  }


  abrirPlaya( selectedPlaya: any){
    console.log(selectedPlaya);
    this.currentPlayaService.setCurrentPlaya(selectedPlaya);
    //this.router.navigate(['/playas/playa']);
  }
}




