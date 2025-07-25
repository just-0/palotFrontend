import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShowPlayasComponent } from './show-playas/show-playas.component';
import { PlayasComponent } from './playas.component';
import { AppRoutingModule } from '../../app-routing.module';
import { PlayaComponent } from './playa/playa.component';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DatePipe } from '@angular/common';
import { RegistroComponent } from './playa/registro/registro.component';

// Ya no necesitamos Angular Material para el slider




@NgModule({
  declarations: [
    ShowPlayasComponent,
    PlayasComponent,
    PlayaComponent,
    RegistroComponent,
    
  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    RouterModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    
  ],
  providers: [
    DatePipe
  ]
})
export class PlayasModule { }
