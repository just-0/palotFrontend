import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { AuthModule } from './auth/auth.module';
import { PlayasModule } from './playas/playas.module';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DatePipe } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    RouterModule,
    AuthModule,
    PlayasModule,
    DatePipe
  ],
  providers: [provideAnimationsAsync(), DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
