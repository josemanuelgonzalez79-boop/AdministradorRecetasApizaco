import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { HerramientasService } from '../herramientas.service';
import { MessageService } from 'primeng/api';
import { GuardadoEtiquetas } from '../../../../interfaces/GuardadoEtiquetas';

type Producto = {
  value: string;
  label: string;
  id: string;
  nombre: string;
  referencia: string;
};

type OpcionProducto = { presentation_id: string; presentation: string };

@Component({
  selector: 'app-herramientas',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    DialogModule, DropdownModule, InputTextModule, InputNumberModule,
    CalendarModule, CheckboxModule, ButtonModule, DividerModule
  ],
  templateUrl: './herramientas.component.html',
  styleUrls: ['./herramientas.component.scss']
})
export class HerramientasComponent implements OnInit {

  @Input()  visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() imprimirPayload = new EventEmitter<any>();

  private herramientasService = inject(HerramientasService);

  public listaProductos: OpcionProducto[] = [];
  public productoSeleccionado: string | null = null;
  public id: string = '';
  public nombrePresentacion: string = '';
  public referenciaPresentacion: string = '';
  public unidadesPresentacion: number = 0;
  public lote: string | null = null;
  public consecutivo: string | null = null;
  public caducidad: Date | null = null;
  public hoy: Date = new Date();

  // Zebra destino: RAW 9100 por IP 
  private printerName: string | undefined = undefined;
  private printerIp: string | undefined = '192.168.5.11';

  private brotherPrinterName: string = 'Brother QL-800';

  // Tamaño etiqueta (4"x2") 
  private zplDpi: 203 | 300 = 203;
  private labelWidthMm  = 101.6;
  private labelHeightMm = 50;

  // Estado maestro
  modo: 'arbitrarias' | 'aleatorias' = 'aleatorias';
  arbChecked = false;
  aleChecked = true;

  //control del calendario 
  calendarOpen = false;
  isTouchUI = false;

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.syncChecksFromModo();
    this.comboPresentaciones();
    this.hoy.setHours(0, 0, 0, 0);

    //detecta si es dispositivo táctil para activar touchUI 
    if (typeof window !== 'undefined') {
      this.isTouchUI =
        window.matchMedia?.('(pointer: coarse)')?.matches ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }
  }

  // NUEVO: handlers para abrir/cerrar calendario
  onCalendarShow(): void { this.calendarOpen = true; }
  onCalendarHide(): void { this.calendarOpen = false; }

  private syncChecksFromModo(): void {
    this.arbChecked = this.modo === 'arbitrarias';
    this.aleChecked = this.modo === 'aleatorias';
  }

  onArbChange(val: boolean): void {
    if (val) {
      this.modo = 'arbitrarias';
      this.arbChecked = true;
      this.aleChecked = false;
    } else {
      if (!this.aleChecked) { this.arbChecked = true; return; }
      this.modo = 'aleatorias';
      this.syncChecksFromModo();
    }
  }

  onAleChange(val: boolean): void {
    if (val) {
      this.modo = 'aleatorias';
      this.aleChecked = true;
      this.arbChecked = false;
    } else {
      if (!this.arbChecked) { this.aleChecked = true; return; }
      this.modo = 'arbitrarias';
      this.syncChecksFromModo();
    }
  }

  comboPresentaciones(): void {
    this.herramientasService.obtenerPresentaciones().subscribe({
      next: (response: any) => {
        this.listaProductos = response.data;
      }
    });
  }

  limpiar(): void {
    this.id = '';
    this.nombrePresentacion = '';
    this.referenciaPresentacion = '';
    this.unidadesPresentacion = 0;
  }

  get enableArbitrarias() { return this.modo === 'arbitrarias'; }
  get enableAleatorias()  { return this.modo === 'aleatorias';  }
  get arbitrarias()       { return this.modo === 'arbitrarias'; }
  get aleatorias()        { return this.modo === 'aleatorias';  }

  identificador = '';
  nombre = '';
  referencia = '';
  unidades = 1;
  etiquetasAProducir = 1;

  onHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  propiedadesEtiquetas(): void {
    this.herramientasService.propiedadesEtiquetas(this.id).subscribe({
      next: (response: any) => {
        this.nombrePresentacion = response.data.presentation_name;
        this.referenciaPresentacion = response.data.recipe_reference;
        this.unidadesPresentacion = response.data.units;
      }
    });
  }

  onProductoSeleccionado(event: any): void {
    const valor = event?.value ?? null;
    this.productoSeleccionado = valor;
    this.id = valor;
    this.propiedadesEtiquetas();
  }

  private fmtYYYYMMDD8(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }
  

  private fechaValida(fecha: Date | null): boolean {
    if (!fecha) return false;
    const f = new Date(fecha);
    f.setHours(0,0,0,0);
    return f.getTime() >= this.hoy.getTime();
  }

  private fitsInt32Str(s: string | null): boolean {
    if (s == null || s.trim() === '') return false;
    const n = Number(s.replace(/^0+/, '') || '0');
    return Number.isInteger(n) && n >= 0 && n <= 2147483647;
  }

  private buildPayloadArbitraria(): GuardadoEtiquetas | null {
    if (!this.id || !this.lote || !this.consecutivo || !this.caducidad) return null;

    if (!this.fitsInt32Str(this.lote) || !this.fitsInt32Str(this.consecutivo)) {
      this.messageService.add({ severity: 'error', summary: 'Fuera de rango', detail: 'Lote/Consecutivo exceden INTEGER.', life: 3000 });
      return null;
    }

    return {
      presentation_id: String(this.id),
      presentation_batch: Number(this.lote.replace(/^0+/, '') || '0'),
      presentation_expiration: this.fmtYYYYMMDD8(this.caducidad),
      presentation_serial: Number(this.consecutivo.replace(/^0+/, '') || '0'),
    };
  }

  private randomDigits(n: number): string {
    let s = '';
    for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
    return s;
  }

  private randomSixNoLeadingZero(): string {
    return String(Math.floor(Math.random() * 900000) + 100000);
  }

  private buildAleatoriaCodigoYPayload(): { codigo: string, payload: GuardadoEtiquetas } | null {
    if (!this.id) return null;

    const fijo1 = '240', fijo2 = '100000', fijo3 = '15', fijo4 = '900';
    const identificador = String(this.id).trim();

    const exp = new Date(this.hoy.getFullYear() + 1, this.hoy.getMonth(), this.hoy.getDate());
    const y = exp.getFullYear().toString();
    const m = String(exp.getMonth() + 1).padStart(2, '0');
    const d = String(exp.getDate()).padStart(2, '0');

    const rand6 = this.randomSixNoLeadingZero();
    const rand3 = this.randomDigits(3).padStart(3, '0');

    const codigo = `${fijo1}${identificador}${fijo2}${rand6}${fijo3}${y}${m}${d}${fijo4}${rand3}`;

    return {
      codigo,
      payload: {
        presentation_id: identificador,
        presentation_batch: Number(rand6),
        presentation_expiration: this.fmtYYYYMMDD8(exp),
        presentation_serial: Number(rand3),
      }
    };
  }

  get puedeImprimir(): boolean {
    if (!this.productoSeleccionado) return false;
    if (this.aleatorias) return (this.etiquetasAProducir ?? 0) >= 1;
    const lOK = (this.lote ?? '').toString().trim() !== '';
    const cOK = (this.consecutivo ?? '').toString().trim() !== '';
    const dOK = !!this.caducidad && this.fechaValida(this.caducidad);
    return lOK && cOK && dOK;
  }

  private buildCodigoBarras(): string {
    if (!this.id || !this.lote || !this.consecutivo || !this.caducidad) return '';

    const fijo1 = '240';
    const fijo2 = '10';
    const fijo3 = '15';
    const fijo4 = '00';
    const fijo5 = '90';

    const identificador  = String(this.id).trim();

    const lote10 = (String(this.lote).replace(/\D+/g, '')).padStart(10, '0');

    const consecutivoStr = String(this.consecutivo).replace(/\D+/g, '');

    const year = this.caducidad.getFullYear().toString();
    const day  = String(this.caducidad.getDate()).padStart(2, '0');

    return `${fijo1}${identificador}${fijo2}${lote10}${fijo3}${year}${fijo4}${day}${fijo5}${consecutivoStr}`;
  }

  // ----------------- ZPL helpers -----------------
  private mmToDots(mm: number, dpi: number) {
    return Math.round(mm * dpi / 25.4);
  }

  // ASCII seguro (sin acentos raros)
  private safeAscii(s?: string, max?: number) {
    if (!s) return '';
    const out = s.normalize('NFKD')
      .replace(/[\u2010-\u2015]/g, '-')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return max ? out.slice(0, max) : out;
  }
  

  // Layout seguro: quiet-zones fijas a ambos lados y módulo w=1
  private buildZplFull(code: string, ref?: string, name?: string): string {
    const dpi = this.zplDpi;
    const PW  = this.mmToDots(this.labelWidthMm,  dpi);   // 812 a 203 dpi(modelo de impresora zebra)
    const LL  = this.mmToDots(this.labelHeightMm, dpi);

    // Márgenes externos + canal de seguridad fijo por lado
    const BASE_MARGIN_MM = 7;     // margen visual
    const SAFETY_MM      = 10;    // quiet-zone mínima real por lado
    const TOP_MM         = 8;

    const baseMargin = this.mmToDots(BASE_MARGIN_MM, dpi);
    const safety     = this.mmToDots(SAFETY_MM, dpi);
    const YTop       = this.mmToDots(TOP_MM, dpi);

    // Región central permitida para el código
    const xSafeLeft  = baseMargin + safety;           // inicio región
    const xSafeRight = PW - (baseMargin + safety);    // fin región
    const regionW    = xSafeRight - xSafeLeft;        // ancho garantizado

    // Forzamos módulo pequeño para que quepa siempre con holgura
    const w     = 1;                 
    const ratio = 2;
    const barH  = this.mmToDots(22, dpi);

    // HRI y texto (centrados dentro de la región)
    const hri  = this.digitsOnly(this.safeAscii(code));
    const line = [this.safeAscii(ref), this.safeAscii(name)].filter(Boolean).join('  ');

    const HRI_FILL  = 0.95;
    const LINE_FILL = 0.90;
    const minW = this.mmToDots(2.4, dpi);
    const maxW = this.mmToDots(6.0, dpi);

    const hriW = Math.max(minW, Math.min(maxW, Math.floor((regionW * HRI_FILL) / Math.max(1, hri.length))));
    const hriH = Math.round(hriW * 1.6);

    const txtW = line ? Math.max(minW, Math.min(maxW, Math.floor((regionW * LINE_FILL) / Math.max(1, line.length)))) : 0;
    const txtH = line ? Math.round(txtW * 1.3) : 0;

    const GAP_HRI = this.mmToDots(5, dpi);
    const GAP_TXT = this.mmToDots(3.2, dpi);

    return [
      '^XA','^CI28',
      `^PW${PW}`, `^LL${LL}`,
      '^MD12','^PR2','^MMT','^LH0,0','^LS0',

      // BARRAS
      `^FO${xSafeLeft},${YTop}^BY${w},${ratio},${barH}^BCN,${barH},N,N,N`,
      `^FD${hri}^FS`,

      // HRI centrado en la REGIÓN
      `^FO${xSafeLeft},${YTop + barH + GAP_HRI}^A0N,${hriH},${hriW}^FB${regionW},1,0,C,0`,
      `^FD${hri}^FS`,

      ...(line ? [
        `^FO${xSafeLeft},${YTop + barH + GAP_HRI + hriH + GAP_TXT}^A0N,${txtH},${txtW}^FB${regionW},1,0,C,0`,
        `^FD${line}^FS`
      ] : []),

      '^XZ'
    ].join('\n');
  }

  // Solo dígitos 
  private digitsOnly(s: string) {
    return (s ?? '').replace(/\D+/g, '');
  }

  private async saveEtiqueta(p: GuardadoEtiquetas): Promise<void> {
    await lastValueFrom(this.herramientasService.guardaEtiquetas(p));
  }

  async imprimir(): Promise<void> {
    if (!this.puedeImprimir) return;

    // === ARBITRARIAS ===
    if (this.arbitrarias) {
      // 1) Validar duplicado
      const existe = await this.validarEtiquetaExistente();
      if (existe) return;

      // 2) Flujo normal
      const codigo = this.buildCodigoBarras();
      const payload = this.buildPayloadArbitraria();
      if (!codigo || !payload) return;

      try {
        await this.saveEtiqueta(payload);
      } catch {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la etiqueta.',
          life: 2500
        });
        return;
      }

      await lastValueFrom(
        this.herramientasService.printBrother({
          barcodes: [codigo],
          ref: this.referenciaPresentacion,
          name: this.nombrePresentacion,
          copies: 1,
          printerName: this.brotherPrinterName
        })
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Impreso',
        detail: 'Etiqueta enviada a Brother QL-800.',
        life: 2000
      });

      this.imprimirPayload.emit(this.payloadActual);
      this.onHide();
      return;
    }

    // === ALEATORIAS ===
    const n = Math.max(1, this.etiquetasAProducir | 0);
    const codes: string[] = [];
    const payloads: GuardadoEtiquetas[] = [];

    for (let i = 0; i < n; i++) {
      const built = this.buildAleatoriaCodigoYPayload();
      console.log('etiqueta aleatoria: ', built);
      if (!built) continue;
      payloads.push(built.payload);
      codes.push(built.codigo);
    }

    for (const p of payloads) {
      try {
        await this.saveEtiqueta(p);
      } catch {
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Una etiqueta no se pudo guardar y se omitió.',
          life: 2500
        });
      }
    }

    if (codes.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'No se generaron códigos válidos.',
        life: 2200
      });
      return;
    }

    await lastValueFrom(
      this.herramientasService.printBrother({
        barcodes: codes,
        ref: this.referenciaPresentacion,
        name: this.nombrePresentacion,
        copies: 1,
        printerName: this.brotherPrinterName
      })
    );

    this.messageService.add({
      severity: 'success',
      summary: 'Impresas',
      detail: `${codes.length} etiquetas enviadas a Brother QL-800.`,
      life: 2200
    });

    this.imprimirPayload.emit(this.payloadActual);
    this.onHide();
  }

  get payloadActual() {
    if (!this.productoSeleccionado) return null;

    if (this.aleatorias) {
      return {
        modo: 'ALEATORIAS',
        producto: this.productoSeleccionado,
        etiquetasAProducir: this.etiquetasAProducir,
        unidades: this.unidades
      };
    }
    return {
      modo: 'ARBITRARIAS',
      producto: this.productoSeleccionado,
      lote: this.lote,
      consecutivo: this.consecutivo,
      caducidad: this.caducidad
    };
  }

  cancelar(): void {
    this.productoSeleccionado = null;
    this.identificador = this.nombre = this.referencia = '';
    this.unidades = 1;
    this.etiquetasAProducir = 1;
    this.lote = this.consecutivo = null;
    this.caducidad = null;

    this.modo = 'aleatorias';
    this.syncChecksFromModo();

    this.onHide();
  }

  filterDigits(e: Event, field: 'lote' | 'consecutivo'): void {
    const input = e.target as HTMLInputElement;
    const digits = (input.value ?? '').replace(/\D+/g, '').slice(0, 10);
    if (input.value !== digits) input.value = digits;
    this[field] = digits;
  }

  onPasteDigits(e: ClipboardEvent, field: 'lote' | 'consecutivo'): void {
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    const paste = (e.clipboardData?.getData('text') ?? '').replace(/\D+/g, '');
    const selStart = input.selectionStart ?? input.value.length;
    const selEnd = input.selectionEnd ?? input.value.length;

    const before = input.value.slice(0, selStart);
    const after  = input.value.slice(selEnd);
    const merged = (before + paste + after).replace(/\D+/g, '').slice(0, 10);

    input.value = merged;
    this[field] = merged;
    input.dispatchEvent(new Event('input'));
  }

  setModo(which: 'arbitrarias' | 'aleatorias', checked: boolean) {
    if (checked) { this.modo = which; }
  }

  private get zplDPI() { return this.zplDpi; }

  private buildValidaPayload(): { presentation_id: string; presentation_batch: number; presentation_serial: number } | null {
    if (!this.id || !this.lote || !this.consecutivo) return null;

    if (!this.fitsInt32Str(this.lote) || !this.fitsInt32Str(this.consecutivo)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Fuera de rango',
        detail: 'Lote/Consecutivo exceden INTEGER.',
        life: 3000
      });
      return null;
    }

    return {
      presentation_id: String(this.id).trim(),
      presentation_batch: Number(String(this.lote).replace(/\D+/g, '').replace(/^0+/, '') || '0'),
      presentation_serial: Number(String(this.consecutivo).replace(/\D+/g, '').replace(/^0+/, '') || '0'),
    };
  }

  private async validarEtiquetaExistente(): Promise<boolean> {
    const payload = this.buildValidaPayload();
    if (!payload) return false;

    try {
      const resp = await lastValueFrom(this.herramientasService.validaExisteEtiqueta(payload));
      const existe = !!resp?.data; 
      if (existe) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Duplicado',
          detail: 'Ya existe un registro en el historial con estos datos. Es necesario cambiar el lote o el consecutivo.',
          life: 4500
        });
      }
      return existe;
    } catch (err) {
      return false;
    }
  }

}