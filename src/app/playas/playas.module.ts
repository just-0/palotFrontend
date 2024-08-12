import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShowPlayasComponent } from './show-playas/show-playas.component';
import { PlayasComponent } from './playas.component';
import { AppRoutingModule } from '../app-routing.module';
import { PlayaComponent } from './playa/playa.component';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { PlacasComponent } from './playa/placas/placas.component';
import { DatePipe } from '@angular/common';
import { RegistroComponent } from './playa/registro/registro.component';




@NgModule({
  declarations: [
    ShowPlayasComponent,
    PlayasComponent,
    PlayaComponent,
    PlacasComponent,
    RegistroComponent,
    
  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    RouterModule,
    NgbModule,
    FormsModule,
    
  ]
})
export class PlayasModule { }
