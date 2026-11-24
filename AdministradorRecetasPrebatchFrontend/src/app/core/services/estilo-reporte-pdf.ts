import { ReportMain } from '../../interfaces/ReporteIndividual';
import { SeccionesBitacora } from './secciones-bitacora';

export function mejorarEstiloReporteDisolucion(
  documento: any,
  main: ReportMain,
  secciones: SeccionesBitacora
): void {
  if (!documento || !Array.isArray(documento.content)) {
    throw new Error('Documento PDF sin contenido para estilizar');
  }

  const contenido: any[] = documento.content;
  const GRAFITO = '#253035';
  const CARBON = '#30393B';
  const COBRE = '#A6643C';
  const COBRE_OSCURO = '#7F4528';
  const SECUNDARIO = '#65716F';
  const LINEA = '#D9DCD7';
  const ARENA = '#F2EEE7';
  const VAINILLA = '#F8F5F0';
  const BLANCO = '#FFFFFF';

  const nombrar = (obj: any): string =>
    typeof obj?.text === 'string' ? obj.text.trim().toUpperCase() : '';

  const convertirCelda = (celda: any): any => {
    if (celda == null) return { text: '' };
    if (typeof celda !== 'object') return { text: String(celda) };
    const { fillColor, ...sinFondo } = celda;
    return sinFondo;
  };

  const formato = (n: number): string =>
    new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(Math.abs(n));

  const diferencia = (meta: number | null, real: number | null): any => {
    if (meta == null || real == null || !Number.isFinite(meta) ||
        !Number.isFinite(real) || meta === 0) {
      return { text: '—', alignment: 'right', color: SECUNDARIO };
    }
    const valor = ((real - meta) / Math.abs(meta)) * 100;
    return {
      text: `${valor > 0 ? '+' : valor < 0 ? '−' : ''}${formato(valor)}%`,
      color: Math.abs(valor) >= 10 ? COBRE_OSCURO : GRAFITO,
      alignment: 'right',
      bold: Math.abs(valor) >= 10
    };
  };


  const reglas = (opciones?: { cabeceraOscura?: boolean; compacto?: boolean }) => {
    const denso = opciones?.compacto === true;
    return {
      hLineWidth: (i: number): number => i === 0 ? 1.2 : 0.55,
      vLineWidth: (): number => 0.55,
      hLineColor: (i: number): string => i === 0 ? COBRE : LINEA,
      vLineColor: (): string => LINEA,
      paddingTop: (i: number): number => i === 0 ? 5.5 : denso ? 4.1 : 5,
      paddingBottom: (i: number): number => i === 0 ? 5.5 : denso ? 4.1 : 5,
      paddingLeft: (): number => denso ? 4 : 6,
      paddingRight: (): number => denso ? 4 : 6,
      fillColor: (i: number): string => i === 0 ? CARBON : (i % 2 === 0 ? VAINILLA : BLANCO)
    };
  };

  const encabezadoTabla = (tabla: any, _oscuro: boolean): void => {
    const cabezal = tabla?.table?.body?.[0];
    if (!Array.isArray(cabezal)) return;
    for (let i = 0; i < cabezal.length; i++) {
      const celda = convertirCelda(cabezal[i]);
      celda.fillColor = CARBON;
      celda.color = BLANCO;
      celda.bold = true;
      celda.fontSize = 8.2;
      cabezal[i] = celda;
    }
  };

  // Títulos limpios sin numeración, como el formato de tablas anterior.
  const tituloSeccion = (elemento: any, _numero: string): void => {
    if (!elemento || typeof elemento.text !== 'string') return;
    elemento.color = GRAFITO;
    elemento.bold = true;
    elemento.fontSize = 10.2;
    elemento.margin = [0, 12, 0, 5];
    elemento.keepWithNext = true;
  };

  documento.pageMargins = [30, 96, 30, 40];
  documento.defaultStyle = {
    ...(documento.defaultStyle ?? {}),
    fontSize: 8.7,
    color: GRAFITO
  };

  // Encabezado y pie: se conservan los logos de planta y el folio.
  if (typeof documento.header === 'function') {
    const headerOriginal = documento.header;
    documento.header = (pagina: number, paginas: number): any => {
      const h = headerOriginal(pagina, paginas);
      const fila = h?.stack?.[0]?.table?.body?.[0];
      if (Array.isArray(fila) && fila[1] && typeof fila[1] === 'object') {
        fila[1].fontSize = 12;
        fila[1].color = GRAFITO;
        fila[1].bold = true;
      }
      if (Array.isArray(fila) && fila[2] && typeof fila[2] === 'object') {
        fila[2].color = SECUNDARIO;
        fila[2].fontSize = 8.2;
      }
      for (const item of h?.stack ?? []) {
        if (!Array.isArray(item?.canvas)) continue;
        for (const trazo of item.canvas) {
          if (trazo?.type === 'line') {
            trazo.lineColor = COBRE;
            trazo.lineWidth = 1.3;
          }
        }
      }
      return h;
    };
  }
  if (typeof documento.footer === 'function') {
    const footerOriginal = documento.footer;
    documento.footer = (pagina: number, paginas: number): any => {
      const f = footerOriginal(pagina, paginas);
      f.color = SECUNDARIO;
      f.fontSize = 7.6;
      return f;
    };
  }

  const tituloPrincipal = contenido.find(x => x?.style === 'title');
  if (tituloPrincipal) {
    tituloPrincipal.color = GRAFITO;
    tituloPrincipal.fontSize = 12.4;
    tituloPrincipal.bold = true;
    tituloPrincipal.margin = [0, 12, 0, 10];
  }
  const datosBasicos = contenido.filter((c: any) => Array.isArray(c?.columns));
  for (const bloque of datosBasicos.slice(0, 2)) {
    bloque.fontSize = 8.2;
    bloque.color = SECUNDARIO;
  }

  // Datos de receta: tabla comparativa clásica con colores grafito/cobre.
  const indiceDatos = contenido.findIndex(x => nombrar(x) === 'DATOS DE RECETA');
  if (indiceDatos >= 0 && Array.isArray(contenido[indiceDatos + 1]?.table?.body)) {
    tituloSeccion(contenido[indiceDatos], '01');
    const anterior = contenido[indiceDatos + 1];
    const filas: any[][] = anterior.table.body;
    const metas: Array<number | null> = [
      null, null, main.massSetpoint, main.volumeSetpoint,
      main.sucroseSetpoint, main.fructoseSetpoint, main.waterSetpoint
    ];
    const reportados: Array<number | null> = [
      null, null, main.massAccum, main.volumeAccum,
      main.sucroseAccum, main.fructoseAccum, main.waterAccum
    ];
    const cabecera = [
      { text: 'VARIABLE', alignment: 'left' },
      { text: 'OBJETIVO', alignment: 'right' },
      { text: 'REPORTADO', alignment: 'right' },
      { text: 'DIF. %', alignment: 'right' }
    ];
    const filasNuevas: any[][] = [cabecera];
    for (let i = 1; i < filas.length; i++) {
      const fila = filas[i];
      if (!Array.isArray(fila) || fila.length < 3) continue;
      const etiqueta = convertirCelda(fila[0]);
      etiqueta.color = GRAFITO;
      const objetivo = { ...convertirCelda(fila[1]), alignment: 'right' };
      const reportado = { ...convertirCelda(fila[2]), alignment: 'right' };
      filasNuevas.push([
        etiqueta,
        objetivo,
        reportado,
        diferencia(metas[i - 1] ?? null, reportados[i - 1] ?? null)
      ]);
    }
    const tabla = {
      table: {
        headerRows: 1,
        widths: [182, 112, 115, 82],
        dontBreakRows: true,
        body: filasNuevas
      },
      layout: reglas(),
      fontSize: 8.7,
      margin: [0, 2, 0, 3]
    };
    encabezadoTabla(tabla, false);
    contenido[indiceDatos + 1] = tabla;
    contenido.splice(indiceDatos + 2, 0, {
      text: 'Dif. % = (reportado − objetivo) / objetivo × 100. Referencia informativa; no establece conformidad.',
      color: SECUNDARIO,
      fontSize: 7.2,
      italics: true,
      margin: [0, 3, 0, 6]
    });
  }

  // Concentrados: listado tabular para lectura e impresión.
  const indiceConcentrados = contenido.findIndex(x => nombrar(x) === 'CONCENTRADOS');
  if (indiceConcentrados >= 0) {
    tituloSeccion(contenido[indiceConcentrados], '02');
    const tabla = contenido[indiceConcentrados + 1];
    if (tabla?.table && Array.isArray(tabla.table.body)) {
      tabla.table.headerRows = 1;
      tabla.table.dontBreakRows = true;
      tabla.table.widths = [112, '*', 85, 51];
      tabla.fontSize = 8.4;
      tabla.margin = [0, 2, 0, 7];
      tabla.layout = reglas();
      encabezadoTabla(tabla, false);
      for (const fila of tabla.table.body.slice(1)) {
        if (!Array.isArray(fila) || fila.length < 4) continue;
        fila[0] = { ...convertirCelda(fila[0]), bold: true, color: CARBON, fontSize: 8.1 };
        fila[2] = { ...convertirCelda(fila[2]), alignment: 'right' };
        fila[3] = {
          ...convertirCelda(fila[3]), alignment: 'center',
          color: COBRE_OSCURO, bold: true
        };
      }
    }
  }

  // Segunda hoja: conservar la separación deliberada entre secciones.
  if (secciones.resumen[0]) secciones.resumen[0].pageBreak = 'before';

  // Posiciones: resumen tabular, una fila por posición.
  const tituloResumen = secciones.resumen.find(x => typeof x?.text === 'string' && !x?.italics);
  tituloSeccion(tituloResumen, '03');
  const resumen = secciones.resumen.find(x => x?.table);
  if (resumen?.table) {
    resumen.table.headerRows = 1;
    resumen.table.dontBreakRows = true;
    resumen.table.widths = [29, '*', 79, 73, 68, 51];
    resumen.fontSize = 8.15;
    resumen.margin = [0, 2, 0, 7];
    resumen.layout = reglas({ cabeceraOscura: true });
    encabezadoTabla(resumen, true);
    for (const fila of resumen.table.body.slice(1)) {
      if (!Array.isArray(fila)) continue;
      if (fila[0] && typeof fila[0] === 'object') {
        fila[0].bold = true;
        fila[0].color = COBRE_OSCURO;
      }
      for (const indice of [4, 5]) {
        const celda = fila[indice];
        if (celda && typeof celda === 'object' && celda.text === 'Pendiente SCADA') {
          celda.text = '—';
          celda.color = SECUNDARIO;
        }
      }
    }
  }
  const notaResumen = secciones.resumen.find(x => typeof x?.text === 'string' && x.italics);
  if (notaResumen) {
    notaResumen.text = 'Agua: valor registrado por posición. —: duración o ciclos todavía no disponibles en SCADA.';
    notaResumen.color = SECUNDARIO;
    notaResumen.fontSize = 7.4;
    notaResumen.margin = [0, 3, 0, 7];
  }

  // Bitácora: conservar todos los pasos, las ocho columnas y su orden.
  const tituloBitacora = secciones.bitacora.find(x => typeof x?.text === 'string' && !x?.italics);
  tituloSeccion(tituloBitacora, '04');
  const bitacora = secciones.bitacora.find(x => x?.table);
  if (bitacora?.table) {
    bitacora.table.headerRows = 1;
    bitacora.table.dontBreakRows = true;
    bitacora.table.widths = [44, 24, 115, 43, 73, 38, 63, 63];
    bitacora.fontSize = 7.75;
    bitacora.margin = [0, 2, 0, 6];
    bitacora.layout = reglas({ compacto: true });
    encabezadoTabla(bitacora, false);
    for (const fila of bitacora.table.body.slice(1)) {
      if (!Array.isArray(fila)) continue;
      fila[0] = { ...convertirCelda(fila[0]), color: GRAFITO, bold: true };
      for (let i = 1; i < fila.length; i++) {
        const celda = fila[i];
        if (typeof celda === 'string' && ['Pendiente', 'Pendiente SCADA'].includes(celda)) {
          fila[i] = { text: '—', color: SECUNDARIO };
        } else if (celda && typeof celda === 'object' &&
                   ['Pendiente', 'Pendiente SCADA'].includes(celda.text)) {
          celda.text = '—';
          celda.color = SECUNDARIO;
        }
      }
      if (fila[4] && typeof fila[4] === 'object') {
        fila[4].color = COBRE_OSCURO;
      } else if (typeof fila[4] === 'string') {
        fila[4] = { text: fila[4], color: COBRE_OSCURO };
      }
    }
  }
  const notaBitacora = secciones.bitacora.find(x => typeof x?.text === 'string' && x.italics);
  if (notaBitacora) {
    notaBitacora.text = '—: información no capturada. El agua por posición no representa necesariamente la dosificada en un evento.';
    notaBitacora.color = SECUNDARIO;
    notaBitacora.fontSize = 7.4;
    notaBitacora.margin = [0, 4, 0, 6];
  }

  // El documento no se convierte en un certificado de calidad.
  // Se conserva el encabezado, los datos y la bitácora original de la aplicación.
}
