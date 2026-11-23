import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import { ReportePdfService } from './reporte-pdf.service';
import { crearSeccionesBitacora } from './secciones-bitacora';
import { mejorarEstiloReporteDisolucion } from './estilo-reporte-pdf';
import { ReportMain, ReportConcItem, ReportPosItem } from '../../interfaces/ReporteIndividual';
import { ReportLogItem } from '../../interfaces/ReporteBitacora';

/** Mantiene el PDF existente, unifica posiciones y conserva la bitácora completa. */
@Injectable({ providedIn: 'root' })
export class ReporteBitacoraPdfService {
  constructor(private readonly pdfActual: ReportePdfService) {}

  async previewOneDetailed(
    main: ReportMain,
    conc: ReportConcItem[],
    pos: ReportPosItem[],
    eventos: ReportLogItem[]
  ): Promise<void> {
    const generador = (this.pdfActual as any).docOneDetailed;
    if (typeof generador !== 'function') {
      throw new Error('No se encontró el generador del PDF individual');
    }

    const documento: any = await generador.call(this.pdfActual, main, conc, pos, []);
    if (!documento || !Array.isArray(documento.content)) {
      throw new Error('Formato inesperado del documento PDF individual');
    }

    const tituloDe = (elemento: any): string | null =>
      elemento && typeof elemento.text === 'string'
        ? elemento.text.trim().toUpperCase()
        : null;
    const contenido: any[] = documento.content;
    const indice = contenido.findIndex(e => tituloDe(e) === 'POSICIONES');
    if (indice < 0 || !contenido[indice + 1]?.table) {
      throw new Error('No se encontró la tabla POSICIONES original; se canceló el PDF para evitar duplicados');
    }

    const secciones = crearSeccionesBitacora(conc, pos, eventos);
    contenido.splice(indice, 2, ...secciones.resumen);

    const titulosAntiguos = new Set([
      'COMPONENTES POR POSICIÓN DE TRANSFERENCIA',
      'RESUMEN DE POSICIONES DE TRANSFERENCIA',
      'BITÁCORA DE PROCESAMIENTO'
    ]);
    for (let i = contenido.length - 1; i >= 0; i--) {
      if (!titulosAntiguos.has(tituloDe(contenido[i]) ?? '')) continue;
      contenido.splice(i, Math.min(2, contenido.length - i));
    }
    contenido.push(...secciones.bitacora);

    const titulos = contenido.map(tituloDe).filter((v): v is string => v != null);
    const cantidad = titulos.filter(t => t === 'POSICIONES Y COMPONENTES').length;
    const antigua = titulos.some(t => t === 'POSICIONES' || t === 'COMPONENTES POR POSICIÓN DE TRANSFERENCIA');
    const bitacoras = titulos.filter(t => t === 'BITÁCORA DE PROCESAMIENTO').length;
    if (cantidad !== 1 || antigua || bitacoras !== 1) {
      throw new Error('Validación del reporte: se detectaron secciones repetidas; PDF no generado');
    }

    // Mejoras visuales no invasivas: conserva todas las filas y el PDF imprimible.
    mejorarEstiloReporteDisolucion(documento, main, secciones);
    pdfMake.createPdf(documento).open();
  }
}
