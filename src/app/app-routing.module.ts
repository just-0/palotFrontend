import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AuthComponent } from './auth/auth.component';
import { PlayasComponent } from './pages/playas/playas.component';
import { ShowPlayasComponent } from './pages/playas/show-playas/show-playas.component';
import { guardLoginGuard } from './guards/guard-login.guard';
import { PlayaComponent } from './pages/playas/playa/playa.component';
import { ReportesComponent } from './pages/reportes/reportes.component';
import { ConfiguracionComponent } from './pages/configuracion/configuracion.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';

const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    component: AuthComponent,
    children: [
      { path: 'login', component: LoginComponent }
    ]
  },
  // Lista de playas
  { 
    path: 'playas', 
    component: ShowPlayasComponent, 
    canActivate: [guardLoginGuard] 
  },
  // Dashboard con estadísticas y reportes
  { 
    path: 'dashboard', 
    component: ReportesComponent, 
    canActivate: [guardLoginGuard] 
  },
  { 
    path: 'configuracion', 
    component: ConfiguracionComponent, 
    canActivate: [guardLoginGuard] 
  },
  // Usuarios - Solo para Admin
  { 
    path: 'usuarios', 
    component: UsuariosComponent, 
    canActivate: [guardLoginGuard] 
  },
  // Playa individual (sin navbar) - usando ruta diferente
  { 
    path: 'playa/:Playa', 
    component: PlayaComponent, 
    canActivate: [guardLoginGuard] 
  }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
