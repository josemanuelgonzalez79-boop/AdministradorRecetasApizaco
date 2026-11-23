import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, Inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';            
import { ReporteService } from '../procesos.service';
import { MessageService } from 'primeng/api';
import { ReportePdfService } from '../../../services/reporte-pdf.service';
import { firstValueFrom } from 'rxjs';
import {
  ReportConcItem,
  ReportMain,
  ReportPosItem,
  ReportBarcodeItem
} from '../../../../interfaces/ReporteIndividual';

interface Proceso {
  fecha: Date;
  processId: number;
  prebatch: number;
  recipeId: string;
  name: string;
  tankName: string;
  sucroseAccum: number;
  fructoseAccum: number;
  waterAccum: number;
}

@Component({
  selector: 'app-procesos-disolucion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CalendarModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './procesos-disolucion.component.html',
  styleUrls: ['./procesos-disolucion.component.scss'],
  providers: [MessageService]
})
export class ProcesosDisolucionComponent implements OnInit, OnDestroy, OnChanges {

  public reporteService = inject(ReporteService);

  @Input() visible = false;
  @Output() cerrarModal = new EventEmitter<void>();

  procesos: Proceso[] = [];

  filteredProcesos: Proceso[] = [];       

  public fechaInicio!: Date;
  public fechaFin!: Date;

  // filtros texto
  recetaFilter = '';                    
  tankFilter  = '';                        
  
  constructor(
    private messageService: MessageService,
    private pdfSvc: ReportePdfService,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private doc: Document,
  ) {}

  ngOnInit(): void {
    this.ensureDefaultDates();
    if (this.visible) {
      this.lockScroll();
      this.datosReporte();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.lockScroll();
      this.ensureDefaultDates();
      this.datosReporte();
    }
  }

  ngOnDestroy(): void {
    this.unlockScroll();
  }

  private ensureDefaultDates(): void {
    if (!this.fechaFin) this.fechaFin = new Date();
    if (!this.fechaInicio) this.fechaInicio = new Date();
    
  }

  private parseFechaToDate(val: any): Date {
    if (val instanceof Date) return val;
    if (val === null || val === undefined) return new Date();
    const s = String(val);
    const iso = s.includes('T') ? s : s.replace(' ', 'T');
    const d = new Date(iso);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  private toSqlDate(d: Date | string | null | undefined, endOfDay = false): string {
    if (d === null || d === undefined) return '';
    const parse = (val: Date | string): Date => {
      if (val instanceof Date) return new Date(val);
      const t = String(val).trim();
      const m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/.exec(t);
      if (m) {
        const dd = +m[1], MM = +m[2] - 1, yyyy = +m[3] < 100 ? 2000 + +m[3] : +m[3];
        return new Date(yyyy, MM, dd);
      }
      return new Date(t);
    };

    const x = parse(d as any);
    if (isNaN(x.getTime())) return '';

    if (endOfDay) x.setHours(23, 59, 59, 999); else x.setHours(0, 0, 0, 0);

    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = x.getFullYear();
    const MM   = pad(x.getMonth() + 1);
    const dd   = pad(x.getDate());
    const HH   = pad(x.getHours());
    const mm   = pad(x.getMinutes());
    const ss   = pad(x.getSeconds());
    return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
  }
  
  buscarProcesos(): void {
    this.ensureDefaultDates();
    this.datosReporte();
  }

  onClose(): void {
    this.unlockScroll();
    this.cerrarModal.emit();
  }

  private isFiniteNumber(n: any): n is number {
    return typeof n === 'number' && Number.isFinite(n);
  }

  private async promptBrix(): Promise<number | null> {
    if (!isPlatformBrowser(this.platformId)) return null;

    const raw = window.prompt('El Brix viene en 0. Capture el valor de Brix:', '');
    if (raw === null) return null;
    const v = Number(String(raw).replace(',', '.'));
    if (!this.isFiniteNumber(v) || v <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Valor inválido',
        detail: 'Capture un Brix numérico mayor que 0.'
      });
      return null;
    }
    return v;
  }

  // Tabla -> doble clic reporte 

  async openIndividual(row: Proceso) {
    const pid = Number(row.processId);
    try {
      const mainResp = await firstValueFrom(this.reporteService.reporteMain(String(pid)));
      const m = this.mapMain((mainResp as any)?.data);

      if (!m) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sin datos',
          detail: 'No se encontró información del proceso.'
        });
        return;
      }

      if ((m.brix ?? 0) === 0) {
        const nuevoBrix = await this.promptBrix();
        if (nuevoBrix == null) {
          this.messageService.add({
            severity: 'info',
            summary: 'Cancelado',
            detail: 'No se generó el reporte.'
          });
          return;
        }

        try {
          await firstValueFrom(this.reporteService.actualizaBrix(nuevoBrix, pid));
          this.messageService.add({
            severity: 'success',
            summary: 'Brix fijado',
            detail: `Se guardó Brix = ${nuevoBrix}.`
          });
        } catch (e: any) {
          const msg = e?.error?.message || e?.message || '';
          if (String(msg).toLowerCase().includes('brix') && String(msg).toLowerCase().includes('fij')) {
            this.messageService.add({
              severity: 'info',
              summary: 'Brix ya fijado',
              detail: 'Se usará el valor almacenado.'
            });
          } else {
            console.error('Error al fijar Brix:', e);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo guardar el Brix.'
            });
            return;
          }
        }
      }

      // Segundo round: recargar main y traer conc, pos y barcodes
      const [main2, conc2, pos2, bar2] = await Promise.all([
        firstValueFrom(this.reporteService.reporteMain(String(pid))),
        firstValueFrom(this.reporteService.reporteConc(String(pid))),
        firstValueFrom(this.reporteService.reportePos(String(pid))),
        firstValueFrom(this.reporteService.reporteBarcodes(String(pid)))
      ]);

      const m2           = this.mapMain((main2 as any)?.data);
      const concItems    = this.mapConc((conc2 as any)?.data);
      const posItems     = this.mapPos((pos2 as any)?.data);
      const barcodeItems = this.mapBarcodes((bar2 as any)?.data);

      if (!m2) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sin datos',
          detail: 'No se encontró información del proceso (tras fijar Brix).'
        });
        return;
      }

      this.pdfSvc.previewOneDetailed(m2, concItems, posItems, barcodeItems);

    } catch (err) {
      console.error('Error openIndividual:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar el reporte.'
      });
    }
  }


  private toDate(s: string): Date {
    const iso = s?.includes('T') ? s : s?.replace(' ', 'T');
    const d = new Date(iso || '');
    return isNaN(d.getTime()) ? new Date() : d;
  }
  private num(x: any): number { return Number(x ?? 0); }

  private mapMain(d: any): ReportMain | null {
    if (!d) return null;
    return {
      startTime: this.toDate(d.startTime ?? d.start_time ?? d.fecha ?? ''),
      finishTime: this.toDate(d.finishTime ?? d.finish_time ?? ''),
      processId: this.num(d.processId ?? d.process_id),
      prebatch:  this.num(d.prebatch),
      recipeId:  String(d.recipeId ?? d.recipe_id ?? ''),
      name:      String(d.name ?? ''),
      brix:      this.num(d.brix),
      density:   this.num(d.density),
      recipeType:String(d.recipeType ?? d.recipe_type ?? ''),
      units:     this.num(d.units),
      userName:  String(d.userName ?? d.user_name ?? ''),
      tankName:  String(d.tankName ?? d.tank_name ?? ''),

      massSetpoint:    this.num(d.massSetPoint ?? d.mass_setpoint),
      massAccum:       this.num(d.massAccum ?? d.mass_accum),
      volumeSetpoint:  this.num(d.volumeSetPoint ?? d.volume_setpoint),
      volumeAccum:     this.num(d.volumeAccum ?? d.volume_accum),
      sucroseSetpoint: this.num(d.sucroseSetPoint ?? d.sucrose_setpoint),
      sucroseAccum:    this.num(d.sucroseAccum ?? d.sucrose_accum),
      fructoseSetpoint:this.num(d.fructoseSetPoint ?? d.fructose_setpoint),
      fructoseAccum:   this.num(d.fructoseAccum ?? d.fructose_accum),
      waterSetpoint:   this.num(d.waterSetPoint ?? d.water_setpoint),
      waterAccum:      this.num(d.waterAccum ?? d.water_accum),
    };
  }

  private mapConc(d: any): ReportConcItem[] {
    if (!d) return [];
    const items: ReportConcItem[] = [];

    for (let i = 1; i <= 16; i++) {
      const nn = String(i).padStart(2, '0');

      const id   = d[`c${nn}_id`]   ?? d[`c${nn}Id`];
      const name = d[`c${nn}_name`] ?? d[`c${nn}Name`];
      const mass = d[`c${nn}_mass`] ?? d[`c${nn}Mass`];
      const pos  = d[`c${nn}_pos`]  ?? d[`c${nn}Pos`];

      const idStr = id != null ? String(id) : '';
      const nameStr = name != null ? String(name) : '';
      const massNum = Number(mass ?? 0);
      const posNum  = Number(pos ?? 0);

      if (idStr && idStr !== '-' && (nameStr || massNum || posNum)) {
        items.push({ id: idStr, name: nameStr, mass: massNum, pos: posNum });
      }
    }

    return items.sort((a, b) => a.pos - b.pos);
  }

  private mapPos(rows: any[]): ReportPosItem[] {
    const list = Array.isArray(rows) ? rows : [];
    return list
      .map(r => ({
        position: this.num(r.position ?? r.position),
        manual:   Boolean(r.manual),
        water:    this.num(r.water),
      }))
      .sort((a,b)=> a.position - b.position);
  }

  private mapBarcodes(rows: any[]): ReportBarcodeItem[] {
    const list = Array.isArray(rows) ? rows : [];
    return list.map(r => ({
      presentationId:        String(r.presentationId ?? r.presentation_id ?? ''),
      presentationBatch:     Number(r.presentationBatch ?? r.presentation_batch ?? 0),
      presentationExpiration:String(r.presentationExpiration ?? r.presentation_expiration ?? ''),
      presentationSerial:    Number(r.presentationSerial ?? r.presentation_serial ?? 0),
      componentRef:          String(r.componentRef ?? r.component_ref ?? ''),
      presentationName:      String(r.presentationName ?? r.presentation_name ?? ''),
      captures:              Number(r.captures ?? 0),
      units:                 Number(r.units ?? 0),
    }));
  }

  datosReporte(): void {
    const ini = this.toSqlDate(this.fechaInicio, false);
    const fin = this.toSqlDate(this.fechaFin, true);

    this.reporteService.datosReporte(ini, fin).subscribe({
      next: (response: any) => {
        const rows = Array.isArray(response?.data) ? response.data : [];
        this.procesos = rows.map((r: any) => ({
          fecha: this.parseFechaToDate(r?.fecha ?? r?.startTime ?? r?.start_time ?? ''),
          processId: Number(r?.processId ?? r?.process_id ?? 0),
          prebatch: Number(r?.prebatch ?? 0),
          recipeId: String(r?.recipeId ?? r?.recipe_id ?? ''),
          name: String(r?.name ?? ''),
          tankName: String(r?.tankName ?? r?.tank_name ?? ''),
          sucroseAccum: Number(r?.sucroseAccum ?? r?.sucrose_accum ?? 0),
          fructoseAccum: Number(r?.fructoseAccum ?? r?.fructose_accum ?? 0),
          waterAccum: Number(r?.waterAccum ?? r?.water_accum ?? 0),
        }));

        this.aplicarFiltros();
      },
      error: (err) => {
        console.error('Error datosReporte:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar Procesos de Disolución.',
        });
      }
    });
  }

  // filtra por folio / tanque sobre this.procesos (no sólo página actual)
  aplicarFiltros(): void {
    const receta = this.recetaFilter.trim().toLowerCase();
    const tank  = this.tankFilter.trim().toLowerCase();

    this.filteredProcesos = this.procesos.filter(p => {
      const folioMatch = receta ? String(p.name).toLowerCase().includes(receta) : true;
      const tankMatch  = tank  ? p.tankName.toLowerCase().includes(tank)         : true;
      return folioMatch && tankMatch;
    });
  }

  previewPdf(): void {
    if (!this.filteredProcesos.length) return;
    // Imprimime lo que realmente se ve (ya filtrado)
    this.pdfSvc.preview(this.filteredProcesos, this.fechaInicio, this.fechaFin);
  }

  private lockScroll()  {
    if (!isPlatformBrowser(this.platformId)) return;
    this.doc.body.style.overflow = 'hidden';
  }

  private unlockScroll(){
    if (!isPlatformBrowser(this.platformId)) return;
    this.doc.body.style.overflow = '';
  }
}
