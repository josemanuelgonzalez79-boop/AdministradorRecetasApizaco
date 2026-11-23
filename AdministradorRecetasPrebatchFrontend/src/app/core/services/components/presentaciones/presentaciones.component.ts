import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PresentacionesService } from '../presentaciones.service';
import { AuthService } from '../../auth.service';
import { ToastModule } from "primeng/toast";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { catchError, forkJoin, of, throwError } from 'rxjs';
import { switchMap,finalize } from 'rxjs/operators';
import { GuardaPresentacion } from '../../../../interfaces/GuardaPresentacion';

type Presentacion = {
  id: string;
  codigo: string;
  nombre: string;
  referencia: string;
  unidades: number;
  ultimoCambio: string;
  contenido: string[];
  comentarios?: string;
};

type OpcionPresentacion = { presentation_id: string; presentation: string };
type nuevaPresentacion = { component_id: string; contenido: string };
type ComboContenido = {
  component_id: string;
  contenido: string;
};
@Component({
  selector: 'app-presentaciones',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    DialogModule, DropdownModule, InputTextModule, InputTextareaModule,
    InputNumberModule, ButtonModule, DividerModule, PanelModule, TooltipModule,
    ToastModule,
    ConfirmDialogModule
],
  templateUrl: './presentaciones.component.html',
  styleUrls: ['./presentaciones.component.scss'],
  providers: [DatePipe, ConfirmationService]
  
})
export class PresentacionesComponent implements OnInit {

  @Input()  visible = false;
  @Output() cerrarModal = new EventEmitter<void>();
  private presentacionesService = inject(PresentacionesService)
  private toast = inject(MessageService);
  public listaPresentaciones: OpcionPresentacion[] = [];
  public contenidoDD: ComboContenido[] = [];
  private fb = inject(FormBuilder);
  form!: FormGroup;

  public version: number = 0;
  public id: string = "";
  public componenteSeleccionado: string = "";
  public comments: string = "";
  public presentation_id: string = "";
  public presentation_name: string = "";
  public recipe_reference: string = "";
  public fechaPresentacion: string = "";
  public c01_id: string = "";
  public c02_id: string = "";
  public c03_id: string = "";
  public c04_id: string = "";
  public c05_id: string = "";
  public contenido1: string | null = null;
  public contenido2: string | null = null;
  public contenido3: string | null = null;
  public contenido4: string | null = null;
  public contenido5: string | null = null;
  public unidades: number = 0;
  public banderaUltimoCambio: number = 0;
  public banderaIdentificador: boolean = false;
  public banderaNombre: boolean = false;
  public banderaReferencia: boolean = false;
  public banderaUnidades: boolean = false;
  public banderaContenido1: boolean = false;
  public banderaContenido2: boolean = false;
  public banderaContenido3: boolean = false;
  public banderaContenido4: boolean = false;
  public banderaContenido5: boolean = false;
  public banderaComentarios: boolean = false;
  public banderaGuardar: boolean = false;
  public banderaEliminar: boolean = false;
  public soloLectura: boolean = false;

  ngOnInit(): void {

    this.soloLectura = this.auth.isOperador();

    this.cargarNuevoContenido();
    this.presentacionesService.comboPresentaciones().subscribe({
      next: (response: any) => {

        this.listaPresentaciones = response.data;

      }
    })

  }

    constructor(private datePipe: DatePipe,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private auth: AuthService
    ) {}

  public propiedadesPresentaciones(): void {

    this.presentacionesService.propiedadesPresentacion(this.id).subscribe({
      next: (response: any) => {

        this.comments = response.data.comments;
        this.presentation_id = response.data.presentation_id;
        this.presentation_name = response.data.presentation_name;
        this.recipe_reference = response.data.recipe_reference;
        this.unidades = response.data.units;
        this.version = response.data.version;
        
        const raw = new Date(response.data.update_time);
        this.fechaPresentacion = this.datePipe.transform(raw, 'dd/MM/yyyy hh:mm:ss a') ?? '';
        this.habilitaComponentes();
      },
      error: () => {

        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'error al cargar Presentacion.' });
      }

    });

  }

  public obtenerContenido(): void {
    this.presentacionesService.obtenerContenido().subscribe({
      next: (response: any) => {
        this.contenidoDD = (response?.data ?? [])
          .filter(Boolean)
          .map((r: any): ComboContenido => ({
            component_id: r.component_id ?? r.id,
            contenido: r.contenido ?? r.label ?? ''
          }))
          .filter((o: ComboContenido) => !!o.component_id && !!o.contenido);
      }
    });
  }

  public contenidoSegmentado(): void {
    this.presentacionesService.contenidoSegmentado(this.id).subscribe({
      next: (resp: any) => {
        this.c01_id = resp?.data?.c01_id ?? '';
        this.c02_id = resp?.data?.c02_id ?? '';
        this.c03_id = resp?.data?.c03_id ?? '';
        this.c04_id = resp?.data?.c04_id ?? '';
        this.c05_id = resp?.data?.c05_id ?? '';

        const idsValidos = [
          resp?.data?.c01_id,
          resp?.data?.c02_id,
          resp?.data?.c03_id,
          resp?.data?.c04_id,
          resp?.data?.c05_id,
        ]
          .filter((v): v is string => typeof v === 'string')
          .map(v => v.trim())
          .filter(v => v.length > 0 && v !== '-');
        const unicos = Array.from(new Set(idsValidos));

        // Asegura que existan en el combo
        this.preloadContenido(unicos);

        // Asigna selección inicial
        this.contenido1 = unicos[0] ?? '-';
        this.contenido2 = unicos[1] ?? '-';
        this.contenido3 = unicos[2] ?? '-';
        this.contenido4 = unicos[3] ?? '-';
        this.contenido5 = unicos[4] ?? '-';

        // Regla única y consistente: habilitar N+1 si N tiene valor
        this.recomputeContenidoFlags();
      },
      error: () => {
        this.contenido1 = this.contenido2 = this.contenido3 = this.contenido4 = this.contenido5 = null;
        this.recomputeContenidoFlags();
      }
    });
  }

  private clearFrom(n: number): void {
    if (n <= 1) this.contenido1 = null;
    if (n <= 2) this.contenido2 = null;
    if (n <= 3) this.contenido3 = null;
    if (n <= 4) this.contenido4 = null;
    if (n <= 5) this.contenido5 = null;
  }

  // Recalcula qué dropdowns están habilitados según la regla:
  // 2 habilitado si 1 tiene valor, 3 si 2 tiene valor, etc.
  private recomputeContenidoFlags(): void {
    const has1 = !!this.contenido1;
    const has2 = !!this.contenido2;
    const has3 = !!this.contenido3;
    const has4 = !!this.contenido4;

    this.banderaContenido1 = true;
    this.banderaContenido2 = has1;
    this.banderaContenido3 = has2;
    this.banderaContenido4 = has3;
    this.banderaContenido5 = has4;
  }

  // Cuando el usuario selecciona/cambia un dropdown
  onSelectContenido(n: number, value: string | null): void {
    switch (n) {
      case 1: this.contenido1 = value ?? null; if (!value) this.clearFrom(2); break;
      case 2: this.contenido2 = value ?? null; if (!value) this.clearFrom(3); break;
      case 3: this.contenido3 = value ?? null; if (!value) this.clearFrom(4); break;
      case 4: this.contenido4 = value ?? null; if (!value) this.clearFrom(5); break;
      case 5: this.contenido5 = value ?? null; break;
    }
    this.recomputeContenidoFlags();
  }

  // IDs seleccionados antes del dropdown n (n=1..5)
  private selectedBefore(n: number): Set<string> {
    const s = new Set<string>();
    if (n > 1 && this.contenido1) s.add(this.contenido1);
    if (n > 2 && this.contenido2) s.add(this.contenido2);
    if (n > 3 && this.contenido3) s.add(this.contenido3);
    if (n > 4 && this.contenido4) s.add(this.contenido4);
    return s;
  }

  // Opciones filtradas para el dropdown n (1..5), excluyendo lo seleccionado previamente
  optsContenido(n: number) {
    const prev = this.selectedBefore(n);
    return (this.contenidoDD ?? []).filter(o => !prev.has(o.component_id));
  }

  // Cuando el usuario pulsa el botón de limpiar del dropdown
  onClearContenido(n: number): void {
    this.onSelectContenido(n, null);
  }

  cerrar() {
    this.cerrarModal.emit();
  }

  public habilitaComponentes(): void {

    this.banderaNombre = true;
    this.banderaReferencia = true;
    this.banderaUnidades = true;
    this.banderaContenido1 = true;
    this.banderaContenido2 = true;
    this.banderaContenido3 = true;
    this.banderaContenido4 = true;
    this.banderaContenido5 = true;
    this.banderaComentarios = true;
    this.banderaGuardar = true;
    this.banderaEliminar = true;

  }

  public deshabilitarComponentes(): void {

    this.banderaNombre = false;
    this.banderaReferencia = false;
    this.banderaUnidades = false;
    this.banderaContenido1 = false;
    this.banderaContenido2 = false;
    this.banderaContenido3 = false;
    this.banderaContenido4 = false;
    this.banderaContenido5 = false;
    this.banderaComentarios = false;
    this.banderaGuardar = false;
    this.banderaEliminar = false;

  }

  onClearPresentacion(): void {
    this.limpiarCampos();
    this.deshabilitarComponentes();
  }

  private limpiarCampos(): void {
    this.componenteSeleccionado = null as any;

    this.id = '';
    this.fechaPresentacion = '';
    this.presentation_name = '';
    this.recipe_reference = '';
    this.unidades = 0;
    this.comments = '';

    this.contenido1 = this.contenido2 = this.contenido3 = this.contenido4 = this.contenido5 = null;
  }

  private preloadContenido(ids: string[]): void {
    if (!ids?.length) return;

    const peticiones = ids.map(id =>
      this.presentacionesService.contenidPreCargado(id).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(peticiones).subscribe((respuestas: any[]) => {
      const nuevos: ComboContenido[] = respuestas
        .filter(r => r && r.data && r.data.component_id)
        .map(r => ({
          component_id: String(r.data.component_id),
          contenido: String(r.data.contenido ?? '')
        }));

      if (!nuevos.length) return;

      const existentes = new Map<string, ComboContenido>(
        (this.contenidoDD ?? []).filter(Boolean).map(o => [o.component_id, o])
      );

      for (const n of nuevos) existentes.set(n.component_id, n);

      this.contenidoDD = Array.from(existentes.values());
    });
  }

  onComponenteSeleccionado(event: any): void {
    const valor = event?.value ?? null;

    if (valor == null) {
      this.onClearPresentacion();
      return;
    }

    this.id = valor;
    this.habilitaComponentes();

    // Carga propiedades generales y catálogo completo:
    this.propiedadesPresentaciones();
    this.obtenerContenido();

    // Carga y procesa c01..c05:
    this.contenidoSegmentado();
  }

  actualizaGuardadoPresentacion(){

    this.presentacionesService.actualizaGuardadoPresentacion(this.id).subscribe({
      next: (response: any) => {



      }

    });

  }

  guardadoPresentacion() {
    const presentationId = this.presentation_id || this.id;

    if (!presentationId) {
      this.messageService.add({ severity: 'warn', summary: 'Falta selección', detail: 'Selecciona una presentación.' });
      return;
    }
    if (!this.presentation_name?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Nombre requerido', detail: 'El nombre es obligatorio.' });
      return;
    }
    if (!this.recipe_reference?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Referencia requerida', detail: 'La referencia es obligatoria.' });
      return;
    }
    if (!this.contenido1) {
      this.messageService.add({ severity: 'warn', summary: 'Contenido requerido', detail: 'Contenido 1 es obligatorio.' });
      return;
    }

    // Normalizador de ids
    const norm = (v: string | null | undefined) => {
      if (v == null) return null;
      const t = String(v).trim();
      return (t.length === 0 || t === '-') ? null : t;
    };

    const payload: GuardaPresentacion = {
      presentation_id: presentationId,
      presentation_name: this.presentation_name ?? '',
      recipe_reference: this.recipe_reference ?? '',
      units: Number(this.unidades ?? 0),
      c01_id: norm(this.contenido1)!,
      c02_id: norm(this.contenido2),
      c03_id: norm(this.contenido3),
      c04_id: norm(this.contenido4),
      c05_id: norm(this.contenido5),
      comments: this.comments ?? '',
      version: (this.version ?? 0) + 1
    };

      this.confirmationService.confirm({
      message: '¿Está seguro de guardar la presentacion?\nEsta función actualizará el listado de presentaciones.',
      header: 'Guardar',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, Guardar',
      rejectLabel: 'Cancelar',
      accept: () => {

        this.banderaGuardar = false;

        this.presentacionesService
          .actualizaGuardadoPresentacion(presentationId)
          .pipe(
            switchMap((resp) => {
              const code = resp?.meta?.statusCode ?? 0;
              if (code >= 200 && code < 300) {
                return this.presentacionesService.guardadoPresentacion(payload);
              }
              return throwError(() => new Error(resp?.message || 'No se pudo actualizar la presentación (update falló).'));
            }),
            switchMap((resp) => {
              const code = resp?.meta?.statusCode ?? 0;
              if (code >= 200 && code < 300) {
                return [resp];
              }
              return throwError(() => new Error(resp?.message || 'No se pudo guardar la presentación (insert falló).'));
            }),
          )
          .subscribe({
            next: (resp) => {
              this.messageService.add({
                severity: 'success',
                summary: 'Guardado',
                detail: resp?.message || 'Presentación guardada correctamente.'
              });
          this.presentacionesService.comboPresentaciones().subscribe({
          next: (response: any) => {

            this.listaPresentaciones = response.data;

          }
        })
            },
            error: (e) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: e?.message || 'No se pudo completar el guardado (falló update o insert).'
              });
              console.error('guardadoPresentacion error:', e);
            }
          });
          this.limpiarCampos();
          this.deshabilitarComponentes();
      }
    });

  }

  eliminarPresentacion() {

    this.confirmationService.confirm({
    message: '¿Está seguro de eliminar la presentacion?\nEsta función actualizará el listado de presentaciones.',
    header: 'Eliminar',
    icon: 'pi pi-question-circle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
      accept: () => {
        this.presentacionesService.eliminarPresentacion(this.id).subscribe({
          next: (response: any) => {

              this.messageService.add({
                severity: 'success',
                summary: 'Eliminada',
                detail: response?.message || 'Presentación eliminada correctamente.'
              });

            this.presentacionesService.comboPresentaciones().subscribe({
              next: (response: any) => {

                this.listaPresentaciones = response.data;

              }
            });
            this.limpiarCampos();
            this.deshabilitarComponentes();
          },
            error: (e) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: e?.message || 'No se pudo completar el eliminado'
              });
              console.error('eliminarPresentacion error:', e);
            }
        });
      }
    });
  }

  toKey(p: Presentacion) { return `${p.id}|${p.codigo}`; }
  formatFecha(iso: string) { return new Date(iso).toLocaleString(); }

  /////////////////////////////////////////////////NUEVA PRESENTACION//////////////////////////////////////////////////
  @Input() visibleNueva = false;
  @Output() cancelarNueva = new EventEmitter<void>();

  public nuevoContenido: string | null = null;
  public nuevaPresentation_id: string = "";
  public nuevaPresentation_name: string = "";
  public nuevaRecipe_reference: string = "";
  public idValidaPresentacionNoObsoleta: string = "";
  public idValidaPresentacionObsoleta: string = "";
  public nuevoC01_id: string = "";
  public comboNuevoContenido: nuevaPresentacion[] = [];

  get nuevaIdValida()        { return this.nuevaPresentation_id.trim().length > 0; }
  get nuevaNombreValida()    { return this.nuevaPresentation_name.trim().length > 0; }
  get nuevaRefValida()       { return this.nuevaRecipe_reference.trim().length > 0; }
  get nuevoContenidoValido() { return !!this.nuevoContenido && this.nuevoContenido !== '-'; }

  get puedeCrearNueva() {
    return this.nuevaIdValida && this.nuevaNombreValida && this.nuevaRefValida && this.nuevoContenidoValido;
  }

  get opcionesContenidoNueva() {
    return [{ component_id: '-', contenido: '-' }, ...(this.contenidoDD ?? [])];
  }

  private resetNueva() {
    this.nuevaPresentation_id = '';
    this.nuevaPresentation_name = '';
    this.nuevaRecipe_reference = '';
    this.nuevoContenido = null;
  }

  onCancelarNueva() {
    this.resetNueva();
    this.cancelarNueva.emit();
    this.visibleNueva = false;
  }

  cargarNuevoContenido() {

    this.presentacionesService.obtenerContenido().subscribe({
      next: (response: any) => {

        this.comboNuevoContenido = response.data;

      }

    })

  }

  onNuevaPresentacionSeleccionada(event: any): void {
    const valor = event?.value ?? null;

    this.nuevoC01_id = valor;
  }

  public async validaPresentacionObsoleta(): Promise<void> {

    const response = await this.presentacionesService.validaPresentacionObsoleta(this.nuevaPresentation_id).toPromise();
    this.idValidaPresentacionObsoleta = response?.data || "";
  }

  public actualizaPresentacionExistente(): void {

    this.presentacionesService.actualizaPresentacionExistente(this.nuevaPresentation_id).subscribe({
      next: (response: any) => {

        this.toast.add({
          severity: 'success',
          summary: 'Crear',
          detail: 'Presentacion Actualizada'
        });
        this.resetNueva();
        this.presentacionesService.comboPresentaciones().subscribe({
          next: (response: any) => {

            this.listaPresentaciones = response.data;

          }
        })
      }
    })

  }

  public creaNuevaPresentacion(): void {

    this.presentacionesService.creaNuevaPresentacion(
      this.nuevaPresentation_id,
      this.nuevaPresentation_name,
      this.nuevaRecipe_reference,
      this.nuevoC01_id
    ).subscribe({
      next: (response: any) => {

        this.toast.add({
          severity: 'success',
          summary: 'Presentacion creada',
          detail: 'La Presentacion fue creada exitosamente.'
        });
        this.resetNueva();
        this.presentacionesService.comboPresentaciones().subscribe({
          next: (response: any) => {

            this.listaPresentaciones = response.data;

          }
        })
      },
      error: (error) => {
        console.error('Error al crear presentacion: ', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la presentacion.',
          life: 3000
        });
      }
    });

  }

  // Crear nueva presentación
  public async crearNuevaPresentacion(): Promise<void> {

    const response = await this.presentacionesService.validaPresentacionNoObsoleta(this.nuevaPresentation_id).toPromise();
    this.idValidaPresentacionNoObsoleta = response?.data;
    if (this.idValidaPresentacionNoObsoleta == null) {
      await this.validaPresentacionObsoleta();

      if(this.idValidaPresentacionObsoleta != "") {

        this.confirmationService.confirm({

          message: 'Identificador existente como obsoleto. ¿Desea restablecer el registro para realizar modificaciones?',
          header: 'Confirmacion',
          icon: 'pi pi-question-circle',
          acceptLabel: 'Si',
          rejectLabel: 'No',
          acceptButtonStyleClass: 'p-button-success',
          rejectButtonStyleClass: 'p-button-secondary',
          accept: () => {
            this.actualizaPresentacionExistente();
          },
          reject: () => {

          }
        });

      }else{

        this.creaNuevaPresentacion();
      }

    }else {

        this.messageService.add({
          severity: 'info',
          summary: 'Crear',
          detail: 'Identificador existente. Verifique la información e intente nuevamente.',
          life: 3000,
        });

    }

  }

}