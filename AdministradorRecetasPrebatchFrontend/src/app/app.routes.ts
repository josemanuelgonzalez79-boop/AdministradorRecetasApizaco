// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './core/components/login/login.component';
import { loginRedirectGuard } from './core/guards/login-redirect.guard';

import { ProcesosDisolucionComponent } from './core/services/components/procesos-disolucion/procesos-disolucion.component';
import { ComponentesModalComponent } from './core/services/components/componentes-modal/componentes-modal.component';
import { RecetasComponent } from './core/services/components/recetas-modal/recetas.component';
import { PresentacionesComponent } from './core/services/components/presentaciones/presentaciones.component';


export const routes: Routes = [

  { path: 'login', component: LoginComponent, canActivate: [loginRedirectGuard] },
  { path: '', canActivate: [authGuard], component: ProcesosDisolucionComponent },
  { path: '', canActivate: [authGuard], component: ComponentesModalComponent },
  { path: '', canActivate: [authGuard], component: RecetasComponent },
  { path: '', canActivate: [authGuard], component: PresentacionesComponent },
  { path: 'login', loadComponent: () => import('././core/components/login/login.component').then(m => m.LoginComponent), canActivate: [loginRedirectGuard] },
  { path: '',     loadComponent: () => import('./../app/app.component').then(m => m.AppComponent), canActivate: [authGuard] },

  { path: '**', redirectTo: '' }
];