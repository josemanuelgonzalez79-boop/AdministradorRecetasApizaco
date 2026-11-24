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
    eventos: ReportLogItem[],
    descargar = false
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
    const indicePosiciones = contenido.findIndex(e => tituloDe(e) === 'POSICIONES');
    if (indicePosiciones < 0 || !contenido[indicePosiciones + 1]?.table) {
      throw new Error('No se encontró la tabla POSICIONES original; se canceló el PDF para evitar duplicados');
    }

    const secciones = crearSeccionesBitacora(conc, pos, eventos);
    // El reporte base aún construye CONCENTRADOS y POSICIONES por separado.
    // Eliminamos POSICIONES primero para no alterar el índice de CONCENTRADOS.
    contenido.splice(indicePosiciones, 2);
    const indiceConcentrados = contenido.findIndex(e => tituloDe(e) === 'CONCENTRADOS');
    if (indiceConcentrados >= 0) {
      if (!contenido[indiceConcentrados + 1]?.table) {
        throw new Error('La sección CONCENTRADOS original no tiene tabla');
      }
      contenido.splice(indiceConcentrados, 2, ...secciones.resumen);
    } else {
      // Un reporte sin componentes todavía conserva sus posiciones/eventos.
      contenido.splice(indicePosiciones, 0, ...secciones.resumen);
    }

    const titulosAntiguos = new Set([
      'COMPONENTES POR POSICIÓN DE TRANSFERENCIA',
      'RESUMEN DE POSICIONES DE TRANSFERENCIA',
      'POSICIONES Y COMPONENTES',
      'BITÁCORA DE PROCESAMIENTO'
    ]);
    for (let i = contenido.length - 1; i >= 0; i--) {
      if (!titulosAntiguos.has(tituloDe(contenido[i]) ?? '')) continue;
      contenido.splice(i, Math.min(2, contenido.length - i));
    }
    contenido.push(...secciones.bitacora);

    const titulos = contenido.map(tituloDe).filter((v): v is string => v != null);
    const cantidad = titulos.filter(t => t === 'POSICIONES Y CONCENTRADOS').length;
    const antigua = titulos.some(t => t === 'POSICIONES' || t === 'CONCENTRADOS' ||
      t === 'POSICIONES Y COMPONENTES' || t === 'COMPONENTES POR POSICIÓN DE TRANSFERENCIA');
    const bitacoras = titulos.filter(t => t === 'BITÁCORA DE PROCESAMIENTO').length;
    if (cantidad !== 1 || antigua || bitacoras !== 1) {
      throw new Error('Validación del reporte: se detectaron secciones repetidas; PDF no generado');
    }

    // Se mantiene la vista previa con doble clic y se agrega descarga nombrada.
    mejorarEstiloReporteDisolucion(documento, main, secciones);
    // El bloque fusionado pasa a la primera hoja, debajo de DATOS DE RECETA.
    // La bitácora se mantiene completa y comienza en hoja aparte para facilitar
    // su lectura, sin alterar el contenido ni el orden cronológico.
    delete secciones.resumen[0].pageBreak;
    if (secciones.bitacora[0]) secciones.bitacora[0].pageBreak = 'before';
    this.ajustarAlineacion(documento, secciones);
    this.quitarNotasBajoTablas(documento, secciones);
    const nombre = `Proceso_Disolucion_${main.processId}.pdf`;
    documento.info = {
      ...(documento.info ?? {}),
      title: nombre.replace(/\.pdf$/i, ''),
      subject: `Reporte de disolución ${main.processId}`,
      creator: 'Administrador de Recetas ICAP'
    };
    const pdf = pdfMake.createPdf(documento);
    if (descargar) pdf.download(nombre);
    else pdf.open();
  }

  /** Las notas pequeñas debajo de las tres tablas sobran en la versión imprimible. */
  private quitarNotasBajoTablas(documento: any, secciones: {
    resumen: any[];
    bitacora: any[];
  }): void {
    // La nota posterior a datos de receta la inserta estilo-reporte-pdf.
    const texto = (x: any): string => typeof x?.text === 'string' ? x.text.trim() : '';
    const notasSecciones = new Set<any>([
      ...secciones.resumen.filter(x => x?.italics),
      ...secciones.bitacora.filter(x => x?.italics)
    ]);
    documento.content = (documento.content ?? []).filter((elemento: any) => {
      if (notasSecciones.has(elemento)) return false;
      const valor = texto(elemento);
      return !valor.startsWith('Dif. % = ') &&
             !valor.startsWith('Agua: valor registrado por posición') &&
             !valor.startsWith('—: información no capturada');
    });
  }

  /**
   * Datos básicos en rejilla común y ajustes de alineación:
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

    // La corrección de fecha final NO depende de iconos ni tablas anidadas:
    // una única tabla de 3 columnas presenta ambas filas con idénticas coordenadas.
    if (indiceDatos >= 3) {
      const superior = elementos[indiceDatos - 2];
      const inferior = elementos[indiceDatos - 1];
      const texto = (fila: any, i: number): string => {
        const resultado = fila?.columns?.[i]?.table?.body?.[0]?.[1]?.text;
        return typeof resultado === 'string' ? resultado : '';
      };
      const completos = [superior, inferior].every(fila =>
        Array.isArray(fila?.columns) && fila.columns.length === 3 &&
        [0, 1, 2].every(i => texto(fila, i).length > 0)
      );
      if (completos) {
        const datos = [
          [texto(superior, 0).replace(/^Usuario:\s*/i, ''),
           texto(superior, 1).replace(/^Prebatch\s*/i, ''), texto(superior, 2)],
          [texto(inferior, 0).replace(/^Fecha inicio:\s*/i, ''),
           texto(inferior, 1).replace(/^Fecha fin:\s*/i, ''),
           texto(inferior, 2).replace(/^Duración:\s*/i, '')]
        ];
        const etiquetas = [
          ['USUARIO', 'PREBATCH', 'DESTINO'],
          ['FECHA DE INICIO', 'FECHA DE FIN', 'DURACIÓN']
        ];
        // Recuperar los mismos seis pictogramas que ya cargó el generador original.
        // Los guardamos ANTES de sustituir las dos filas antiguas por la ficha.
        const iconos = [superior, inferior].map(fila =>
          [0, 1, 2].map(i => fila.columns[i]?.table?.body?.[0]?.[0]?.image ?? null)
        );
        const celda = (etiqueta: string, valor: string, icono: string | null): any => ({
          columns: [
            icono
              ? { image: icono, width: 12, margin: [0, 3, 0, 0] }
              : { text: '', width: 12 },
            {
              width: '*',
              stack: [
                { text: etiqueta, bold: true, fontSize: 7.3, color: '#885533', margin: [0, 0, 0, 3] },
                { text: valor || '—', fontSize: 9.1, color: '#253035', noWrap: true }
              ]
            }
          ],
          columnGap: 5
        });
        const ficha = {
          table: {
            widths: [166, 166, '*'],
            body: datos.map((fila, j) => fila.map((v, i) =>
              celda(etiquetas[j][i], v, iconos[j][i])
            )),
            dontBreakRows: true
          },
          layout: {
            hLineWidth: (i: number): number => i === 0 || i === 2 ? 0 : 0.5,
            vLineWidth: (i: number): number => i === 0 || i === 3 ? 0 : 0.5,
            hLineColor: (): string => '#DFD6CB',
            vLineColor: (): string => '#DFD6CB',
            fillColor: (i: number): string => i === 0 ? '#F7F3EE' : '#FFFFFF',
            paddingLeft: (): number => 8,
            paddingRight: (): number => 8,
            paddingTop: (): number => 6,
            paddingBottom: (): number => 6
          },
          margin: [0, 4, 0, 9]
        };
        elementos.splice(indiceDatos - 2, 2, ficha);
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
