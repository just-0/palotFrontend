import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AuthComponent } from './auth/auth.component';
import { PlayasComponent } from './playas/playas.component';
import { ShowPlayasComponent } from './playas/show-playas/show-playas.component';
import { guardLoginGuard } from './guards/guard-login.guard';
import { PlayaComponent } from './playas/playa/playa.component';


const routes: Routes = [
  {path: '', redirectTo: 'auth/login', pathMatch: 'full'},
  {path: 'auth', component:AuthComponent, children: [{
    path: 'login', component:LoginComponent, 
  }]},
  {path: 'playas', component:PlayasComponent, canActivate: [guardLoginGuard],children: [{
    path: 'showPlayas', component:ShowPlayasComponent,
    }]},
  {path: 'playas/:Playa', component: PlayaComponent}
  

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
