import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import { ReportePdfService } from './reporte-pdf.service';
import { crearSeccionesBitacora } from './secciones-bitacora';
import { ReportMain, ReportConcItem, ReportPosItem } from '../../interfaces/ReporteIndividual';
import { ReportLogItem } from '../../interfaces/ReporteBitacora';

/**
 * Adaptador para no reemplazar el generador actual de pdfMake.
 * Sustituye la tabla POSICIONES por un resumen consolidado y agrega
 * la bitácora únicamente con información histórica verificable.
 */
@Injectable({ providedIn: 'root' })
export class ReporteBitacoraPdfService {
  constructor(private readonly pdfActual: ReportePdfService) {}

  async previewOneDetailed(
    main: ReportMain,
    conc: ReportConcItem[],
    pos: ReportPosItem[],
    eventos: ReportLogItem[]
  ): Promise<void> {
    // Método del generador existente: private en TypeScript, presente en runtime.
    const generador = (this.pdfActual as any).docOneDetailed;
    if (typeof generador !== 'function') {
      throw new Error('No se encontró el generador del reporte detallado');
    }

    // Se pasa [] para mantener excluidos los códigos de barras.
    const documento = await generador.call(this.pdfActual, main, conc, pos, []);
    if (!documento || !Array.isArray(documento.content)) {
      throw new Error('Formato inesperado del reporte de disolución');
    }

    const secciones = crearSeccionesBitacora(conc, pos, eventos);
    const indicePosiciones = documento.content.findIndex((elemento: any) =>
      elemento && typeof elemento.text === 'string' && elemento.text.trim() === 'POSICIONES'
    );
    if (indicePosiciones < 0 || !documento.content[indicePosiciones + 1]?.table) {
      // Evitar duplicar posiciones si cambia la estructura del generador original.
      throw new Error('No fue posible ubicar la tabla POSICIONES para consolidarla');
    }

    // Reemplaza exactamente el título y la tabla original, no la información
    // de receta, los concentrados ni las advertencias de validación.
    documento.content.splice(indicePosiciones, 2, ...secciones.resumen);
    documento.content.push(...secciones.bitacora);
    pdfMake.createPdf(documento).open();
  }
}
