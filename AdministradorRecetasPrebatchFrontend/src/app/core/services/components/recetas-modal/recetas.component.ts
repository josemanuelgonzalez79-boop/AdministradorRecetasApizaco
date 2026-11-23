import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { RecetasService } from '../../recetas.service';
import { ComboRecetas } from '../../../../interfaces/ComboRecetas';
import { ComponentesComboDto } from '../../../../interfaces/ComponentesComboDto';
import { DropOption } from '../../../../interfaces/DropOption';
import { RecipePayload } from '../../../../interfaces/RecipePayLoad';
import { concatMap, tap, catchError, finalize } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { NuevaReceta } from '../../../../interfaces/NuevaReceta';
import { AuthService } from '../../../../core/services/auth.service';

type Fila = {
  componenteId: string | null;
  posicion: number | null;
  enabled: boolean;
  posEnabled: boolean;
  posOptions: number[];
  posDrop: { label: string; value: number }[];
};

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, ConfirmDialogModule,
  ToastModule],
  templateUrl: './recetas.component.html',
  styleUrls: ['./recetas.component.scss'],
  providers: [DatePipe, ConfirmationService, MessageService]
})
export class RecetasComponent implements OnInit {
  @Output() cerrarModal = new EventEmitter<void>();

  public recetasService = inject(RecetasService);
  public soloLectura = false;

  public recetas: { label: string; value: string }[] = [];
  public recetaSeleccionada = '';
  public id = '';
  public updateTime = '';
  public name = '';
  public finishedSyrupVolume = '';
  public comments = '';

  public mass = 0;
  public brix = 0;
  public density = 0;
  public selectedType = 0;
  public sucrose = 0;
  public fructose = 0;
  public water = 0;
  public idNumeric = 0;
  public version = 0;

  public agitationHours = 0;
  public agitationMinutes = 0;
  public agitationSeconds = 0;
  public agitationDuration = 0;

  public holdingHours = 0;
  public holdingMinutes = 0;
  public holdingSeconds = 0;
  public holdingDuration = 0;

  public comboComponentes: DropOption[] = [];
  public filas: Fila[] = [];
  public readonly MAX_FILAS = 16;
  public allowDuplicates = true;
  public optionsPorFila: DropOption[][] = [];
  private originalRecord?: RecipePayload;

  // Habilitadores
  public banderaNombre = false;
  public banderaMass = false;
  public banderaBrix = false;
  public banderaDensity = false;
  public banderaSucrose = false;
  public banderaFructose = false;
  public banderaWater = false;
  public banderaAgitationHours = false;
  public banderaAgitationMinutes = false;
  public banderaAgitationSeconds = false;
  public banderaHoldingHours = false;
  public banderaHoldingMinutes = false;
  public banderaHoldingSeconds = false;
  public banderaEliminar = false;
  public banderaTipo = false;
  public banderaComentarios = false;
  public banderaBtnGuardar = false;
  public banderaBtnEliminar = false;
  public renderCombos = true;


  types = [
    { label: '-', value: 0 },
    { label: 'Dietética', value: 1 },
    { label: 'Sacarosa', value: 2 },
    { label: 'Sacarosa pasteurizada', value: 3 },
    { label: 'Fructosa', value: 4 },
    { label: 'Sacarosa y fructosa', value: 5 },
  ];

  constructor(public datePipe: DatePipe,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {

    this.soloLectura = this.auth.isOperador();
    this.obtenerComboRecetas();
    this.componentesCombo();
    this.initFilas();
  }

  habilitar(){

    this.banderaNombre = true;
    this.banderaMass = true;
    this.banderaBrix = true;
    this.banderaDensity = true;
    this.banderaSucrose = true;
    this.banderaFructose = true;
    this.banderaWater = true;
    this.banderaAgitationHours = true;
    this.banderaAgitationMinutes = true;
    this.banderaAgitationSeconds = true;
    this.banderaHoldingHours = true;
    this.banderaHoldingMinutes = true;
    this.banderaHoldingSeconds = true;
    this.banderaEliminar = true;
    this.banderaTipo = true;
    this.banderaComentarios = true;
    this.banderaBtnGuardar = true;
    this.banderaBtnEliminar = true;

  }

  private forzarSoloLectura(): void {

    this.banderaNombre = false;
    this.banderaMass = false;
    this.banderaBrix = false;
    this.banderaDensity = false;
    this.banderaSucrose = false;
    this.banderaFructose = false;
    this.banderaWater = false;
    this.banderaAgitationHours = false;
    this.banderaAgitationMinutes = false;
    this.banderaAgitationSeconds = false;
    this.banderaHoldingHours = false;
    this.banderaHoldingMinutes = false;
    this.banderaHoldingSeconds = false;
    this.banderaTipo = false;
    this.banderaComentarios = false;

    this.banderaBtnGuardar = false;
    this.banderaBtnEliminar = false;

    for (const f of this.filas) {
      f.enabled = false;
      f.posEnabled = false;
    }
  }

    // Combo de recetas
  public obtenerComboRecetas(): void{

    this.recetasService.obtenerComboRecetas().subscribe({
      next: (response: any) => {
        const data: ComboRecetas[] = response.data ?? [];
        this.recetas = data.map(item => ({
          label: item.recipesCombo,
          value: item.id
        }));
      },
      error: err => console.error('Error al obtener recetas', err),
    });

  }

  private initFilas(): void {
    this.filas = Array.from({ length: this.MAX_FILAS }, () => ({
      componenteId: null,
      posicion: null,
      enabled: false,
      posEnabled: false,
      posOptions: [],
      posDrop: [],
    }));
  }

  onlyNumberAndPoint(event: KeyboardEvent, model: any): void {
    const input = event.target as HTMLInputElement;

    if (['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
      return;
    }

    if (!/[0-9.]/.test(event.key)) {
      event.preventDefault();
      return;
    }

    if (event.key === '.' && input.value.includes('.')) {
      event.preventDefault();
      return;
    }
  }

  onlyInteger(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;

    if (['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(event.key)) {
      return;
    }

    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
      return;
    }
  }

  sanearId(event: Event) {

    const max = 15;
    const input = event.target as HTMLInputElement;

    let value = input.value.replace(/\D/g, '');

    if (value.length > max) {

      value = value.slice(0, max);
    }

    input.value = value;
    this.nueva.id = value;

  }

  // índice de la última fila con componente capturado; -1 si ninguna
  private getLastActiveIndex(): number {
    for (let i = this.MAX_FILAS - 1; i >= 0; i--) {
      if (this.filas[i].componenteId) return i;
    }
    return -1;
  }

  // Solo habilita: la última con componente (+ su pos si i>0) y la siguiente (solo comp)
  private recomputeEnableState(): void {
    const last = this.getLastActiveIndex();

    for (let i = 0; i < this.MAX_FILAS; i++) {
      if (last === -1) {
        this.filas[i].enabled = (i === 0);
        this.filas[i].posEnabled = false;
      } else {
        if (i < last) {
          this.filas[i].enabled = false;
          this.filas[i].posEnabled = false;
        } else if (i === last) {
          this.filas[i].enabled = true;
          this.filas[i].posEnabled = (i > 0);
        } else if (i === last + 1) {
          this.filas[i].enabled = true;
          this.filas[i].posEnabled = false;
        } else {
          this.filas[i].enabled = false;
          this.filas[i].posEnabled = false;
        }
      }

      // Garantiza que la fila 0 jamás habilite posición
      if (i === 0) this.filas[0].posEnabled = false;
    }
  }

  public applyTipoRules(idx: number): void {
    switch (idx) {
      case 1:
        this.sucrose = 0;
        this.banderaSucrose = false;
        this.fructose = 0;
        this.banderaFructose = false;
        break;

      case 2:
      case 3:
        this.banderaSucrose = true;
        this.fructose = 0;
        this.banderaFructose = false;
        break;

      // Fructosa
      case 4:
        this.sucrose = 0;
        this.banderaSucrose = false;
        this.banderaFructose = true;
        break;

      // Ambos edulcorantes
      case 5:
        this.banderaSucrose = true;
        this.banderaFructose = true;
        break;

      // Sin tipo / default
      default:
        this.sucrose = 0;
        this.fructose = 0;
        this.banderaSucrose = false;
        this.banderaFructose = false;
        break;
    }
  }

  onTipoChange(e: { value: number } | number): void {
    const idx = typeof e === 'number' ? e : Number(e?.value ?? this.selectedType);
    this.selectedType = idx;
    this.applyTipoRules(idx);
  }

  // Construye opciones de posición para una fila según la anterior
  public buildPosOptions(i: number): void {
    const fila = this.filas[i];

    if (!fila.componenteId) {
      fila.posOptions = [];
      fila.posDrop = [];
      fila.posicion = null;
      return;
    }

    let opts: number[];
    if (i === 0) {
      opts = [0, 1];
      if (fila.posicion == null) fila.posicion = 1;
    } else {
      const base = this.filas[i - 1].posicion ?? 0;
      opts = [base, base + 1];
      if (fila.posicion == null) fila.posicion = base;
    }

    fila.posOptions = opts;
    fila.posDrop = opts.map(v => ({ label: String(v), value: v }));
  }

  // Resetea desde una fila (excluida) hacia abajo
  public resetFrom(index: number): void {
    for (let k = index; k < this.MAX_FILAS; k++) {
      this.filas[k].componenteId = null;
      this.filas[k].posicion = null;
      this.filas[k].enabled = (k === 0); 
      this.filas[k].posOptions = [];
    }
  }

  // Cuando el usuario elige/borra componente en la fila i
  public onComponenteChange(i: number, e: { value: string | null }): void {
    const fila = this.filas[i];
    fila.componenteId = (e?.value ?? null);

    if (!fila.componenteId) {
      fila.posEnabled = false;
      fila.posicion = null;
      fila.posOptions = [];
      fila.posDrop = [];

      for (let k = i + 1; k < this.MAX_FILAS; k++) {
        this.filas[k].enabled = false;
        this.filas[k].posEnabled = false;
        this.filas[k].componenteId = null;
        this.filas[k].posicion = null;
        this.filas[k].posOptions = [];
        this.filas[k].posDrop = [];
      }

      this.recomputeEnableState();
      this.recalcWater();
      return;
    }

    // Con componente -> genera opciones y habilita pos si i>0
    this.buildPosOptions(i);
    this.filas[i].posEnabled = (i > 0);

    // Habilita siguiente fila para capturar un nuevo componente (solo comp)
    if (i + 1 < this.MAX_FILAS) {
      this.filas[i + 1].enabled = true;
      this.filas[i + 1].posEnabled = false;
    }

    this.recomputeEnableState();
    this.recalcWater();
  }

  // Cuando cambia la posición en la fila i
  public onPosChange(i: number): void {
    for (let k = i + 1; k < this.MAX_FILAS; k++) {
      const f = this.filas[k];
      if (!f.enabled || !f.componenteId) break;
      this.buildPosOptions(k);
    }
    this.recomputeEnableState();
  }


  // Cargar la receta seleccionada (cabecera) y sus props
  public onRecetaSeleccionada(event: any): void {

    const valorSeleccionado = event?.value ?? '';
    this.id = valorSeleccionado;

    this.propiedadesRecetas();

    this.initFilas();

    if (this.soloLectura) {
      this.forzarSoloLectura();
    } else {
      this.habilitar();
    }
  }

  //limpiar filas desde índice start
  public clearFrom(start: number): void {

    for (let k = start; k < this.MAX_FILAS; k++) {
      this.filas[k].enabled = false;
      this.filas[k].componenteId = null;
      this.filas[k].posicion = null;
    }
  }

  //reconstruir opciones por fila a partir de un índice
  public rebuildOptionsFrom(start: number): void {
    for (let row = start; row < this.MAX_FILAS; row++) {
      if (this.allowDuplicates) {
        this.optionsPorFila[row] = [...this.comboComponentes];
        continue;
      }

      // Calcula usados hasta la fila anterior a 'row'
      const usados = new Set(
        this.filas.slice(0, row).map(f => f.componenteId).filter(Boolean) as string[]
      );

      // La fila 'row' ve todas menos las ya usadas arriba
      this.optionsPorFila[row] = this.comboComponentes.filter(opt => !usados.has(opt.value));

      const actual = this.filas[row].componenteId;
      if (actual && !this.optionsPorFila[row].some(o => o.value === actual)) {
        this.filas[row].componenteId = null;
        this.clearFrom(row + 1);
      }
    }
  }

  // Pinta los 16 combos a partir del payload que trae c01_id/c01_pos … c16_id/c16_pos
  public applyRecipeComponentsFromPayload(d: any): void {
    this.initFilas();

    for (let i = 0; i < this.MAX_FILAS; i++) {
      const pad = String(i + 1).padStart(2, '0');
      const id  = d[`c${pad}_id`]  ?? d[`c${pad}Id`];
      const pos = d[`c${pad}_pos`] ?? d[`c${pad}Pos`];

      if (!id || id === '-') break;

      this.filas[i].componenteId = String(id);
      this.buildPosOptions(i);
      if (pos != null) this.filas[i].posicion = Number(pos);

      if (i + 1 < this.MAX_FILAS) {
        this.filas[i + 1].enabled = true;
        this.filas[i + 1].posEnabled = false;
      }
    }

    // Aquí se bloquean filas anteriores, se habilita la última y la siguiente vacía
    this.recomputeEnableState();
  }

  // Llama backend para props y pinta componentes si vienen en el payload
  public propiedadesRecetas(): void {
    this.recetasService.propiedadesRecetas(this.id).subscribe({
      next: (response: any) => {
        const d = response?.data ?? {};
        const raw = new Date(d.updateTime);
        this.updateTime = this.datePipe.transform(raw, 'dd/MM/yyyy hh:mm:ss a') ?? '';

        this.idNumeric = d.idNumeric ?? 0;
        this.name = d.name ?? '';
        this.mass = d.mass ?? 0;
        this.brix = d.brix ?? 0;
        this.density = d.density ?? 0;
        this.sucrose = d.sucrose ?? 0;
        this.fructose = d.fructose ?? 0;
        this.water = d.water ?? 0;
        this.selectedType = d.type ?? 0;
        this.applyTipoRules(this.selectedType);
        this.agitationDuration = d.agitationDuration ?? 0;
        this.holdingDuration  = d.holdingDuration ?? 0;
        this.comments = d.comments ?? '';
        this.version = d.version ?? 0;

        this.finishedSyrupVolume = this.calculateFinishedSyrupVolume(this.density, this.mass);

        this.agitationHours   = Math.floor(this.agitationDuration / 3600);
        this.agitationMinutes = Math.floor((this.agitationDuration % 3600) / 60);
        this.agitationSeconds = this.agitationDuration % 60;

        this.holdingHours   = Math.floor(this.holdingDuration / 3600);
        this.holdingMinutes = Math.floor((this.holdingDuration % 3600) / 60);
        this.holdingSeconds = this.holdingDuration % 60;

        const orig: RecipePayload = {
          id: d.id ?? this.id,
          idNumeric: d.idNumeric ?? 0,
          name: d.name ?? '',
          mass: d.mass ?? 0,
          brix: d.brix ?? 0,
          density: d.density ?? 0,
          type: d.type ?? 0,
          sucrose: d.sucrose ?? 0,
          fructose: d.fructose ?? 0,
          water: d.water ?? 0,
          agitationDuration: d.agitationDuration ?? 0,
          holdingDuration: d.holdingDuration ?? 0,
          comments: d.comments ?? '',
          version: d.version ?? 0,
        };

        for (let i = 1; i <= 16; i++) {

          const pad = String(i).padStart(2, '0');
          (orig as any)[`c${pad}_id`]  = d[`c${pad}_id`]  ?? d[`c${pad}Id`]  ?? '-';
          (orig as any)[`c${pad}_pos`] = d[`c${pad}_pos`] ?? d[`c${pad}Pos`] ?? 0;
        }

        this.originalRecord = orig;

        this.applyRecipeComponentsFromPayload(d);
        this.recalcWater?.();

      },
      error: err => console.error('Error propiedadesRecetas', err),
    });
  }

  // Construye el payload actual (lo que hay en la UI) para mandarlo al back
  private buildCurrentPayload(): RecipePayload {
    const p: RecipePayload = {
      id: this.id,
      idNumeric: this.idNumeric,
      name: this.name,
      mass: this.mass,
      brix: this.brix,
      density: this.density,
      type: this.selectedType,
      sucrose: this.sucrose,
      fructose: this.fructose,
      water: this.water,
      agitationDuration: (this.agitationHours * 3600) + (this.agitationMinutes * 60) + this.agitationSeconds,
      holdingDuration: (this.holdingHours * 3600) + (this.holdingMinutes * 60) + this.holdingSeconds,
      comments: this.comments ?? '',
      version: this.version + 1,
    };

    // c01..c16
    for (let i = 1; i <= 16; i++) {
      const pad = String(i).padStart(2, '0');
      const fila = this.filas[i - 1];
      const id  = fila?.componenteId ?? '-';
      const pos = fila?.posicion ?? 0;

      (p as any)[`c${pad}_id`]  = id;
      (p as any)[`c${pad}_pos`] = pos;
    }

    return p;
  }

  private validateBeforeSave(): string[] {
    const errors: string[] = [];

    // Recalcula agua antes de validar
    this.recalcWater?.();

    // Tipo
    if (!this.selectedType || this.selectedType === 0)
      errors.push('Tipo de receta');

    // Numeric id > 0
    if (!this.idNumeric || this.idNumeric <= 0)
      errors.push('Identificador numérico (PLC)');

    // Nombre
    if (!this.name?.trim())
      errors.push('Nombre de receta');

    // Masa final > 0
    if (!(this.mass > 0))
      errors.push('Masa del jarabe');

    // Densidad >= 1
    if (!(this.density >= 1))
      errors.push('Densidad');

    // Sucrosa / Fructosa según banderas (equivalente a Enabled)
    if (this.banderaSucrose && !(this.sucrose > 0))
      errors.push('Sacarosa');
    if (this.banderaFructose && !(this.fructose > 0))
      errors.push('Fructosa');

    // Agua > 0
    if (!(this.water > 0))
      errors.push('Agua');

    // Al menos un componente
    const primera = this.filas[0];
    if (!primera?.componenteId || primera.componenteId === '-')
      errors.push('Al menos un componente');

    return errors;
  }

  // Compara payload actual con el original para ver si hay cambios
  private detectChanges(current: RecipePayload, original?: RecipePayload): boolean {
    if (!original) return true;

    const simpleKeys: (keyof RecipePayload)[] = [
      'idNumeric','name','mass','brix','density','type',
      'sucrose','fructose','water','agitationDuration','holdingDuration','comments'
    ];

    for (const k of simpleKeys) {
      if ((current[k] ?? null) !== (original[k] ?? null)) return true;
    }

    // Componentes c01..c16
    for (let i = 1; i <= 16; i++) {
      const pad = String(i).padStart(2, '0');
      const idKey  = `c${pad}_id`  as const;
      const posKey = `c${pad}_pos` as const;

      if ((current as any)[idKey]  !== (original as any)[idKey])  return true;
      if ((current as any)[posKey] !== (original as any)[posKey]) return true;
    }

    return false;
  }

  public guardarReceta(): void {
    const errors = this.validateBeforeSave();
    if (errors.length) {
      const detalle = 'Información incompleta. Es necesario introducir los siguientes datos:\n' +
        errors.map(e => `• ${e}`).join('\n');
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: detalle, life: 5500 });
      return;
    }

    const current = this.buildCurrentPayload();
    const changed = this.detectChanges(current, this.originalRecord);
    if (!changed) {
      this.messageService.add({ severity: 'info', summary: 'Sin cambios', detail: 'No hay cambios para guardar.' });
      return;
    }

    this.confirmationService.confirm({
      message: '¿Está seguro de guardar la receta?\nEsta función actualizará el listado de elementos.',
      header: 'Guardar',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, guardar',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      acceptButtonStyleClass: 'p-button p-button-sm p-button-primary',
      rejectButtonStyleClass: 'p-button p-button-sm p-button-secondary p-button-text',
      accept: () => {
        this.banderaBtnGuardar = false;

        this.recetasService.actualizaGuardadoReceta(this.id).pipe(
          catchError(err => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo preparar el guardado.' });
            return throwError(() => err);
          }),
          concatMap(() => this.recetasService.guardarReceta(current)),
          tap(() => {
            this.messageService.add({
              severity: 'success',
              summary: 'Guardado',
              detail: 'La receta fue guardada correctamente.'
            });
            this.originalRecord = { ...current };
            this.resetAfterSuccess(); 
          }),
          finalize(() => {
          })
        ).subscribe({
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la receta.' });
            console.error('guardarReceta error', err);
          }
        });
      }
    });
  }

  public actualizaGuardadoReceta(): void {

    this.recetasService.actualizaGuardadoReceta(this.id).subscribe({
      next: (response: any) => {

      }

    })

  }

  public eliminarReceta(): void {
    this.confirmationService.confirm({
      message: '¿Realmente desea eliminar la receta?\nEsta función actualizará el listado de elementos.',
      header: 'Confirmacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Si, eliminar',
      rejectLabel: 'Cancelar',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      acceptButtonStyleClass: 'p-button p-button-sm p-button-danger p-button-outlined',
      rejectButtonStyleClass: 'p-button p-button-sm p-button-secondary p-button-text',
      accept: () => {
        this.recetasService.eliminarReceta(this.id).subscribe({
          next: (response: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Receta eliminada',
              detail: 'La receta ha sido eliminada correctamente'
            });

          this.resetAfterSuccess();

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


  public inicializaRecetas(): void {
    this.recetaSeleccionada = '';
    this.updateTime = '';
    this.id = '';
    this.idNumeric = 0;
    this.name = '';
    this.mass = 0;
    this.finishedSyrupVolume = '';
    this.brix = 0;
    this.density = 0;
    this.selectedType = 0;
    this.sucrose = 0;
    this.fructose = 0;
    this.water = 0;
    this.agitationHours = 0;
    this.agitationMinutes = 0;
    this.agitationSeconds = 0;
    this.holdingHours = 0;
    this.holdingMinutes = 0;
    this.holdingSeconds = 0;
    this.comments = '';

    this.optionsPorFila = [];

    this.initFilas();

    this.banderaNombre = false;
    this.banderaMass = false;
    this.banderaBrix = false;
    this.banderaDensity = false;
    this.banderaSucrose = false;
    this.banderaFructose = false;
    this.banderaWater = false;
    this.banderaAgitationHours = false;
    this.banderaAgitationMinutes = false;
    this.banderaAgitationSeconds = false;
    this.banderaHoldingHours = false;
    this.banderaHoldingMinutes = false;
    this.banderaHoldingSeconds = false;
    this.banderaEliminar = false;
    this.banderaTipo = false;
    this.banderaComentarios = false;
    this.banderaBtnGuardar = false;
    this.banderaBtnEliminar = false;
  }


  // Pinta los 16 slots con lo que llega del back (c01_id / c01_pos ...)
  public cargarComponentesDeReceta(payload: any): void {
    this.initFilas();

    for (let i = 0; i < this.MAX_FILAS; i++) {
      const pad = (i + 1).toString().padStart(2, '0');

      const id  = payload[`c${pad}Id`]  ?? payload[`c${pad}_id`]  ?? payload[`c${pad}id`];
      const pos = payload[`c${pad}Pos`] ?? payload[`c${pad}_pos`] ?? payload[`c${pad}pos`];

      if (id && id !== '-') {
        this.filas[i].enabled = true;
        this.filas[i].componenteId = String(id);

        this.buildPosOptions(i);
        this.filas[i].posicion = Number(pos ?? this.filas[i].posicion ?? 0);

        if (i + 1 < this.MAX_FILAS) this.filas[i + 1].enabled = true;
      } else {
        break;
      }
    }

    this.recalcWater();
  }

  componentesCombo(): void {
    this.recetasService.componentesCombo().subscribe({
      next: (response: any) => {
        const data = (response?.data ?? []) as ComponentesComboDto[];
        this.comboComponentes = data.map(item => ({
          label: item.componentes,
          value: item.id
        }));
        this.initFilas();
      },
      error: (err) => console.error('Error al obtener componentesCombo', err),
    });
  }

  // Calcula volumen de jarabe final
  calculateFinishedSyrupVolume(density: number, finishedSyrupMass: number): string {
    let volume = 0;
    if (density > 0 && !isNaN(finishedSyrupMass)) {
      volume = finishedSyrupMass / density;
    }
    return ` (${volume.toFixed(4)} L)`;
  }

    recomputeFinishedVolume(): void {
      const d = Number(this.density) || 0;
      const m = Number(this.mass) || 0;
      this.finishedSyrupVolume = this.calculateFinishedSyrupVolume(d, m);
    }

  // Suma masas de concentrado según filas y actualiza agua
  public recalcWater(): void {
    let concentrateMass = 0;

    for (const fila of this.filas) {
      if (!fila.componenteId) continue;

      const opt = this.comboComponentes.find(o => o.value === fila.componenteId);
      if (!opt) continue;

      const anyOpt = opt as any;
      if (typeof anyOpt.mass === 'number') {
        concentrateMass += anyOpt.mass;
      } else {
        concentrateMass += this.parseMassFromLabel(opt.label);
      }
    }

    const m = Number(this.mass || 0);
    const s = Number(this.sucrose || 0);
    const f = Number(this.fructose || 0);
    this.water = Number((m - s - f - concentrateMass).toFixed(4));
  }

  //Extrae (X.XXXX kg) del label cuando no tienes mass numérica
  public parseMassFromLabel(label: string): number {
    const m = /\(([-\d., ]+)\s*kg\)/.exec(label);
    if (!m) return 0;
    return Number(m[1].replace(/\s/g, '').replace(',', '.')) || 0;
  }

  // limpia la pantalla
  private resetAfterSuccess(): void {
    this.inicializaRecetas();    
    this.obtenerComboRecetas();   
    this.componentesCombo();     
    this.originalRecord = undefined; 
  }


  cerrar() {
    this.cerrarModal.emit();
  }


  //////////////////////////////////////////////NUEVA RECETA////////////////////////////////////////////////////////////////////////

  public isRecetasOpen = false;
  public mostrarNueva  = false;
  public banderaNuevaNombre = false;
  public banderaNuevaJarabe = false;
  public banderaNuevaBrix = false;
  public banderaNuevaDensidad = false;
  public banderaNuevaTipo = false;
  public banderaNuevaSucrosa  = false;
  public banderaNuevaFructosa = false;
  public banderaNuevaAgua = false;
  public banderaNuevaComponentes = false;

  public habilitaCamposNueva(on: boolean) {
    this.banderaNuevaNombre      = on;
    this.banderaNuevaJarabe      = on;
    this.banderaNuevaBrix        = on;
    this.banderaNuevaDensidad    = on;
    this.banderaNuevaTipo        = on;
    this.banderaNuevaAgua        = on;
    this.banderaNuevaComponentes = on;
  }

  onBlurCuatroDecimales(ctrl: 'jarabe'|'brix'|'sacarosa'|'fructosa'|'agua') {
    const v = Number(this.nueva[ctrl] || 0);
    this.nueva[ctrl] = Number(v.toFixed(4)) as any;
  }

  onBlurDensidad() {
    const v = Number(this.nueva.densidad || 1);
    this.nueva.densidad = Number(v.toFixed(5));
  }

  public finishedSyrupVolumeNueva = ' (0.0000 L)';

  nueva: NuevaReceta = {
    id: '',
    nombre: '',
    idNumeric: 0,
    jarabe: 0,
    brix: 0,
    densidad: 1.0,
    tipo: 1,
    sacarosa: 0,
    fructosa: 0,
    agua: 0,
    componente: ''
  };

  // Helpers de scroll (para que el modal superior bloquee el body)
  private lockBodyScroll() {
    document.body.style.overflow = 'hidden';
  }
  private unlockBodyScrollIfNoModal() {
    if (!this.isRecetasOpen && !this.mostrarNueva) {
      document.body.style.overflow = '';
    }
  }

  abrirRecetas() {
    this.isRecetasOpen = true;
    this.lockBodyScroll();
  }

  onEnterNuevaId(event: Event) {
    event.preventDefault();
    this.validarIdNueva();
  }

  private normalizaId(s: string) {
    return (s || '').trim();
  }

  // Abre el modal NUEVA y resetea estado
  async abrirNueva() {
    this.nueva = {
      id: '',
      nombre: '',
      idNumeric: 0,
      jarabe: 0,
      brix: 0,
      densidad: 1.0,
      tipo: 0,
      sacarosa: 0,
      fructosa: 0,
      agua: 0,
      componente: ''
    };
    this.finishedSyrupVolumeNueva = ' (0.0000 L)';
    this.banderaNuevaSucrosa  = false;
    this.banderaNuevaFructosa = false;

    // Carga catálogo para el primer componente (y asigna default)
    await this.cargarComponentesParaNueva();

    this.mostrarNueva = true;
    this.lockBodyScroll();
    this.habilitaCamposNueva(false);
  }

  // Cierra modal NUEVA
  cerrarNueva() {
    this.mostrarNueva = false;
    this.unlockBodyScrollIfNoModal();
  }

  // Llamado desde (input) en jarabe/densidad
  actualizaVolumenNueva() {
    this.recalcNuevaVolumenYAgua();
  }

  async validarIdNueva() {
    const id = this.normalizaId(this.nueva.id);
    this.nueva.id = id; 

    if (!id || id.includes(' ')) {
      this.messageService.add({ severity:'warn', summary:'ID inválido', detail:'El identificador no debe tener espacios.' });
      this.habilitaCamposNueva(false);
      return;
    }

    try {
      const existe = await this.recetasService.validaExisteReceta(id).toPromise();
      if (existe?.data) {
        this.messageService.add({ severity:'warn', summary:'ID existente', detail:'Identificador existente. Verifique e intente nuevamente.' });
        this.habilitaCamposNueva(false);
        return;
      }

      const obsoleta = await this.recetasService.validaRecetaObsoleta(id).toPromise();
      if (obsoleta?.data) {
        this.confirmationService.confirm({
          message: 'Identificador existente como obsoleto. ¿Desea restablecer el registro para realizar modificaciones?',
          header: 'Restaurar',
          icon: 'pi pi-question-circle',
          acceptLabel: 'Sí, restaurar',
          rejectLabel: 'Cancelar',
          accept: async () => {
            await this.recetasService.restaurarRecetaObsoleta(id).toPromise();
            this.mostrarNueva = false;
            this.unlockBodyScrollIfNoModal();
            this.inicializaRecetas();
            this.obtenerComboRecetas();
            this.messageService.add({ severity: 'success', summary: 'Restaurada', detail: 'La receta fue restaurada correctamente.' });
          }
        });
        return;
      }

      // OK: ID libre -> habilita formulario
      await this.cargarComponentesParaNueva();
      this.habilitaCamposNueva(true);

    } catch (e) {
      console.error(e);
      this.habilitaCamposNueva(false);
      this.messageService.add({ severity:'error', summary:'Error', detail:'No se pudo validar el identificador.' });
    }
  }

  // Carga catálogo de componentes y pone default
  private async cargarComponentesParaNueva() {
    if (!this.comboComponentes?.length) {
      const resp: any = await this.recetasService.componentesCombo().toPromise();
      const data = (resp?.data ?? []) as ComponentesComboDto[];
      this.comboComponentes = data.map(x => ({ label: x.componentes, value: x.id }));
    }
    if (this.comboComponentes.length && !this.nueva.componente) {
      this.nueva.componente = this.comboComponentes[0].value;
    }
  }


  onTipoNuevaChange(val: number) {
    this.nueva.tipo = val;

    switch (val) {
      case 1: // Dietética
        this.nueva.sacarosa = 0; this.banderaNuevaSucrosa = false;
        this.nueva.fructosa = 0; this.banderaNuevaFructosa = false;
        break;
      case 2:
      case 3:
        this.banderaNuevaSucrosa = true;
        this.nueva.fructosa = 0; this.banderaNuevaFructosa = false;
        break;
      case 4:
        this.nueva.sacarosa = 0; this.banderaNuevaSucrosa = false;
        this.banderaNuevaFructosa = true;
        break;
      case 5:
        this.banderaNuevaSucrosa = true;
        this.banderaNuevaFructosa = true;
        break;
      default:
        this.nueva.sacarosa = 0; this.banderaNuevaSucrosa = false;
        this.nueva.fructosa = 0; this.banderaNuevaFructosa = false;
    }

    this.recalcNuevaVolumenYAgua();
  }

  // Cálculos en vivo (volumen y agua)
  recalcNuevaVolumenYAgua() {
    const d = Number(this.nueva.densidad)  || 0;
    const m = Number(this.nueva.jarabe)    || 0;
    const s = Number(this.nueva.sacarosa)  || 0;
    const f = Number(this.nueva.fructosa)  || 0;

    const vol = d > 0 ? m / d : 0;
    this.finishedSyrupVolumeNueva = ` (${vol.toFixed(4)} L)`;

    this.nueva.agua = Number((m - s - f).toFixed(4));
  }

  // Validación mínima
  puedeCrearNueva(): boolean {
    return !!(
      (this.nueva.id || '').trim() &&
      (this.nueva.nombre || '').trim() &&
      this.nueva.tipo !== 0 &&
      this.nueva.jarabe > 0 &&
      this.nueva.densidad >= 1 &&
      this.nueva.agua > 0 &&
      this.nueva.componente
    );
  }

  crearNueva() {
    
    if (!this.puedeCrearNueva()) return;

    this.confirmationService.confirm({
      message: '¿Está seguro de guardar la receta?\nEsta función actualizará el listado de fórmulas.',
      header: 'Guardar',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, crear',
      rejectLabel: 'Cancelar',
      accept: () => {
        const payload: NuevaReceta = { ...this.nueva };
        this.recetasService.creaNuevaReceta(payload).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Creada', detail: 'La nueva receta fue creada correctamente.' });

            this.mostrarNueva = false;
            this.unlockBodyScrollIfNoModal();

            this.obtenerComboRecetas();
            this.componentesCombo();

            this.inicializaRecetas();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la receta.' });
          }
        });
      }
    });
  }

}