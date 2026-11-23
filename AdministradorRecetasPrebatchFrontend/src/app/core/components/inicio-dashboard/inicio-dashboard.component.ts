import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReporteService } from '../../services/components/procesos.service';
import { AuthService } from '../../services/auth.service';

type Rango = '90d' | '12m';

interface ProcesoResumen {
  processId: number;
  fecha: Date;
  recipeId: string;
  name: string;
  tankName: string;
  waterAccum: number;
  sucroseAccum: number;
  fructoseAccum: number;
}

interface Ranking {
  nombre: string;
  total: number;
  porcentaje: number;
}

/** Inicio operativo alimentado exclusivamente por el endpoint existente reportData. */
@Component({
  selector: 'app-inicio-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio-dashboard.component.html',
  styleUrls: ['./inicio-dashboard.component.scss']
})
export class InicioDashboardComponent implements OnInit, OnDestroy {
  @Output() abrirModulo = new EventEmitter<string>();

  private readonly reportes = inject(ReporteService);
  private readonly auth = inject(AuthService);
  private consulta?: Subscription;

  rango: Rango = '12m';
  cargando = false;
  errorConsulta = false;
  actualizado: Date | null = null;
  procesos: ProcesoResumen[] = [];
  recetas: Ranking[] = [];
  tanques: Ranking[] = [];
  totalProcesos = 0;
  totalRecetas = 0;
  totalTanques = 0;
  aguaAcumulada = 0;
  conAgua = 0;

  get puedeAdministrarUsuarios(): boolean {
    return this.auth.getRoleSnapshot() === 'ADMINISTRADOR';
  }

  ngOnInit(): void {
    this.consultar();
  }

  ngOnDestroy(): void {
    this.consulta?.unsubscribe();
  }

  elegirRango(rango: Rango): void {
    if (this.rango === rango) return;
    this.rango = rango;
    this.consultar();
  }

  consultar(): void {
    this.consulta?.unsubscribe();
    this.cargando = true;
    this.errorConsulta = false;

    const ahora = new Date();
    const desde = new Date(ahora);
    if (this.rango === '90d') {
      desde.setDate(desde.getDate() - 89);
    } else {
      desde.setFullYear(desde.getFullYear() - 1);
    }
    desde.setHours(0, 0, 0, 0);

    this.consulta = this.reportes.datosReporte(
      this.fechaSql(desde, false),
      this.fechaSql(ahora, true)
    ).subscribe({
      next: (respuesta: any) => {
        // El backend puede devolver una respuesta META_ERROR con HTTP 200.
        if (!Array.isArray(respuesta?.data)) {
          this.limpiar();
          this.errorConsulta = true;
        } else {
          this.procesar(respuesta.data);
          this.actualizado = new Date();
        }
        this.cargando = false;
      },
      error: () => {
        this.limpiar();
        this.errorConsulta = true;
        this.cargando = false;
      }
    });
  }

  private fechaSql(fecha: Date, fin: boolean): string {
    const d = new Date(fecha);
    d.setHours(fin ? 23 : 0, fin ? 59 : 0, fin ? 59 : 0, 0);
    const dos = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())} ` +
      `${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}`;
  }

  private numero(valor: unknown): number {
    const n = Number(valor ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  private procesar(filas: any[]): void {
    const porFolio = new Map<number, ProcesoResumen>();
    for (const fila of filas) {
      const folio = this.numero(fila?.processId ?? fila?.process_id);
      const valorFecha = String(fila?.fecha ?? fila?.startTime ?? fila?.start_time ?? '');
      const fecha = new Date(valorFecha.replace(' ', 'T'));
      if (folio <= 0 || Number.isNaN(fecha.getTime())) continue;
      if (porFolio.has(folio)) continue;
      porFolio.set(folio, {
        processId: folio,
        fecha,
        recipeId: String(fila?.recipeId ?? fila?.recipe_id ?? '').trim(),
        name: String(fila?.name ?? '').trim(),
        tankName: String(fila?.tankName ?? fila?.tank_name ?? '').trim() || 'Sin identificar',
        waterAccum: this.numero(fila?.waterAccum ?? fila?.water_accum),
        sucroseAccum: this.numero(fila?.sucroseAccum ?? fila?.sucrose_accum),
        fructoseAccum: this.numero(fila?.fructoseAccum ?? fila?.fructose_accum)
      });
    }

    const datos = Array.from(porFolio.values())
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
    this.procesos = datos;
    this.totalProcesos = datos.length;
    this.aguaAcumulada = datos.reduce((s, p) => s + p.waterAccum, 0);
    this.conAgua = datos.filter(p => p.waterAccum > 0).length;

    const receta = new Map<string, number>();
    const tanque = new Map<string, number>();
    for (const p of datos) {
      const nombreReceta = p.name || p.recipeId || 'Sin identificar';
      const claveReceta = `${p.recipeId}¦${nombreReceta}`;
      receta.set(claveReceta, (receta.get(claveReceta) ?? 0) + 1);
      tanque.set(p.tankName, (tanque.get(p.tankName) ?? 0) + 1);
    }
    this.totalRecetas = receta.size;
    this.totalTanques = tanque.size;
    this.recetas = this.ranking(
      Array.from(receta.entries()).map(([clave, total]) => ({
        nombre: clave.split('¦').slice(1).join('¦'), total
      }))
    );
    this.tanques = this.ranking(Array.from(tanque.entries()).map(([nombre, total]) => ({ nombre, total })));
  }

  private ranking(entradas: Array<{ nombre: string; total: number }>): Ranking[] {
    const mayores = entradas.sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre)).slice(0, 5);
    const maximo = mayores[0]?.total ?? 0;
    return mayores.map(x => ({
      ...x,
      porcentaje: maximo ? (x.total / maximo) * 100 : 0
    }));
  }

  private limpiar(): void {
    this.procesos = [];
    this.recetas = [];
    this.tanques = [];
    this.totalProcesos = 0;
    this.totalRecetas = 0;
    this.totalTanques = 0;
    this.aguaAcumulada = 0;
    this.conAgua = 0;
  }
}
