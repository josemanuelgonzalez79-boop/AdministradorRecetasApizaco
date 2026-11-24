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

    // Mantiene el estilo industrial de la versión anterior, sin alterar valores.
    mejorarEstiloReporteDisolucion(documento, main, secciones);
    this.ajustarAlineacion(documento, secciones);
    pdfMake.createPdf(documento).open();
  }

  /**
   * Ajustes puramente visuales del registro técnico V5:
   * - Las dos filas de datos del proceso comparten las mismas 3 columnas.
   * - Icono y texto quedan juntos, especialmente en «Fecha fin».
   * - La bitácora aprovecha el mismo ancho disponible que las otras tablas.
   * - Las cabeceras numéricas siguen la alineación de sus valores.
   */
  private ajustarAlineacion(documento: any, secciones: {
    resumen: any[];
    bitacora: any[];
  }): void {
    const elementos: any[] = documento.content ?? [];
    const indiceDatos = elementos.findIndex((item: any) =>
      typeof item?.text === 'string' &&
      item.text.trim().toUpperCase() === 'DATOS DE RECETA'
    );

    // La estructura del generador actual es:
    // Título, datos superiores, fechas/duración, DATOS DE RECETA.
    // Si cambia el generador en el futuro, no intervenimos otros elementos.
    if (indiceDatos >= 3) {
      const filas = [elementos[indiceDatos - 2], elementos[indiceDatos - 1]];
      for (const fila of filas) {
        if (!Array.isArray(fila?.columns) || fila.columns.length !== 3) continue;
        const resultado: any[] = [];
        let estructuraValida = true;
        for (let index = 0; index < 3; index++) {
          const origen = fila.columns[index];
          const par = origen?.table?.body?.[0];
          if (!Array.isArray(par) || par.length !== 2 || typeof par[1]?.text !== 'string') {
            estructuraValida = false;
            break;
          }
          const iconoOriginal = par[0];
          const icono = iconoOriginal?.image
            ? { image: iconoOriginal.image, width: 11, margin: [0, 1, 0, 0] }
            : { text: '' };
          resultado.push({
            width: index < 2 ? 184 : '*',
            table: {
              widths: [15, '*'],
              body: [[
                icono,
                {
                  text: par[1].text,
                  fontSize: 8.3,
                  color: '#384448',
                  noWrap: true,
                  margin: [0, 0, 0, 0]
                }
              ]]
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: () => 0,
              paddingLeft: () => 0,
              paddingRight: () => 0,
              paddingTop: () => 0,
              paddingBottom: () => 0
            },
            margin: [0, 0, 0, 0]
          });
        }
        if (estructuraValida) {
          fila.columns = resultado;
          fila.columnGap = 0;
          fila.alignment = 'left';
        }
      }
    }

    const resumen = secciones.resumen.find((elemento: any) => elemento?.table);
    if (resumen?.table?.body?.[0]) {
      const cabecera = resumen.table.body[0];
      for (const indice of [0, 4, 5]) {
        if (typeof cabecera[indice] === 'object') cabecera[indice].alignment = 'center';
      }
      if (typeof cabecera[3] === 'object') cabecera[3].alignment = 'right';
    }

    const bitacora = secciones.bitacora.find((elemento: any) => elemento?.table);
    if (bitacora?.table) {
      // 504 pt de columnas + 48 pt de márgenes internos = 552 pt utilizables.
      // Con los márgenes de 30 pt de la página LETTER, coincide con las otras tablas.
      bitacora.table.widths = [42, 25, 119, 50, 85, 40, 70, 73];
      const cabecera = bitacora.table.body?.[0];
      if (Array.isArray(cabecera) && cabecera.length === 8) {
        for (const indice of [1, 3, 5]) {
          if (typeof cabecera[indice] === 'object') cabecera[indice].alignment = 'center';
        }
        for (const indice of [6, 7]) {
          if (typeof cabecera[indice] === 'object') cabecera[indice].alignment = 'right';
        }
      }
    }
  }
}
