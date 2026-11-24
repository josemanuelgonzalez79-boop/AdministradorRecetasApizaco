import { Component, HostListener, OnInit, inject, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule, NgOptimizedImage, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ComponentesModalComponent } from './core/services/components/componentes-modal/componentes-modal.component';
import { RecetasComponent } from './core/services/components/recetas-modal/recetas.component';
import { ProcesosDisolucionComponent } from './core/services/components/procesos-disolucion/procesos-disolucion.component';
import { AuthService } from './core/services/auth.service';
import { map, Observable } from 'rxjs';
import { UsuariosComponent } from './core/components/usuarios/usuarios.component';
import { PresentacionesComponent } from './core/services/components/presentaciones/presentaciones.component';
import { HerramientasComponent } from './core/services/components/herramientas/herramientas.component';
import { InicioDashboardComponent } from './core/components/inicio-dashboard/inicio-dashboard.component';
import { AnalisisHistoricoComponent } from './core/components/analisis-historico/analisis-historico.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    NgOptimizedImage,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    ToastModule,
    ComponentesModalComponent,
    RecetasComponent,
    ProcesosDisolucionComponent,
    UsuariosComponent,
    PresentacionesComponent,
    HerramientasComponent,
    InicioDashboardComponent,
    AnalisisHistoricoComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [MessageService]
})
export class AppComponent implements OnInit {
  visibleMenu: string | null = null;
  mostrarModal = false;
  mostrarRecetas = false;
  mostrarProcesos = false;
  mostrarAnalisis = false;
  mostrarUsuarios = false;
  mostrarPresentaciones = false;
  mostrarHerramientas = false;
  closeTimer: any = null;
  temaOscuro = false;

  private auth = inject(AuthService);
  isAuth$: Observable<boolean> = this.auth.isAuthenticated$;
  rol$ = this.auth.role$;
  isAdmin$: Observable<boolean> = this.auth.role$.pipe(
    map(r => r === 'ADMINISTRADOR')
  );

  constructor(
    private router: Router,
    private messageService: MessageService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Tema claro por defecto, sin alteraciones en el servidor ni backend.
    this.temaOscuro = localStorage.getItem('icap-tema') === 'oscuro';
    this.document.documentElement.classList.toggle('icap-dark', this.temaOscuro);
  }

  alternarTema(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.temaOscuro = !this.temaOscuro;
    this.document.documentElement.classList.toggle('icap-dark', this.temaOscuro);
    localStorage.setItem('icap-tema', this.temaOscuro ? 'oscuro' : 'claro');
  }

  showSubmenu(menu: string): void {
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
    this.visibleMenu = menu;
  }

  hideSubmenu(menu: string): void {
    this.closeTimer = setTimeout(() => {
      if (this.visibleMenu === menu) this.visibleMenu = null;
    }, 180);
  }

  toggleSubmenu(menu: string): void {
    this.visibleMenu = this.visibleMenu === menu ? null : menu;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.menu')) this.visibleMenu = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.visibleMenu = null;
  }

  irInicio(): void {
    this.visibleMenu = null;
    this.cerrarModalComponentes();
  }

  navegar(ruta: string): void {
    this.visibleMenu = null;

    if (ruta === 'usuarios') {
      if (this.auth.getRoleSnapshot() !== 'ADMINISTRADOR') return;
      this.mostrarUsuarios = true;
      return;
    }
    if (ruta === 'componentes') { this.mostrarModal = true; return; }
    if (ruta === 'recetas') { this.mostrarRecetas = true; return; }
    if (ruta === 'disolucion') { this.mostrarProcesos = true; return; }
    if (ruta === 'analisis') { this.mostrarAnalisis = true; return; }
    if (ruta === 'presentaciones') { this.mostrarPresentaciones = true; return; }
    if (ruta === 'herramientas') { this.mostrarHerramientas = true; return; }

    this.router.navigate([`/${ruta}`]);
  }

  cerrarModalComponentes(): void {
    this.mostrarModal = false;
    this.mostrarRecetas = false;
    this.mostrarProcesos = false;
    this.mostrarAnalisis = false;
    this.mostrarUsuarios = false;
    this.mostrarPresentaciones = false;
    this.mostrarHerramientas = false;
  }

  abrirReportesDesdeAnalisis(): void {
    this.mostrarAnalisis = false;
    this.mostrarProcesos = true;
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  onImprimir(payload: any): void {
    const detalle = payload?.modo === 'ARBITRARIAS'
      ? `Arbitrarias — ID: ${payload?.producto ?? ''}`
      : `Aleatorias — ${payload?.etiquetasAProducir} etiqueta(s)`;
    this.messageService.add({
      severity: 'success',
      summary: 'Etiqueta generada',
      detail: detalle,
      life: 2500,
      key: 'top-right'
    });
  }
}
