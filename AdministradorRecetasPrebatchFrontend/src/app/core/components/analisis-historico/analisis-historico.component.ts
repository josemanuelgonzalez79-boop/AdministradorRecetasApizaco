import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ReporteService } from '../../services/components/procesos.service';
import { enviroment } from '../../../../enviroments/enviroment';

type Rango = '90d' | '12m' | 'todo';
type ClaveMetrica = 'mass' | 'water' | 'volume' | 'sucrose' | 'fructose';
type ClaveOrden = 'startTime' | 'processId' | 'tankName' | 'massAccum' | 'waterAccum' | 'variacionMasa';

interface ProcesoDetalle {
  processId: number;
  startTime: string;
  finishTime: string;
  prebatch: number;
  recipeId: string;
  name: string;
  tankName: string;
  units: number | null;
  massSetpoint: number | null;
  massAccum: number | null;
  volumeSetpoint: number | null;
  volumeAccum: number | null;
  waterSetpoint: number | null;
  waterAccum: number | null;
  sucroseSetpoint: number | null;
  sucroseAccum: number | null;
  fructoseSetpoint: number | null;
  fructoseAccum: number | null;
}

interface RecetaOpcion { id: string; nombre: string; total: number; }
interface MetricaDef {
  id: ClaveMetrica;
  nombre: string;
  unidad: string;
  meta: keyof ProcesoDetalle;
  real: keyof ProcesoDetalle;
}
interface Comparativo {
  metrica: MetricaDef;
  meta: number | null;
  real: number | null;
  diferencia: number | null;
  muestra: number;
}
interface TanqueResumen {
  nombre: string;
  procesos: number;
  aguaPromedio: number | null;
  masaPromedio: number | null;
  variacionMasa: number | null;
  porcentaje: number;
}

@Component({
  selector: 'app-analisis-historico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analisis-historico.component.html',
  styleUrls: ['./analisis-historico.component.scss']
})
export class AnalisisHistoricoComponent implements OnInit, OnDestroy {
  @Output() cerrarModulo = new EventEmitter<void>();
  @Output() abrirModulo = new EventEmitter<string>();

  private readonly reportes = inject(ReporteService);
  private readonly http = inject(HttpClient);
  private catalogoSub?: Subscription;
  private detalleSub?: Subscription;

  readonly metricas: MetricaDef[] = [
    { id: 'mass', nombre: 'Masa', unidad: 'kg', meta: 'massSetpoint', real: 'massAccum' },
    { id: 'water', nombre: 'Agua', unidad: 'kg', meta: 'waterSetpoint', real: 'waterAccum' },
    { id: 'volume', nombre: 'Volumen', unidad: 'L', meta: 'volumeSetpoint', real: 'volumeAccum' },
    { id: 'fructose', nombre: 'Fructosa', unidad: 'kg', meta: 'fructoseSetpoint', real: 'fructoseAccum' },
    { id: 'sucrose', nombre: 'Sacarosa', unidad: 'kg', meta: 'sucroseSetpoint', real: 'sucroseAccum' }
  ];

  rango: Rango = '12m';
  recetaSeleccionada = '';
  tanqueSeleccionado = '';
  metricaSeleccionada: ClaveMetrica = 'mass';
  catalogo: RecetaOpcion[] = [];
  tanques: string[] = [];
  procesos: ProcesoDetalle[] = [];
  filtrados: ProcesoDetalle[] = [];
  comparativos: Comparativo[] = [];
  porTanque: TanqueResumen[] = [];
  cargandoCatalogo = false;
  cargandoDetalle = false;
  errorCatalogo = '';
  errorDetalle = '';
  resultadoLimitado = false;
  ultimoRango = '';

  promedioMasa: number | null = null;
  promedioAgua: number | null = null;
  variacionMediaMasa: number | null = null;
  intensidadAgua: number | null = null;
  registrosConMetaMasa = 0;

  puntosMeta = '';
  puntosReales = '';
  graficoMax = 1;
  graficoCantidad = 0;
  graficoFechaInicio = '';
  graficoFechaFin = '';
  readonly nivelesGrafico = [1, 0.75, 0.5, 0.25, 0];

  pagina = 1;
  readonly porPagina = 12;
  campoOrden: ClaveOrden = 'startTime';
  direccionOrden: 1 | -1 = -1;

  ngOnInit(): void { this.consultarCatalogo(); }

  ngOnDestroy(): void {
    this.catalogoSub?.unsubscribe();
    this.detalleSub?.unsubscribe();
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void { this.cerrarModulo.emit(); }

  cerrar(): void { this.cerrarModulo.emit(); }

  verProcesos(): void {
    this.abrirModulo.emit('disolucion');
  }

  cambiarRango(rango: Rango): void {
    if (this.rango === rango) return;
    this.rango = rango;
    this.consultarCatalogo();
  }

  get opcionActual(): RecetaOpcion | undefined {
    return this.catalogo.find(r => r.id === this.recetaSeleccionada);
  }

  get metricaActual(): MetricaDef {
    return this.metricas.find(m => m.id === this.metricaSeleccionada) ?? this.metricas[0];
  }

  get cargando(): boolean { return this.cargandoCatalogo || this.cargandoDetalle; }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.filtrados.length / this.porPagina));
  }

  get filasTabla(): ProcesoDetalle[] {
    const campo = this.campoOrden;
    const signo = this.direccionOrden;
    const ordenados = [...this.filtrados].sort((a, b) => {
      const av = campo === 'variacionMasa' ? this.variacion(a.massSetpoint, a.massAccum) : a[campo];
      const bv = campo === 'variacionMasa' ? this.variacion(b.massSetpoint, b.massAccum) : b[campo];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv : String(av).localeCompare(String(bv), 'es', { numeric: true });
      return cmp * signo;
    });
    return ordenados.slice((this.pagina - 1) * this.porPagina, this.pagina * this.porPagina);
  }

  ordenar(campo: ClaveOrden): void {
    if (this.campoOrden === campo) this.direccionOrden = this.direccionOrden === 1 ? -1 : 1;
    else { this.campoOrden = campo; this.direccionOrden = campo === 'tankName' ? 1 : -1; }
    this.pagina = 1;
  }

  seleccionarMetrica(id: ClaveMetrica): void {
    this.metricaSeleccionada = id;
    this.calcularGrafica();
  }

  seleccionarTanque(): void {
    this.pagina = 1;
    this.recalcular();
  }

  consultarCatalogo(): void {
    this.catalogoSub?.unsubscribe();
    this.detalleSub?.unsubscribe();
    this.cargandoCatalogo = true;
    this.cargandoDetalle = false;
    this.errorCatalogo = '';
    this.errorDetalle = '';
    this.resultadoLimitado = false;
    this.procesos = [];
    this.filtrados = [];
    this.comparativos = [];
    this.porTanque = [];

    const periodo = this.fechasRango();
    this.ultimoRango = `${periodo.desde} a ${periodo.hasta}`;
    const inicio = `${periodo.desde} 00:00:00`;
    const fin = `${periodo.hasta} 23:59:59`;

    this.catalogoSub = this.reportes.datosReporte(inicio, fin).subscribe({
      next: (respuesta: any) => {
        this.cargandoCatalogo = false;
        if (!Array.isArray(respuesta?.data)) {
          this.catalogo = [];
          this.errorCatalogo = 'No fue posible obtener el catálogo de recetas del período.';
          return;
        }
        const mapa = new Map<string, { nombre: string; folios: Set<number> }>();
        for (const item of respuesta.data as any[]) {
          const id = String(item?.recipeId ?? item?.recipe_id ?? '').trim();
          const folio = Number(item?.processId ?? item?.process_id);
          if (!id || !Number.isFinite(folio) || folio <= 0) continue;
          const nombre = String(item?.name ?? id).trim() || id;
          const anterior = mapa.get(id) ?? { nombre, folios: new Set<number>() };
          anterior.folios.add(folio);
          mapa.set(id, anterior);
        }
        this.catalogo = Array.from(mapa.entries())
          .map(([id, value]) => ({ id, nombre: value.nombre, total: value.folios.size }))
          .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, 'es'));
        if (!this.catalogo.some(r => r.id === this.recetaSeleccionada)) {
          this.recetaSeleccionada = this.catalogo[0]?.id ?? '';
        }
        this.tanqueSeleccionado = '';
        if (this.recetaSeleccionada) this.consultarDetalle();
      },
      error: () => {
        this.cargandoCatalogo = false;
        this.catalogo = [];
        this.errorCatalogo = 'No se pudo consultar el historial. Revisa tu conexión con el servidor.';
      }
    });
  }

  consultarDetalle(): void {
    this.detalleSub?.unsubscribe();
    this.errorDetalle = '';
    this.cargandoDetalle = true;
    this.resultadoLimitado = false;
    this.procesos = [];
    this.filtrados = [];
    this.tanques = [];
    this.tanqueSeleccionado = '';
    this.recalcular();
    if (!this.recetaSeleccionada) {
      this.cargandoDetalle = false;
      return;
    }
    const periodo = this.fechasRango();
    const url = `${enviroment.apiUrl}/api/v1/recetPrebatch/reportAnalysis`;
    this.detalleSub = this.http.post<{ data: any[]; limited: boolean; maxRows: number }>(url, {
      desde: periodo.desde,
      hasta: periodo.hasta,
      recipeId: this.recetaSeleccionada
    }).subscribe({
      next: (respuesta) => {
        this.cargandoDetalle = false;
        if (!Array.isArray(respuesta?.data)) {
          this.errorDetalle = 'El servidor no devolvió información válida del análisis.';
          return;
        }
        const unicos = new Map<number, ProcesoDetalle>();
        for (const item of respuesta.data) {
          const procesado = this.mapearProceso(item);
          if (procesado && !unicos.has(procesado.processId)) {
            unicos.set(procesado.processId, procesado);
          }
        }
        this.procesos = [...unicos.values()]
          .sort((a, b) => b.startTime.localeCompare(a.startTime) || b.processId - a.processId);
        this.tanques = [...new Set(this.procesos.map(p => p.tankName))]
          .sort((a, b) => a.localeCompare(b, 'es'));
        this.resultadoLimitado = Boolean(respuesta.limited);
        this.recalcular();
      },
      error: () => {
        this.cargandoDetalle = false;
        this.errorDetalle = 'Error al consultar los detalles. Comprueba que el backend actualizado esté ejecutándose.';
      }
    });
  }

  private mapearProceso(r: any): ProcesoDetalle | null {
    const processId = Number(r?.processId);
    if (!Number.isInteger(processId) || processId <= 0 || !r?.startTime) return null;
    const num = (v: unknown): number | null => {
      if (v == null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    return {
      processId,
      startTime: String(r.startTime).replace(' ', 'T'),
      finishTime: String(r.finishTime ?? '').replace(' ', 'T'),
      prebatch: Number(r.prebatch ?? 0),
      recipeId: String(r.recipeId ?? ''),
      name: String(r.name ?? ''),
      tankName: String(r.tankName ?? '').trim() || 'Sin identificar',
      units: num(r.units),
      massSetpoint: num(r.massSetpoint),
      massAccum: num(r.massAccum),
      volumeSetpoint: num(r.volumeSetpoint),
      volumeAccum: num(r.volumeAccum),
      waterSetpoint: num(r.waterSetpoint),
      waterAccum: num(r.waterAccum),
      sucroseSetpoint: num(r.sucroseSetpoint),
      sucroseAccum: num(r.sucroseAccum),
      fructoseSetpoint: num(r.fructoseSetpoint),
      fructoseAccum: num(r.fructoseAccum)
    };
  }

  private recalcular(): void {
    this.filtrados = this.tanqueSeleccionado
      ? this.procesos.filter(p => p.tankName === this.tanqueSeleccionado)
      : [...this.procesos];
    this.pagina = 1;
    const promedio = (valores: Array<number | null>): number | null => {
      const validos = valores.filter((v): v is number => v != null && Number.isFinite(v));
      return validos.length ? validos.reduce((a, b) => a + b, 0) / validos.length : null;
    };
    this.promedioMasa = promedio(this.filtrados.map(x => x.massAccum));
    this.promedioAgua = promedio(this.filtrados.map(x => x.waterAccum));
    const difMasa = this.filtrados.map(x => this.variacion(x.massSetpoint, x.massAccum));
    this.registrosConMetaMasa = difMasa.filter(v => v != null).length;
    this.variacionMediaMasa = promedio(difMasa);
    const conAmbos = this.filtrados.filter(x => x.massAccum != null && x.massAccum > 0 && x.waterAccum != null);
    const sumaMasa = conAmbos.reduce((s, x) => s + (x.massAccum ?? 0), 0);
    const sumaAgua = conAmbos.reduce((s, x) => s + (x.waterAccum ?? 0), 0);
    this.intensidadAgua = sumaMasa > 0 ? (sumaAgua / sumaMasa) * 1000 : null;

    this.comparativos = this.metricas.map(metrica => {
      const parejas = this.filtrados.map(x => ({
        meta: this.valor(x, metrica.meta), real: this.valor(x, metrica.real)
      })).filter(x => x.meta != null && x.real != null);
      return {
        metrica,
        meta: promedio(parejas.map(x => x.meta)),
        real: promedio(parejas.map(x => x.real)),
        diferencia: promedio(parejas.map(x => this.variacion(x.meta, x.real))),
        muestra: parejas.length
      };
    });

    const porTanque = new Map<string, ProcesoDetalle[]>();
    for (const p of this.filtrados) {
      const lista = porTanque.get(p.tankName) ?? [];
      lista.push(p);
      porTanque.set(p.tankName, lista);
    }
    const max = Math.max(1, ...[...porTanque.values()].map(x => x.length));
    this.porTanque = [...porTanque.entries()].map(([nombre, datos]) => ({
      nombre,
      procesos: datos.length,
      aguaPromedio: promedio(datos.map(p => p.waterAccum)),
      masaPromedio: promedio(datos.map(p => p.massAccum)),
      variacionMasa: promedio(datos.map(p => this.variacion(p.massSetpoint, p.massAccum))),
      porcentaje: datos.length / max * 100
    })).sort((a, b) => b.procesos - a.procesos || a.nombre.localeCompare(b.nombre, 'es'));

    this.calcularGrafica();
  }

  private valor(p: ProcesoDetalle, campo: keyof ProcesoDetalle): number | null {
    const valor = p[campo];
    return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
  }

  variacion(meta: number | null, real: number | null): number | null {
    // Una meta igual a 0 no permite calcular un porcentaje relativo válido.
    return meta != null && real != null && meta > 0 ? ((real - meta) / meta) * 100 : null;
  }

  variacionMasa(p: ProcesoDetalle): number | null { return this.variacion(p.massSetpoint, p.massAccum); }

  private calcularGrafica(): void {
    const m = this.metricaActual;
    const cronologico = [...this.filtrados].sort((a, b) => a.startTime.localeCompare(b.startTime));
    // Mantener legible el eje X cuando existen cientos de preparaciones.
    const maxPuntos = 30;
    const muestra = cronologico.length <= maxPuntos ? cronologico :
      Array.from({ length: maxPuntos }, (_, i) => cronologico[Math.round(i * (cronologico.length - 1) / (maxPuntos - 1))]);
    const datos = muestra.map(p => ({
      fecha: p.startTime,
      meta: this.valor(p, m.meta),
      real: this.valor(p, m.real)
    }));
    const valores = datos.flatMap(x => [x.meta, x.real]).filter((v): v is number => v != null && v >= 0);
    this.graficoMax = Math.max(1, ...valores) * 1.08;
    const punto = (v: number, i: number): string => {
      const x = datos.length <= 1 ? 450 : 44 + 816 * i / (datos.length - 1);
      const y = 229 - Math.max(0, v) / this.graficoMax * 193;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    };
    this.puntosMeta = datos.map((d, i) => d.meta == null ? null : punto(d.meta, i))
      .filter((x): x is string => x != null).join(' ');
    this.puntosReales = datos.map((d, i) => d.real == null ? null : punto(d.real, i))
      .filter((x): x is string => x != null).join(' ');
    this.graficoCantidad = datos.length;
    this.graficoFechaInicio = datos[0]?.fecha ?? '';
    this.graficoFechaFin = datos[datos.length - 1]?.fecha ?? '';
  }

  textoNumero(valor: number | null, decimales = 2): string {
    return valor == null ? '—' : new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: decimales, maximumFractionDigits: decimales
    }).format(valor);
  }

  textoVariacion(valor: number | null): string {
    return valor == null ? '—' : `${valor > 0 ? '+' : ''}${this.textoNumero(valor, 1)} %`;
  }

  private fechasRango(): { desde: string; hasta: string } {
    const hoy = new Date();
    const desde = new Date(hoy);
    if (this.rango === '90d') desde.setDate(desde.getDate() - 89);
    else if (this.rango === '12m') desde.setFullYear(desde.getFullYear() - 1);
    else desde.setFullYear(2000, 0, 1);
    const fecha = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { desde: fecha(desde), hasta: fecha(hoy) };
  }

  cambiarPagina(delta: number): void {
    this.pagina = Math.max(1, Math.min(this.totalPaginas, this.pagina + delta));
  }

  exportarCsv(): void {
    if (!this.filtrados.length) return;
    const cabecera = ['Folio','Fecha','Receta','Tanque','Masa meta (kg)','Masa reportada (kg)',
      'Diferencia masa (%)','Agua meta (kg)','Agua reportada (kg)','Volumen meta (L)',
      'Volumen reportado (L)','Sacarosa meta (kg)','Sacarosa reportada (kg)',
      'Fructosa meta (kg)','Fructosa reportada (kg)'];
    const celda = (x: unknown): string => {
      if (x == null) return '';
      // Evitar que Excel interprete textos provenientes de la BD como formulas.
      const bruto = String(x);
      const seguro = typeof x === 'string' && /^[=+@\-\t\r]/.test(bruto) ? `\'${bruto}` : bruto;
      return `"${seguro.replace(/"/g, '""')}"`;
    };
    const lineas = this.filtrados.map(p => [p.processId, p.startTime, p.recipeId, p.tankName,
      p.massSetpoint, p.massAccum, this.variacionMasa(p), p.waterSetpoint, p.waterAccum,
      p.volumeSetpoint, p.volumeAccum, p.sucroseSetpoint, p.sucroseAccum,
      p.fructoseSetpoint, p.fructoseAccum].map(celda).join(';'));
    const csv = '\ufeff' + [cabecera.map(celda).join(';'), ...lineas].join('\r\n');
    const enlace = document.createElement('a');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    enlace.href = url;
    enlace.download = `analisis-receta-${this.recetaSeleccionada.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }
}
