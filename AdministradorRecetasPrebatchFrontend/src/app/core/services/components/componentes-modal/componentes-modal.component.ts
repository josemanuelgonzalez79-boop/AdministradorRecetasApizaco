import { Component, EventEmitter, Output, HostListener, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Componentes, ComponentsService } from '../../components.service';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { GuardaComponente } from '../../../../interfaces/GuardaComponente';
import { Observable } from 'rxjs';
import { concatMap, finalize } from 'rxjs/operators';
import { ApiResponseDTO } from '../../../../interfaces/ApiResponse';
import { AuthService } from '../../auth.service';

type Modo = 'prebatch1' | 'paragon' | '';
type OrigenPrebatch = 'tanque' | 'bayoneta' | '';
type OrigenParagon = 't01' | 't02' | 'b01' | 'ibc' | 'tn01' | '';
type ParagonOrigen = 't01' | 't02' | 'b01' | 'ibc' | 'tn01';

@Component({
  selector: 'app-componentes-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    ButtonModule
  ],
  templateUrl: './componentes-modal.component.html',
  styleUrls: ['./componentes-modal.component.scss'],
  providers: [DatePipe, ConfirmationService]
})
export class ComponentesModalComponent implements OnInit, OnDestroy {

  @Output() cerrarModal = new EventEmitter<void>();
  @ViewChild('componenteForm') componenteForm!: NgForm;

  private recetasService = inject(ComponentsService);
  private toast = inject(MessageService);

  constructor(
    private datePipe: DatePipe,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private auth: AuthService
  ) {}

  public componentes: { label: string, value: string }[] = [];

  public id: string = '';
  public componenteSeleccionado: string = '';

  public name: string = '';
  public recipeReference: string = '';
  public mass: number = 0;
  public tipo: number = 0; 
  public version: number = 0;

  public updateTimeFormateado: string = '';

  public modo: Modo = '';

  public idNuevoComponente: string = '';
  public nombreNuevoComponente: string = '';
  public referenciaNuevoComponente: string = '';
  public tipoNuevoComponente: string = '';
  public idValidaNoObsoleto: string = '';
  public idValidaObsoleto: string = '';

  public inventario: boolean = false;

  public banderaUltimoCambio: boolean = false;
  public banderaIdentificador: boolean = false;
  public banderaNombre: boolean = false;
  public banderaTipo: boolean = false;
  public banderaMasa: boolean = false;
  public banderaReferencia: boolean = false;

  public banderaGuardar: boolean = false;
  public banderaEliminar: boolean = false;

  public banderaPrebatch1: boolean = false;
  public banderaParagon: boolean = false;

  public banderaAgua: boolean = false;
  public banderaComentarios: boolean = false;
  public banderaTanque: boolean = false;
  public banderaBayoneta: boolean = false;

  public banderaRecircular: boolean = false;
  public banderaDisolucionDificil: boolean = false;
  public banderaCargaDirecta: boolean = false;

  public banderaAutomatica: boolean = false;
  public banderaAgitacionAutomatica: boolean = false;

  public banderaAguaParagon: boolean = false;
  public banderaComentariosParagon: boolean = false;

  public banderaAutomaticaParagon: boolean = false;
  public banderaAgitacionAutomaticaParagon: boolean = false;

  public banderaCargaDirecta2: boolean = false;
  public banderaCargaDirecta2_UI: boolean = true;

  public banderaMostrarDialogo: boolean = false;
  public banderaT01: boolean = false;
  public banderaT02: boolean = false;
  public banderaB01: boolean = false;
  public banderaIbc: boolean = false;
  public banderaTn01: boolean = false;


  public isSaving: boolean = false;
  public soloLectura: boolean = false;

  private originalComponent: any = null;

  public prebatchState = {
    water: 0,
    origen: '' as OrigenPrebatch,
    recircular: false,
    dificil: false,
    cargaDirecta: false,
    agitacionAuto: false,
    h: 0, m: 0, s: 0,
    comentarios: '',
  };

  public paragonState = {
    water: 0,
    origen2: '' as OrigenParagon,
    cargaDirecta2: false,
    agitacionAuto2: false,
    h2: 0, m2: 0, s2: 0,
    comentarios2: '',
  };

  tipos = [
    { label: '-', value: 0 },
    { label: 'Sólido', value: 1 },
    { label: 'Líquido', value: 2 }
  ];

  @HostListener('document:keydown.escape')
  onEscPressed() {
    this.intentarCerrar();
  }

  ngOnInit(): void {
    this.soloLectura = this.auth.isOperador();
    document.body.style.overflow = 'hidden';

    this.recetasService.obtenerComponentes().subscribe({
      next: (response: any) => {
        const data: Componentes[] = response.data;
        this.componentes = data.map(item => ({ label: item.componentes, value: item.id }));
      },
      error: (err) => console.error('Error al obtener componentes', err)
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  private isSolido(): boolean { return Number(this.tipo) === 1; }
  private isLiquido(): boolean { return Number(this.tipo) === 2; }
  private isParagon(): boolean { return this.modo === 'paragon'; }
  private isPrebatch1(): boolean { return this.modo === 'prebatch1'; }


  onComponenteSeleccionado(event: any): void {
    this.id = event.value;
    this.obtenerComponentesCompleto();
    this.validaEliminar();
  }

  modoChange(val: 'prebatch1' | 'paragon' | ''): void {
    this.modo = val;
    this.applyModoRules();
    this.syncParagonRadiosByTipo();
    this.normalizaParagonOrigen2();
  }

  onTipoAutomaticaChange(value: number): void {
    this.tipo = Number(value) || 0;
    this.applyModoRules();
    this.syncParagonRadiosByTipo();
    this.normalizaParagonOrigen2();
  }

  onOrigenChange(val: OrigenPrebatch): void {
    this.prebatchState.origen = val;
  }

  onOrigen2Change(val: 't01' | 't02' | 'b01' | 'ibc' | 'tn01' | ''): void {
    if (this.modo !== 'paragon') return;

    if (val && !this.paragonPermite(val as any)) {
      this.paragonState.origen2 = '';
    } else {
      this.paragonState.origen2 = val;
    }

    this.banderaCargaDirecta2 = (this.paragonState.origen2 === 't01');
    if (!this.banderaCargaDirecta2) this.paragonState.cargaDirecta2 = false;
  }

  onAgitacionAutomaticaChange(value: boolean): void {
    this.prebatchState.agitacionAuto = value;
    this.banderaAgitacionAutomatica = value;

    if (!value) {
      this.prebatchState.h = 0;
      this.prebatchState.m = 0;
      this.prebatchState.s = 0;
    }
  }

  onAgitacionParagonChange(value: boolean): void {
    if (!this.isSolido()) {
      this.paragonState.agitacionAuto2 = false;
      this.banderaAgitacionAutomaticaParagon = false;
      return;
    }

    this.paragonState.agitacionAuto2 = value;
    this.banderaAgitacionAutomaticaParagon = value;

    if (!value) {
      this.paragonState.h2 = 0;
      this.paragonState.m2 = 0;
      this.paragonState.s2 = 0;
    }
  }

  onRecircularChange(value: boolean): void {
    if (!this.isPrebatch1() || !this.isSolido()) return;

    this.prebatchState.recircular = value;
    this.banderaDisolucionDificil = !value;
  }

  onDisolucionChange(value: boolean): void {
    if (!this.isPrebatch1() || !this.isSolido()) return;

    this.prebatchState.dificil = value;

    if (value) {
      this.banderaRecircular = false;
      this.prebatchState.recircular = false;
      this.banderaCargaDirecta = true;
    } else {
      this.banderaRecircular = true;
      this.banderaCargaDirecta = false;
      this.prebatchState.cargaDirecta = false;
    }
  }

  private applyModoRules(): void {
    this.banderaAgua = false;
    this.banderaComentarios = false;
    this.banderaTanque = false;
    this.banderaBayoneta = false;
    this.banderaRecircular = false;
    this.banderaDisolucionDificil = false;
    this.banderaCargaDirecta = false;
    this.banderaAutomatica = false;
    this.banderaAgitacionAutomatica = false;

    this.banderaAguaParagon = false;
    this.banderaComentariosParagon = false;
    this.banderaAutomaticaParagon = false;
    this.banderaAgitacionAutomaticaParagon = false;
    this.banderaCargaDirecta2 = false;

    if (!this.modo) {
      this.banderaCargaDirecta2 = false;
      this.banderaT01 = this.banderaT02 = this.banderaB01 = this.banderaIbc = this.banderaTn01 = false;
      return;
    }

    const esSolido = this.isSolido();
    const esLiquido = this.isLiquido();

    if (this.isParagon()) {

      this.banderaAguaParagon = true;
      this.banderaComentariosParagon = true;
      this.syncParagonRadiosByTipo();

      this.banderaAutomaticaParagon = esSolido;
      this.banderaAgitacionAutomaticaParagon = esSolido && this.paragonState.agitacionAuto2;

      if (!esSolido) {
        this.paragonState.agitacionAuto2 = false;
        this.paragonState.h2 = 0;
        this.paragonState.m2 = 0;
        this.paragonState.s2 = 0;
      }

      return;
    }

    if (this.isPrebatch1()) {
      this.banderaAgua = true;
      this.banderaComentarios = true;

      if (esLiquido) {
        this.banderaTanque = true;
        this.banderaBayoneta = true;

        this.banderaRecircular = false;
        this.banderaDisolucionDificil = false;
        this.banderaCargaDirecta = false;
        this.banderaAutomatica = false;
        this.banderaAgitacionAutomatica = false;

        if (this.prebatchState.origen !== 'tanque' && this.prebatchState.origen !== 'bayoneta') {
          this.onOrigenChange('tanque');
        }

        this.prebatchState.recircular = false;
        this.prebatchState.dificil = false;
        this.prebatchState.cargaDirecta = false;
        this.prebatchState.agitacionAuto = false;
        this.prebatchState.h = 0; this.prebatchState.m = 0; this.prebatchState.s = 0;

        return;
      }

      if (esSolido) {
        this.banderaTanque = false;
        this.banderaBayoneta = false;

        this.banderaRecircular = true;
        this.banderaDisolucionDificil = !this.prebatchState.recircular;
        this.banderaCargaDirecta = this.prebatchState.dificil;

        this.banderaAutomatica = true;
        this.banderaAgitacionAutomatica = !!this.prebatchState.agitacionAuto;

        return;
      }

      return;
    }
  }

  //  Input validadores
  onlyNumberAndPoint(event: KeyboardEvent, _model: any): void {
    const input = event.target as HTMLInputElement;
    if (['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) return;

    if (!/[0-9.]/.test(event.key)) {
      event.preventDefault();
      return;
    }
    if (event.key === '.' && input.value.includes('.')) {
      event.preventDefault();
    }
  }

  onlyInteger(event: KeyboardEvent): void {
    if (['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) return;
    if (!/[0-9]/.test(event.key)) event.preventDefault();
  }

  // CRUD
  public validaEliminar(): void {
    this.recetasService.validaBtnEliminar(this.id).subscribe({
      next: (response: any) => {
        this.banderaEliminar = (response.data == null);
      }
    });
  }

  public eliminar(): void {
    this.confirmationService.confirm({
      message: '¿Realmente desea eliminar el componente?\nEsta función actualizará el listado de elementos.',
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      acceptButtonStyleClass: 'p-button p-button-sm p-button-danger p-button-outlined',
      rejectButtonStyleClass: 'p-button p-button-sm p-button-secondary p-button-text',
      accept: () => {
        this.recetasService.eliminar(this.id).subscribe({
          next: () => {
            this.toast.add({
              severity: 'success',
              summary: 'Componente eliminado',
              detail: 'El componente ha sido eliminado correctamente.'
            });

            this.inicializaComponentes();
            this.recetasService.obtenerComponentes().subscribe({
              next: (response: any) => {
                const data: Componentes[] = response.data;
                this.componentes = data.map(item => ({ label: item.componentes, value: item.id }));
              }
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el componente.'
            });
          }
        });
      }
    });
  }

  public obtenerComponentesCompleto(): void {
    this.banderaTanque = false;
    this.banderaBayoneta = false;
    this.banderaRecircular = false;
    this.banderaDisolucionDificil = false;
    this.banderaCargaDirecta = false;
    this.banderaAutomatica = false;
    this.banderaAgitacionAutomatica = false;

    this.banderaAgua = false;
    this.banderaComentarios = false;

    this.banderaAguaParagon = false;
    this.banderaComentariosParagon = false;
    this.banderaAutomaticaParagon = false;
    this.banderaAgitacionAutomaticaParagon = false;

    this.recetasService.obtenerComponentesCompleto(this.id).subscribe({
      next: (response: any) => {
        const data = response?.data;

        if (!data) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Componentes',
            detail: 'No se encontraron datos para el componente seleccionado.',
            life: 3000
          });
          return;
        }

        this.originalComponent = structuredClone(data);

        this.banderaNombre = true;
        this.banderaTipo = true;
        this.banderaReferencia = true;
        this.banderaMasa = true;
        this.banderaGuardar = true;
        this.banderaPrebatch1 = true;
        this.banderaParagon = true;

        const raw = data.updateTime ? new Date(data.updateTime) : null;
        this.updateTimeFormateado = raw ? (this.datePipe.transform(raw, 'dd/MM/yyyy hh:mm:ss a') ?? '') : '';

        this.name = data.name ?? '';
        this.recipeReference = data.recipeReference ?? '';
        this.mass = Number(data.mass) || 0;
        this.tipo = Number(data.type) || 0;
        this.syncParagonRadiosByTipo();
        this.version = Number(data.version) || 0;
        this.inventario = !!data.noInventoryValidation;

        const parseIsoToHMS = (iso: string | null | undefined) => {
          const txt = (iso ?? '').toString();
          const m = txt.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          return {
            h: m?.[1] ? parseInt(m[1], 10) : 0,
            m: m?.[2] ? parseInt(m[2], 10) : 0,
            s: m?.[3] ? parseInt(m[3], 10) : 0
          };
        };

        // PREBATCH
        const prebatchOrigen: OrigenPrebatch =
          (!data.bayonet && !data.liquidsTank) ? 'tanque'
          : (data.bayonet ? 'bayoneta' : 'tanque');

        const preDur = parseIsoToHMS(data.agitationDuration);

        this.prebatchState = {
          water: Number(data.water) || 0,
          origen: prebatchOrigen,
          recircular: !!data.circulate,
          dificil: !!data.hard,
          cargaDirecta: !!data.directWaterLoad,
          agitacionAuto: !!data.agitationAutomatic,
          h: preDur.h,
          m: preDur.m,
          s: preDur.s,
          comentarios: (data.comments ?? '').toString()
        };

        // PARAGON
        const paragonOrigen: OrigenParagon =
          data.t01 ? 't01'
          : data.t02 ? 't02'
          : data.b01 ? 'b01'
          : data.ibc ? 'ibc'
          : data.tn01 ? 'tn01'
          : '';

        const parDur = parseIsoToHMS(data.agitationDuration2);

        this.paragonState = {
          water: Number(data.water2) || 0,
          origen2: paragonOrigen,
          cargaDirecta2: !!data.directWaterLoad2,
          agitacionAuto2: !!data.agitationAutomatic2,
          h2: parDur.h,
          m2: parDur.m,
          s2: parDur.s,
          comentarios2: (data.comments2 ?? '').toString()
        };

        // aplicamos reglas y normalizamos Paragon cuando el usuario cambie a Paragon
        this.modo = '';
        this.applyModoRules();
      },
      error: (err) => {
        console.error('Error al obtener componente completo', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Componentes',
          detail: 'Error al obtener el componente.',
          life: 4000
        });
      }
    });
  }

  private buildIsoDuration(h: number, m: number, s: number): string {
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}H`);
    if (m > 0) parts.push(`${m}M`);
    if (s > 0) parts.push(`${s}S`);
    return parts.length ? `PT${parts.join('')}` : 'PT0S';
  }

  private buildIsoDurationFromInputs(h: number, m: number, s: number): string {
    const hhIn = Number(h) || 0;
    const mmIn = Number(m) || 0;
    const ssIn = Number(s) || 0;

    const totalSeconds = (hhIn * 3600) + (mmIn * 60) + ssIn;
    if (totalSeconds <= 0) return 'PT0S';

    const hh = Math.floor(totalSeconds / 3600);
    const rem = totalSeconds % 3600;
    const mm = Math.floor(rem / 60);
    const ss2 = rem % 60;

    return this.buildIsoDuration(hh, mm, ss2);
  }

  private buildPayloadSafe(): GuardaComponente {
    const base = structuredClone(this.originalComponent);

    base.name = this.name;
    base.recipeReference = this.recipeReference;
    base.mass = this.mass;
    base.type = this.tipo;
    base.version = this.version + 1;

    if (this.isPrebatch1()) {
      base.water = this.prebatchState.water;
      base.bayonet = (this.prebatchState.origen === 'bayoneta');
      base.circulate = this.prebatchState.recircular;
      base.hard = this.prebatchState.dificil;
      base.directWaterLoad = this.prebatchState.cargaDirecta;

      base.agitationAutomatic = !!this.prebatchState.agitacionAuto;
      base.agitationDuration = this.prebatchState.agitacionAuto
        ? this.buildIsoDurationFromInputs(this.prebatchState.h, this.prebatchState.m, this.prebatchState.s)
        : 'PT0S';

      base.comments = this.prebatchState.comentarios;
    }

    if (this.isParagon()) {
      base.water2 = this.paragonState.water;
      base.directWaterLoad2 = this.paragonState.cargaDirecta2;
      base.comments2 = this.paragonState.comentarios2;

      let o2 = (this.paragonState.origen2 || '') as ParagonOrigen | '';
      if (!o2) {
        o2 = 't02';
        this.paragonState.origen2 = 't02';
      }

      base.t01 = o2 === 't01';
      base.t02 = o2 === 't02';
      base.b01 = o2 === 'b01';
      base.ibc = o2 === 'ibc';
      base.tn01 = o2 === 'tn01';

      this.banderaCargaDirecta2 = (o2 === 't01');
      if (!this.banderaCargaDirecta2) this.paragonState.cargaDirecta2 = false;

      const esSolido = this.isSolido();
      base.agitationAutomatic2 = esSolido && !!this.paragonState.agitacionAuto2;
      base.agitationDuration2 = (esSolido && this.paragonState.agitacionAuto2)
        ? this.buildIsoDurationFromInputs(this.paragonState.h2, this.paragonState.m2, this.paragonState.s2)
        : 'PT0S';
    }

    return base as GuardaComponente;
  }

  private guardarComponente$(): Observable<ApiResponseDTO> {
    const componente = this.buildPayloadSafe();
    return this.recetasService.guardaComponente(componente);
  }

  public guardarComponente(): void {
    this.guardarComponente$().subscribe({
      next: (_) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Componentes',
          detail: 'Guardado Exitoso',
          life: 3000,
        });
        this.inicializaComponentes();
        setTimeout(() => this.cerrar(), 0);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el componente',
          life: 4000,
        });
      }
    });
  }

  public actualizaGuardadoComponente(): void {
    this.recetasService.actualizaGuardadoComponente(this.id).subscribe({
      next: () => this.guardarComponente(),
      error: (err) => console.error('Error en actualizaGuardadoComponente:', err)
    });
  }

  private actualizarLuegoGuardar(): void {
    if (this.isSaving) return;
    this.isSaving = true;

    this.recetasService.actualizaGuardadoComponente(this.id).pipe(
      concatMap(() => this.guardarComponente$()),
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: (_) => {
        this.toast.add({
          severity: 'success',
          summary: 'Componentes',
          detail: 'Actualizado y guardado con éxito'
        });
        this.inicializaComponentes();
        setTimeout(() => this.cerrar(), 0);
      },
      error: (err) => {
        console.error('Error en actualizar→guardar:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo completar el guardado',
          life: 4000,
        });
      }
    });
  }

  public guardado(): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de guardar el componente? Esta función actualizará el listado de elementos.',
      header: 'Guardar',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => this.actualizarLuegoGuardar(),
    });
  }

  public async validaNoObsoleto(): Promise<void> {
    const response = await this.recetasService.validaNoObsoleto(this.idNuevoComponente).toPromise();
    this.idValidaNoObsoleto = response?.data;

    if (this.idValidaNoObsoleto == null) {
      await this.validaObsoleto();

      if (this.idValidaObsoleto !== '') {
        this.confirmationService.confirm({
          message: 'Identificador existente como obsoleto. ¿Desea restablecer el registro para realizar modificaciones?',
          header: 'Confirmación',
          icon: 'pi pi-question-circle',
          acceptLabel: 'Sí',
          rejectLabel: 'No',
          acceptButtonStyleClass: 'p-button-success',
          rejectButtonStyleClass: 'p-button-secondary',
          accept: () => this.actualizaComponente(),
        });
      } else {
        this.creaComponente();
      }
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Crear',
        detail: 'Identificador existente. Verifique la información e intente nuevamente.',
        life: 3000,
      });
    }
  }

  public async validaObsoleto(): Promise<void> {
    const response = await this.recetasService.validaObsoleto(this.idNuevoComponente).toPromise();
    this.idValidaObsoleto = response?.data || '';
  }

  public creaComponente(): void {
    this.recetasService.creaComponente(
      this.idNuevoComponente,
      this.nombreNuevoComponente,
      this.referenciaNuevoComponente,
      this.tipoNuevoComponente
    ).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Componente creado',
          detail: 'El componente fue creado exitosamente.'
        });
        this.limpiaCreaComponente();
        this.ngOnInit();
      },
      error: (error) => {
        console.error('Error al crear componente: ', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el componente.',
          life: 3000
        });
      }
    });
  }

  public actualizaComponente(): void {
    this.recetasService.actualizaComponente(this.idNuevoComponente).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Crear',
          detail: 'Componente Actualizado'
        });
        this.limpiaCreaComponente();
        this.ngOnInit();
      }
    });
  }

  public limpiaCreaComponente(): void {
    this.idNuevoComponente = '';
    this.nombreNuevoComponente = '';
    this.referenciaNuevoComponente = '';
    this.tipoNuevoComponente = '';
    this.banderaMostrarDialogo = false;
  }

  intentarCerrar() {
    if (this.componenteForm?.dirty) {
      const confirmar = confirm('Tienes cambios sin guardar. ¿Deseas salir sin guardar?');
      if (!confirmar) return;
    }
    this.cerrar();
  }

  cerrar() {
    this.cerrarModal.emit();
  }

  //  Reset
  inicializaComponentes(): void {
    this.mass = 0;
    this.tipo = 0;
    this.version = 0;

    this.componenteSeleccionado = '';
    this.id = '';
    this.name = '';
    this.recipeReference = '';

    this.updateTimeFormateado = '';

    this.modo = '';

    this.inventario = false;

    // generales
    this.banderaUltimoCambio = false;
    this.banderaIdentificador = false;
    this.banderaNombre = false;
    this.banderaTipo = false;
    this.banderaMasa = false;
    this.banderaReferencia = false;

    this.banderaGuardar = false;
    this.banderaEliminar = false;

    this.banderaPrebatch1 = false;
    this.banderaParagon = false;

    this.banderaAgua = false;
    this.banderaComentarios = false;
    this.banderaTanque = false;
    this.banderaBayoneta = false;

    this.banderaRecircular = false;
    this.banderaDisolucionDificil = false;
    this.banderaCargaDirecta = false;

    this.banderaAutomatica = false;
    this.banderaAgitacionAutomatica = false;

    this.banderaAguaParagon = false;
    this.banderaComentariosParagon = false;
    this.banderaAutomaticaParagon = false;
    this.banderaAgitacionAutomaticaParagon = false;
    this.banderaCargaDirecta2 = false;

    this.prebatchState = {
      water: 0,
      origen: '' as OrigenPrebatch,
      recircular: false,
      dificil: false,
      cargaDirecta: false,
      agitacionAuto: false,
      h: 0, m: 0, s: 0,
      comentarios: '',
    };

    this.paragonState = {
      water: 0,
      origen2: '' as OrigenParagon,
      cargaDirecta2: false,
      agitacionAuto2: false,
      h2: 0, m2: 0, s2: 0,
      comentarios2: '',
    };

    this.originalComponent = null;
  }

  get nuevaIdValida(): boolean {
    return this.idNuevoComponente.trim().length > 0;
  }

  get nuevaNombreValida(): boolean {
    return this.nombreNuevoComponente.trim().length > 0;
  }

  get nuevaRefValida(): boolean {
    return this.referenciaNuevoComponente.trim().length > 0;
  }

  get nuevoTipoValido(): boolean {
    return !!this.tipoNuevoComponente && this.tipoNuevoComponente !== '-';
  }

  get puedeCrearNueva(): boolean {
    return this.nuevaIdValida && this.nuevaNombreValida && this.nuevaRefValida && this.nuevoTipoValido;
  }

private tipoNum(): number {
  return Number(this.tipo) || 0;
}

private esSolido(): boolean {
  return this.tipoNum() === 1;
}

private esLiquido(): boolean {
  return this.tipoNum() === 2;
}

  private paragonPermite(origen: ParagonOrigen): boolean {
    if (this.esSolido()) {
      return origen === 't01' || origen === 't02';
    }
    if (this.esLiquido()) {
      return origen === 't02' || origen === 'b01' || origen === 'ibc' || origen === 'tn01';
    }
    return false;
  }

  public paragonRadioDisabled(origen: ParagonOrigen): boolean {
    return this.soloLectura || this.modo !== 'paragon' || !this.paragonPermite(origen);
  }

  public agitacionParagonDisabled(): boolean {
    return this.soloLectura || this.modo !== 'paragon' || !this.esSolido();
  }

  private normalizaParagonOrigen2(): void {
    if (this.modo !== 'paragon') return;

    const current = this.paragonState.origen2 as ParagonOrigen | '';
    if (current && this.paragonPermite(current)) {
    } else {
      this.paragonState.origen2 = this.esSolido()
        ? 't02'
        : this.esLiquido()
          ? 't02'
          : '';
    }

    this.banderaCargaDirecta2 = (this.paragonState.origen2 === 't01');
    if (!this.banderaCargaDirecta2) this.paragonState.cargaDirecta2 = false;

    if (!this.esSolido()) {
      this.paragonState.agitacionAuto2 = false;
      this.banderaAgitacionAutomaticaParagon = false;
      this.paragonState.h2 = 0;
      this.paragonState.m2 = 0;
      this.paragonState.s2 = 0;
    }
  }

  private syncParagonRadiosByTipo(): void {
    const t = Number(this.tipo) || 0;
    const sol = t === 1;
    const liq = t === 2;

    this.banderaT01  = sol;
    this.banderaT02  = sol || liq;
    this.banderaB01  = liq;
    this.banderaIbc  = liq;
    this.banderaTn01 = liq;

    if (this.modo !== 'paragon') return;

    const current = this.paragonState.origen2;

    const ok =
      (current === 't01'  && this.banderaT01)  ||
      (current === 't02'  && this.banderaT02)  ||
      (current === 'b01'  && this.banderaB01)  ||
      (current === 'ibc'  && this.banderaIbc)  ||
      (current === 'tn01' && this.banderaTn01) ||
      current === '';

    if (!ok) {
      this.paragonState.origen2 = (sol || liq) ? 't02' : '';
    }

    this.banderaCargaDirecta2 = (this.paragonState.origen2 === 't01');
    if (!this.banderaCargaDirecta2) this.paragonState.cargaDirecta2 = false;

    if (!sol) {
      this.paragonState.agitacionAuto2 = false;
      this.banderaAgitacionAutomaticaParagon = false;
      this.paragonState.h2 = 0;
      this.paragonState.m2 = 0;
      this.paragonState.s2 = 0;
    }
  }
  
}