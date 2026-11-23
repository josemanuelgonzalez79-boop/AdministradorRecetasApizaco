import { ReportMain } from '../../interfaces/ReporteIndividual';
import { SeccionesBitacora } from './secciones-bitacora';

/**
 * Acabado visual del reporte individual. Documento pdfMake en memoria.
 * Respeta todos los eventos y los datos entregados por PostgreSQL/SCADA.
 * El PDF queda CLARO incluso si la aplicación está en tema oscuro.
 */
export function mejorarEstiloReporteDisolucion(
  documento: any,
  main: ReportMain,
  secciones: SeccionesBitacora
): void {
  const contenido: any[] = documento.content;
  const MARCA = '#184C80';
  const TEXTO = '#293A50';
  const BORDE = '#DEE7F1';
  const SUAVE = '#F5F8FC';
  const nombrar = (x: any): string => typeof x?.text === 'string'
    ? x.text.trim().toUpperCase() : '';

  documento.pageMargins = [30, 96, 30, 40];
  documento.defaultStyle = { ...(documento.defaultStyle ?? {}), fontSize: 9, color: TEXTO };

  // Mantener logos, fechas y pie original; mejorar contraste de la línea del encabezado.
  if (typeof documento.header === 'function') {
    const headerAnterior = documento.header;
    documento.header = (pagina: number, paginas: number) => {
      const h = headerAnterior(pagina, paginas);
      if (Array.isArray(h?.stack)) {
        for (const elemento of h.stack) {
          if (Array.isArray(elemento?.canvas)) {
            elemento.canvas.forEach((linea: any) => {
              if (linea?.type === 'line') linea.lineColor = '#B8CEE6';
            });
          }
        }
      }
      return h;
    };
  }

  const tituloPrincipal = contenido.find(x => x?.style === 'title');
  if (tituloPrincipal) {
    tituloPrincipal.color = MARCA;
    tituloPrincipal.fontSize = 12.5;
    tituloPrincipal.bold = true;
    tituloPrincipal.margin = [0, 11, 0, 9];
  }

  const seccion = (x: any): void => {
    if (!x) return;
    x.color = MARCA;
    x.bold = true;
    x.fontSize = 10.5;
    x.margin = [0, 10, 0, 5];
  };

  const indexDatos = contenido.findIndex(x => nombrar(x) === 'DATOS DE RECETA');
  if (indexDatos >= 0 && contenido[indexDatos + 1]?.table?.body) {
    seccion(contenido[indexDatos]);
    const anterior: any = contenido[indexDatos + 1];
    const filas: any[][] = anterior.table.body;
    // Mismo número de indicadores, con columna adicional de diferencia informativa.
    const metas = [null, null, main.massSetpoint, main.volumeSetpoint,
      main.sucroseSetpoint, main.fructoseSetpoint, main.waterSetpoint];
    const reales = [null, null, main.massAccum, main.volumeAccum,
      main.sucroseAccum, main.fructoseAccum, main.waterAccum];
    const sinFondo = (celda: any) => {
      if (celda == null) return { text: '—' };
      if (typeof celda !== 'object') return { text: String(celda) };
      const { fillColor, ...resto } = celda;
      return resto;
    };
    const variacion = (meta: number | null, real: number | null): any => {
      if (meta == null || real == null || !Number.isFinite(meta) ||
          !Number.isFinite(real) || meta === 0) {
        return { text: '—', alignment: 'center', color: '#8290A3' };
      }
      const delta = (real - meta) / Math.abs(meta) * 100;
      const factor = Math.abs(delta);
      const porcentaje = new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 1, maximumFractionDigits: 1
      }).format(factor);
      return {
        text: `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${porcentaje}%`,
        alignment: 'right',
        bold: factor >= 10,
        color: factor >= 10 ? '#96551C' : '#536B85',
        fillColor: factor >= 10 ? '#FFF7ED' : undefined
      };
    };
    const cabezal = (texto: string) => ({
      text: texto, color: '#FFF', fillColor: MARCA, bold: true, fontSize: 8.8
    });
    const nuevasFilas: any[][] = [[
      cabezal('Indicador'),
      { ...cabezal('Objetivo'), alignment: 'right' },
      { ...cabezal('Reportado'), alignment: 'right' },
      { ...cabezal('Diferencia'), alignment: 'right' }
    ]];
    for (let i = 1; i < filas.length; i++) {
      const fuente = filas[i];
      const valorMeta = metas[i - 1] ?? null;
      const valorReal = reales[i - 1] ?? null;
      nuevasFilas.push([
        sinFondo(fuente[0]),
        { ...sinFondo(fuente[1]), alignment: 'right' },
        { ...sinFondo(fuente[2]), alignment: 'right' },
        variacion(valorMeta, valorReal)
      ]);
    }
    contenido[indexDatos + 1] = {
      table: { headerRows: 1, widths: [179, 118, 120, 83], body: nuevasFilas },
      layout: {
        hLineColor: BORDE, vLineColor: BORDE,
        fillColor: (fila: number) => fila !== 0 && fila % 2 === 0 ? SUAVE : null,
        paddingTop: () => 3.8, paddingBottom: () => 3.8,
        paddingLeft: () => 5, paddingRight: () => 5
      },
      fontSize: 8.5,
      margin: [0, 3, 0, 3]
    };
    contenido.splice(indexDatos + 2, 0, {
      text: '',
      color: '#6C7D93', italics: true, fontSize: 7.3, margin: [0, 2, 0, 5]
    });
  }

  const indiceConcentrados = contenido.findIndex(x => nombrar(x) === 'CONCENTRADOS');
  if (indiceConcentrados >= 0) {
    seccion(contenido[indiceConcentrados]);
    const tabla = contenido[indiceConcentrados + 1];
    if (tabla?.table) {
      tabla.fontSize = 8.5;
      tabla.margin = [0, 3, 0, 6];
      tabla.layout = {
        hLineColor: BORDE, vLineColor: BORDE,
        fillColor: (fila: number) => fila > 0 && fila % 2 === 0 ? SUAVE : null,
        paddingTop: () => 3.5, paddingBottom: () => 3.5,
        paddingLeft: () => 5, paddingRight: () => 5
      };
      tabla.table.headerRows = 1;
      (tabla.table.body[0] ?? []).forEach((celda: any) => {
        if (typeof celda === 'object') {
          celda.fillColor = '#EAF1F9';
          celda.color = '#244C77';
        }
      });
    }
  }

  const estiloTecnico = (section: any[]): void => {
    const cabecera = section[0];
    seccion(cabecera);
    const tabla = section.find(x => x?.table);
    if (!tabla) return;
    tabla.fontSize = 7.6;
    tabla.margin = [0, 1, 0, 4];
    tabla.table.dontBreakRows = true;
    tabla.table.headerRows = 1;
    tabla.layout = {
      hLineColor: BORDE, vLineColor: BORDE,
      fillColor: (fila: number) => fila > 0 && fila % 2 === 0 ? SUAVE : null,
      paddingTop: () => 4, paddingBottom: () => 4,
      paddingLeft: () => 3, paddingRight: () => 3
    };
    (tabla.table.body[0] ?? []).forEach((celda: any) => {
      if (typeof celda === 'object') {
        celda.fillColor = '#E9F1FA';
        celda.color = '#244C77';
        celda.bold = true;
      }
    });
  };

  estiloTecnico(secciones.resumen);
  estiloTecnico(secciones.bitacora);
  // Zona técnica empieza en hoja 2, sin dividir una tabla al final de hoja 1.
  if (secciones.resumen[0]) secciones.resumen[0].pageBreak = 'before';

  const resumen = secciones.resumen.find(x => x?.table);
  if (resumen) {
    // Menos texto repetitivo y sin marcar como completados los ciclos futuros.
    for (const fila of resumen.table.body.slice(1)) {
      for (const indice of [4, 5]) {
        const celda = fila[indice];
        if (typeof celda === 'object' && celda?.text === 'Pendiente SCADA') {
          celda.text = '—';
          celda.color = '#8794A8';
        }
      }
    }
  }
  const notaResumen = secciones.resumen.find(x => typeof x?.text === 'string' && x.italics);
  if (notaResumen) notaResumen.text = '';

  const bitacora = secciones.bitacora.find(x => x?.table);
  if (bitacora) {
    // 8 columnas, incluida la bitácora COMPLETA; jamás se eliminan eventos.
    bitacora.table.widths = [41, 24, 104, 48, 80, 37, 67, 67];
    for (const fila of bitacora.table.body.slice(1)) {
      for (const celda of fila) {
        if (typeof celda === 'object' && ['Pendiente SCADA', 'Pendiente'].includes(celda.text)) {
          celda.text = '—';
          celda.color = '#8897A9';
        } else if (typeof celda === 'string' && celda === 'Pendiente') {
          const index = fila.indexOf(celda);
          fila[index] = { text: '—', color: '#8897A9' };
        }
      }
    }
  }
  const notaBitacora = secciones.bitacora.find(x => typeof x?.text === 'string' && x.italics);
  if (notaBitacora) notaBitacora.text = '';

  // Las páginas impresas conservan siempre un tema claro y la información original.
}
