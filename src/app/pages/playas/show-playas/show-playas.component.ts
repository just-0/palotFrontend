
import { Component, OnInit, inject } from '@angular/core';
import { ShowPlayasService } from '../../../services/show-playas.service';
import { Router } from '@angular/router';
import { CurrentPlayaService } from '../../../services/current-playa.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-show-playas',
    templateUrl: './show-playas.component.html',
    styleUrl: './show-playas.component.css',
    standalone: false
})
export class ShowPlayasComponent implements OnInit {
  defaultPlayaImageUrl = environment.defaultPlayaImageUrl;
  
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


  abrirPlaya(selectedPlaya: any){
    console.log('=== ABRIENDO PLAYA ===');
    console.log('Playa seleccionada:', selectedPlaya);
    console.log('Nombre de la playa:', selectedPlaya.nombre);
    
    // Guardar la playa actual
    this.currentPlayaService.setCurrentPlaya(selectedPlaya);
    
    // Verificar que se guardó correctamente
    const playaGuardada = this.currentPlayaService.getCurrentPlaya();
    console.log('Playa guardada en servicio:', playaGuardada);
    
    // Navegar a la playa
    const ruta = ['/playa', selectedPlaya.nombre];
    console.log('Navegando a:', ruta);
    this.router.navigate(ruta);
  }
}




