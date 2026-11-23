import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import { vfs } from 'pdfmake/build/vfs_fonts';
import {
  ReportMain,
  ReportConcItem,
  ReportPosItem,
  ReportBarcodeItem
} from '../../../../src/app/interfaces/ReporteIndividual';

(pdfMake as any).vfs = vfs;

export interface ProcesoRow {
  fecha: Date;
  processId: number;
  prebatch: number;
  recipeId: string;
  name: string;
  tankName: string;
  sucroseAccum: number;
  fructoseAccum: number;
  waterAccum: number;
}

type CanvasLine = {
  type: 'line';
  x1: number; y1: number; x2: number; y2: number;
  lineWidth?: number;
  lineColor?: string;
};

type CanvasPolyline = {
  type: 'polyline';
  points: { x: number; y: number; }[];
  closePath?: boolean;
  color?: string;
  lineColor?: string;
  lineWidth?: number;
};

type CanvasEllipse = {
  type: 'ellipse';
  x: number; y: number; r1: number; r2: number;
  color?: string;
  lineColor?: string;
  lineWidth?: number;
};

type CanvasCommand = CanvasLine | CanvasPolyline | CanvasEllipse;

type CanvasIcon = {
  width: number;
  height: number;
  canvas: CanvasCommand[];
};

@Injectable({ providedIn: 'root' })
export class ReportePdfService {

  private logoDataUrlCache?: string;
  private imageCache = new Map<string, string>();
  private logoCache = new Map<string, string>();


  async preview(procesos: ProcesoRow[], ini: Date, fin: Date) {
    const docDef = await this.docDefinition(procesos, ini, fin);
    pdfMake.createPdf(docDef).open();
  }

  async print(procesos: ProcesoRow[], ini: Date, fin: Date) {
    const docDef = await this.docDefinition(procesos, ini, fin);
    pdfMake.createPdf(docDef).print();
  }

  async previewOne(row: ProcesoRow) {
    const def = await this.docDefinitionOne(row);
    pdfMake.createPdf(def).open();
  }

  // recibe también los códigos de barras normalizados
  async previewOneDetailed(
    main: ReportMain,
    conc: ReportConcItem[],
    pos: ReportPosItem[],
    barcodes: ReportBarcodeItem[] = []
  ) {
    const def = await this.docOneDetailed(main, conc, pos, barcodes);
    pdfMake.createPdf(def).open();
  }

  private async loadImage(path: string): Promise<string | null> {
    if (this.imageCache.has(path)) {
      return this.imageCache.get(path)!;
    }

    try {
      const response = await fetch(path);
      if (!response.ok) {
        console.error(`No se pudo cargar la imagen: ${path}`);
        return null;
      }
      const blob = await response.blob();

      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          this.imageCache.set(path, base64);
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error('Error al cargar imagen', path, err);
      return null;
    }
  }

  //   REPORTE INDIVIDUAL DETALLADO
  private async docOneDetailed(
    main: ReportMain,
    conc: ReportConcItem[],
    pos: ReportPosItem[],
    barcodes: ReportBarcodeItem[] = []
  ) {

    const load = async (path: string) =>
      (this as any).loadImage ? this.loadImage(path) : this.loadLogo(path);

    // Carga de imágenes
    const logo        = await load('assets/LOGO-ICAP.png');
    const logoFemsa        = await load('assets/cocaFemsa.png');

    const iconUser    = await load('assets/user.png');
    const iconClock   = await load('assets/clock.png');
    const iconBeaker  = await load('assets/beaker.png');
    const iconTank    = await load('assets/tank.png');

    const iconBrix    = await load('assets/brix.png');
    const iconDensity = await load('assets/density.png');
    const iconScale   = await load('assets/scale.png');
    const iconVolume  = await load('assets/water.png');
    const iconWater   = await load('assets/water.png');
    const iconFruct   = await load('assets/fructosa.png');
    const iconSuc     = await load('assets/sacarosa.png');

    const iconOk      = await load('assets/check.png');
    const iconNo      = await load('assets/cross.png');
    const iconWarn    = await load('assets/warn.png');

    const iconProcHdr = await load('assets/procesamiento.png');
    const iconPosHdr  = await load('assets/posicion.png');

    // Helpers numéricos/fechas
    const num = (v: number, dec = 2) =>
      new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec
      }).format(v ?? 0);

    const pad = (n: number) => String(n).padStart(2, '0');
    const fmtDate = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const fmtTime = (d: Date) =>
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const fmtDateTimeFull = (d: Date) => `${fmtDate(d)} ${fmtTime(d)}`;
    const fmtDuration = (start: Date, end: Date) => {
      let ms = Math.max(0, end.getTime() - start.getTime());
      const h = Math.floor(ms / 3_600_000);  ms %= 3_600_000;
      const m = Math.floor(ms /   60_000);   ms %=   60_000;
      const s = Math.floor(ms /    1_000);
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    };

    // consecutivo SIEMPRE 4 dígitos (con ceros a la izquierda)
    const fmtSerial4 = (s: number | string | null | undefined): string => {
      const raw = s == null ? '' : String(s);
      if (!raw) return '';
      return raw.padStart(4, '0');
    };

    // helper visual: icono + texto
    const iconLabel = (
      imgDataUrl: string | null | undefined,
      text: string,
      iconW = 11,
      gap = 6
    ) => ({
      table: {
        widths: [iconW, '*'],
        body: [[
          imgDataUrl != null
            ? { image: imgDataUrl, width: iconW, margin: [0, 1, 0, 0] }
            : { text: '' },
          { text, margin: [gap, 0, 0, 0] }
        ]]
      },
      layout: 'noBorders'
    });

    // Map posiciones
    const posByPosition = new Map<number, ReportPosItem>();
    pos.forEach(p => posByPosition.set(p.position, p));

    // Header / footer
    const header = (currentPage: number, pageCount: number) => ({
      margin: [30, 20, 30, 16],
      stack: [
        {
          table: {
            widths: [140, '*', 110],
            body: [[
              logoFemsa ? { image: logoFemsa, width: 120 } : { text: '' },
              {
                text: `PROCESO DE DISOLUCIÓN ${main.processId}`,
                alignment: 'center',
                bold: true,
                fontSize: 14,
                margin: [0, 16, 0, 0]
              },
              {
                text: fmtDate(main.startTime),
                alignment: 'right',
                margin: [0, 6, 0, 0]
              }
            ]]
          },
          layout: 'noBorders'
        },
        {
          canvas: [{
            type: 'line', x1: 0, y1: 4, x2: 535, y2: 4,
            lineWidth: 1, lineColor: '#DADADA'
          }],
          margin: [0, 2, 0, 0]
        }
      ]
    });

    const footer = (currentPage: number, pageCount: number) => ({
      margin: [30, 0, 30, 10],
      columns: [
        { text: `Prebatch ${main.prebatch} hacia el ${main.tankName}`, alignment: 'left' },
        { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right' }
      ]
    });

    // Título + básicos
    const title = {
      text: `[${main.recipeId}] ${main.name} - ${main.units}U`,
      style: 'title',
      margin: [0, 16, 0, 12]
    };

    const basicsTop = {
      columns: [
        { ...iconLabel(iconUser,   `Usuario: ${main.userName?.toUpperCase() || '-'}`, 11, -3) },
        { ...iconLabel(iconBeaker, `Prebatch ${main.prebatch || '-'}`, 11, -3) },
        { ...iconLabel(iconTank,   `${main.tankName || '-'}`, 11, -3), margin: [12, 0, 0, 0] },
      ]
    };

    const basicsBottom = {
      columns: [
        { ...iconLabel(iconClock, `Fecha inicio: ${fmtDateTimeFull(main.startTime)}`, 11, -3) },
        {
          ...iconLabel(iconClock, `Fecha fin: ${fmtDateTimeFull(main.finishTime)}`, 11, -3),
          alignment: 'center'
        },
        {
          ...iconLabel(iconClock, `Duración: ${fmtDuration(main.startTime, main.finishTime)}`, 11, -3),
          margin: [12, 0, 0, 0]
        },
      ],
      margin: [0, 4, 0, 10]
    };

    const compCell = (
      meta: number | null | undefined,
      actual: number | null | undefined,
      unit: string,
      dec = 2
    ) => {
      const hasMeta = meta !== null && meta !== undefined;
      const hasAct  = actual !== null && actual !== undefined;

      const txt = hasAct ? `${num(actual ?? 0, dec)} ${unit}` : '';
      let fill: string | undefined;

      if (hasMeta && hasAct && (meta ?? 0) > 0) {
        const m = meta ?? 0;
        const a = actual ?? 0;
        const factor   = Math.pow(10, dec);
        const mRounded = Math.round(m * factor) / factor;
        const aRounded = Math.round(a * factor) / factor;
        fill = aRounded >= mRounded ? '#E8F5E9' : '#FFEBEE';
      }

      return { text: txt, alignment: 'right', fillColor: fill };
    };

    // DATOS DE RECETA
    const recetaHeader = {
      text: 'DATOS DE RECETA',
      style: 'section',
      margin: [0, 0, 0, 2]
    };

    const recetaTable = {
      table: {
        headerRows: 1,
        widths: [190, 140, 160],
        body: [
          [
            { text: '', bold: true, fillColor: '#F3F3F3' },
            { text: 'Meta', bold: true, alignment: 'center', fillColor: '#F3F3F3' },
            { text: 'Cumplimiento', bold: true, alignment: 'center', fillColor: '#F3F3F3' }
          ],
          [ iconLabel(iconBrix, 'Brix'),        { text: `${num(main.brix, 2)} °Bx`, alignment: 'right' }, { text: '', alignment:'right' } ],
          [ iconLabel(iconDensity, 'Densidad'), { text: `${num(main.density, 6)} g/cm³`, alignment: 'right' }, { text: '', alignment:'right' } ],
          [ iconLabel(iconScale, 'Masa (kg)'),  { text: `${num(main.massSetpoint, 2)} kg`, alignment: 'right' }, compCell(main.massSetpoint,    main.massAccum,    'kg') ],
          [ iconLabel(iconVolume, 'Volumen (L)'),{ text: `${num(main.volumeSetpoint, 2)} L`, alignment: 'right' }, compCell(main.volumeSetpoint,  main.volumeAccum,  'L') ],
          [ iconLabel(iconSuc, 'Sacarosa (kg)'),{ text: `${num(main.sucroseSetpoint, 2)} kg`, alignment: 'right' }, compCell(main.sucroseSetpoint, main.sucroseAccum, 'kg') ],
          [ iconLabel(iconFruct, 'Fructosa (kg)'),{ text: `${num(main.fructoseSetpoint, 2)} kg`, alignment: 'right' }, compCell(main.fructoseSetpoint,main.fructoseAccum,'kg') ],
          [ iconLabel(iconWater, 'Agua (kg)'),  { text: `${num(main.waterSetpoint, 2)} kg`, alignment: 'right' }, compCell(main.waterSetpoint,   main.waterAccum,   'kg') ],
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex % 2 ? '#FAFAFA' : null),
        hLineColor: '#E0E0E0',
        vLineColor: '#E0E0E0',
        paddingTop: () => 4,
        paddingBottom: () => 4
      },
      margin: [0, 4, 0, 12]
    };

    // CONCENTRADOS
    const concHeader = conc.length
      ? { text: 'CONCENTRADOS', style: 'section', margin: [0, 0, 0, 2] }
      : null;

    const concTable = conc.length ? {
      table: {
        headerRows: 1,
        widths: [90, '*', 90, 70],
        body: [
          [
            { text: 'Material', bold: true, fillColor: '#F3F3F3' },
            { text: 'Nombre', bold: true, fillColor: '#F3F3F3' },
            { text: 'Masa', bold: true, alignment: 'right', fillColor: '#F3F3F3' },
            { text: 'Posición', bold: true, alignment: 'center', fillColor: '#F3F3F3' }
          ],
          ...conc.map(c => {
            const posExists = c.pos > 0 && posByPosition.has(c.pos);
            const masaCell = {
              text: `${num(c.mass)} kg`,
              alignment: 'right',
              color: posExists ? undefined : '#9e9e9e'
            };
            return [c.id, c.name, masaCell, { text: String(c.pos), alignment: 'center' }];
          })
        ]
      },
      layout: {
        fillColor: (rowIndex: number) =>
          (rowIndex === 0 ? null : rowIndex % 2 ? '#FAFAFA' : null),
        hLineColor: '#E0E0E0',
        vLineColor: '#E0E0E0',
        paddingTop: () => 4,
        paddingBottom: () => 4
      },
      margin: [0, 4, 0, 10]
    } : null;

    // POSICIONES
    const posicionesHeader = {
      text: 'POSICIONES',
      style: 'section',
      margin: [0, 6, 0, 2],
      keepWithTable: true
    } as any;

    // agrupar conc por posición
    const grupos = new Map<number, ReportConcItem[]>();
    conc.filter(c => c.id && c.id !== '-' && c.pos > 0).forEach(c => {
      if (!grupos.has(c.pos)) grupos.set(c.pos, []);
      grupos.get(c.pos)!.push(c);
    });
    if (grupos.size === 0 && pos.length) {
      pos.forEach(p => { if (!grupos.has(p.position)) grupos.set(p.position, []); });
    }

    const posicionesBody: any[] = [[
      {
        table: {
          widths: [12, '*'],
          body: [[
            (iconPosHdr ? { image: iconPosHdr, width: 11, margin: [0, 0, -3, 0] } : { text: '' }),
            { text: 'Posición', bold: true }
          ]]
        },
        layout: 'noBorders',
        alignment: 'center',
        fillColor: '#F3F3F3'
      },
      {
        table: {
          widths: [12, '*'],
          body: [[
            (iconProcHdr ? { image: iconProcHdr, width: 11, margin: [0, 0, -29, 0] } : { text: '' }),
            { text: 'Procesamiento', bold: true }
          ]]
        },
        layout: 'noBorders',
        alignment: 'center',
        fillColor: '#F3F3F3'
      },
      { ...iconLabel(iconWater, 'Agua'), fillColor: '#F3F3F3' }
    ]];

    const orden = Array.from(grupos.keys()).sort((a, b) => a - b);
    orden.forEach(posKey => {
      const items = grupos.get(posKey)!;
      const rowspan = Math.max(items.length, 1);

      const found = posByPosition.get(posKey);
      let label = 'No';
      let stateIcon = iconNo;
      if (found) {
        if (found.manual) { label = 'Omitido'; stateIcon = iconWarn; }
        else              { label = 'Sí';      stateIcon = iconOk;   }
      }
      const agua = `${num(found?.water ?? 0)} L`;

      posicionesBody.push([
        { text: String(posKey), alignment: 'center', rowSpan: rowspan } as any,
        {
          table: {
            widths: [12, '*'],
            body: [[
              stateIcon ? { image: stateIcon, width: 11, margin: [0, 0, -70, 0] } : { text: '' },
              { text: label }
            ]]
          },
          layout: 'noBorders',
          alignment: 'center',
          rowSpan: rowspan
        } as any,
        { text: agua, alignment: 'right', rowSpan: rowspan } as any
      ]);

      for (let i = 1; i < rowspan; i++) {
        posicionesBody.push([{ text: '' } as any, { text: '' } as any, { text: '' } as any]);
      }
    });

    const posicionesTable = {
      table: {
        headerRows: 1,
        widths: [70, 160, 100],
        body: posicionesBody as any[][]
      },
      layout: {
        fillColor: (rowIndex: number) =>
          (rowIndex === 0 ? null : rowIndex % 2 ? '#FAFAFA' : null),
        hLineColor: '#E0E0E0',
        vLineColor: '#E0E0E0',
        paddingTop: () => 4,
        paddingBottom: () => 4,
        dontBreakRows: true
      }
    };

    // Validación general
    const concPositions = new Set(orden);
    const posPositions  = new Set(Array.from(posByPosition.keys()));
    const faltaValidacion =
      concPositions.size > 0 &&
      Array.from(concPositions).some(p => !posPositions.has(p));

    const advertencia = faltaValidacion
      ? {
          text: 'RECETA SIN VALIDACIÓN CORRECTA DE CONCENTRADOS',
          color: 'red',
          bold: true,
          margin: [0, 6, 0, 0]
        }
      : null;

    const barcodeBlocks: any[] = [];

    if (barcodes && barcodes.length) {
      barcodeBlocks.push({
        text: 'VALIDACIÓN DE CÓDIGOS DE BARRA',
        style: 'section',
        margin: [0, 10, 0, 2],
        pageBreak: 'before'
      });

      type GroupData = {
        componentRef: string;
        presentationId: string;
        presentationName: string;
        captures: number;
        units: number;
        items: ReportBarcodeItem[];
      };

      const groups = new Map<string, GroupData>();

      for (const b of barcodes) {
        const key = `${b.componentRef}||${b.presentationId}`;
        let g = groups.get(key);
        if (!g) {
          g = {
            componentRef: b.componentRef,
            presentationId: b.presentationId,
            presentationName: b.presentationName,
            captures: b.captures,
            units: b.units,
            items: []
          };
          groups.set(key, g);
        }
        g.items.push(b);
      }

      // ordenar grupos por componente y presentación
      const groupKeys = Array.from(groups.keys()).sort((a, b) => {
        const [ca, pa] = a.split('||');
        const [cb, pb] = b.split('||');
        if (ca === cb) return pa.localeCompare(pb);
        return ca.localeCompare(cb);
      });

      for (const key of groupKeys) {
        const g = groups.get(key)!;

        // Encabezado por presentación (Caja Parte 1A, Parte 1B, etc.)
        barcodeBlocks.push({
          text: `[${g.componentRef}] ${g.presentationName}`,
          bold: true,
          margin: [0, 4, 0, 0]
        });

        barcodeBlocks.push({
          text: `Unidades: ${num(g.units, 0)}    Capturas: ${g.captures}`,
          margin: [0, 0, 0, 2]
        });

        // Tabla con los códigos
        barcodeBlocks.push({
          table: {
            headerRows: 1,
            widths: [90, 90, 70, 70],
            body: [
              [
                { text: 'Presentación', bold: true, fillColor: '#F3F3F3' },
                { text: 'Lote',         bold: true, fillColor: '#F3F3F3' },
                { text: 'Caducidad',    bold: true, fillColor: '#F3F3F3' },
                { text: 'Consecutivo',  bold: true, fillColor: '#F3F3F3' }
              ],
              ...g.items.map(it => ([
                it.presentationId,
                String(it.presentationBatch ?? ''),
                String(it.presentationExpiration ?? ''),
                fmtSerial4(it.presentationSerial)
              ]))
            ]
          },
          layout: {
            fillColor: (rowIndex: number) =>
              (rowIndex === 0 ? null : rowIndex % 2 ? '#FAFAFA' : null),
            hLineColor: '#E0E0E0',
            vLineColor: '#E0E0E0',
            paddingTop: () => 4,
            paddingBottom: () => 4
          },
          margin: [0, 2, 0, 6]
        });
      }
    }

    // DocDef
    return {
      pageSize: 'LETTER',
      pageMargins: [30, 96, 30, 40],
      header,
      footer,
      content: [
        title,
        basicsTop,
        basicsBottom,
        recetaHeader,
        recetaTable,
        ...(concHeader ? [concHeader, concTable] : []),
        posicionesHeader,
        posicionesTable,
        ...(advertencia ? [advertencia] : []),
        ...barcodeBlocks
      ],
      styles: {
        title: { fontSize: 12, bold: true },
        section: { bold: true, margin: [0, 8, 0, 4] }
      }
    } as any;
  }

  //   LOGO
  private async loadLogo(path: string): Promise<string | undefined> {
    const cached = this.logoCache.get(path);
    if (cached) return cached;

    try {
      const resp = await fetch(path, { cache: 'no-store' });
      if (!resp.ok) return undefined;

      const blob = await resp.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      this.logoCache.set(path, dataUrl);
      return dataUrl;
    } catch {
      return undefined;
    }
  }


  async printOne(row: ProcesoRow) {
    const def = await this.docDefinitionOne(row);
    pdfMake.createPdf(def).print();
  }

  private async docDefinitionOne(row: ProcesoRow) {
    const logo = await this.loadLogo('assets/LOGO-ICAP.png');
    const logoFemsa = await this.loadLogo('assets/cocaFemsa.png');

    const fmtDate = (d: Date) =>
      new Intl.DateTimeFormat('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(d);

    const fmtTime = (d: Date) =>
      new Intl.DateTimeFormat('es-MX', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(d);

    const num = (v: number) =>
      new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(v ?? 0);

    return {
      pageSize: 'LETTER',
      pageMargins: [30, 60, 30, 40],
      header: {
        margin: [30, 15, 30, 10],
        columns: [
          logoFemsa ? { image: logoFemsa, width: 120 } : { text: '' },
          {
            text: `PROCESO DE DISOLUCIÓN ${row.processId}`,
            alignment: 'center',
            bold: true,
            fontSize: 14
          },
          { text: fmtDate(new Date()), alignment: 'right' }
        ]
      },
      footer: {
        margin: [30, 0, 30, 10],
        columns: [
          { text: `Prebatch ${row.prebatch} hacia el ${row.tankName}`, alignment: 'left' },
          { text: 'Sistemas de disolución prebatch', alignment: 'right' }
        ]
      },
      content: [
        { text: `[${row.recipeId}] ${row.name}`, style: 'title', margin: [0, 0, 0, 8] },
        {
          columns: [
            { text: `Fecha: ${fmtDate(new Date(row.fecha))}` },
            {
              text: `Hora: ${fmtTime(new Date(row.fecha))}`,
              alignment: 'center'
            },
            { text: `Tanque: ${row.tankName}`, alignment: 'right' },
          ],
          margin: [0, 0, 0, 10]
        },
        { text: 'Datos de proceso', style: 'section' },
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'Sacarosa (kg)', bold: true },
                { text: 'Fructosa (kg)', bold: true },
                { text: 'Agua (kg)', bold: true }
              ],
              [
                num(row.sucroseAccum),
                num(row.fructoseAccum),
                num(row.waterAccum)
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 4, 0, 12]
        },
      ],
      styles: {
        title: { fontSize: 12, bold: true },
        section: { bold: true, margin: [0, 8, 0, 4] }
      }
    } as any;
  }

  private async docDefinition(procesos: ProcesoRow[], ini: Date, fin: Date) {
    const logo = await this.loadLogo('assets/LOGO-ICAP.png');
    const logoFemsa = await this.loadLogo('assets/cocaFemsa.png');

    const fmtDate = (d: Date) =>
      new Intl.DateTimeFormat('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(d);

    const fmtDateTime = (d: Date) =>
      new Intl.DateTimeFormat('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(d);

    const num = (v: number) =>
      new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(v ?? 0);

    const body = [
      [
        { text: 'Tiempo', bold: true },
        { text: 'Folio', bold: true },
        { text: 'PB', bold: true },
        { text: 'Codigo', bold: true },
        { text: 'Nombre', bold: true },
        { text: 'Tanque', bold: true },
        { text: 'Sacarosa', bold: true },
        { text: 'Fructosa', bold: true },
        { text: 'Agua',   bold: true },
      ],
      ...procesos.map(r => ([
        fmtDateTime(r.fecha),
        String(r.processId),
        String(r.prebatch),
        r.recipeId,
        r.name,
        r.tankName,
        num(r.sucroseAccum),
        num(r.fructoseAccum),
        num(r.waterAccum),
      ])),
    ];

    return {
      pageSize: 'LETTER',
      pageOrientation: 'landscape',
      pageMargins: [30, 84, 30, 40],
      header: (currentPage: number, pageCount: number) => ({
        margin: [30, 20, 30, 0],
        columns: [
          //logoFemsa ? { image: logoFemsa, width: 120 } : { text: '' }
          logoFemsa ? { image: logoFemsa, fit: [118, 59] } : { text: '' },

          {
            alignment: 'center',
            stack: [
              { text: 'PROCESOS DE DISOLUCIÓN', bold: true, fontSize: 14 },
              {
                text: `Desde el ${fmtDate(ini)} hasta el ${fmtDate(fin)}`,
                margin: [0, 2, 0, 0]
              },
            ]
          },
          {
            alignment: 'right',
            text: `Página ${currentPage} de ${pageCount}`,
          },
        ]
      }),
      footer: () => ({
        margin: [30, 0, 30, 10],
        columns: [
          { text: 'Sistemas de disolución prebatch', alignment: 'left' },
          { text: new Date().toLocaleDateString('es-MX'), alignment: 'right' }
        ]
      }),
      content: [
        {
          table: {
            headerRows: 1,
            widths: [100, 25, 25, 90, 120, 60, 60, 60, 60],
            body
          },
          layout: {
            fillColor: (rowIndex: number) =>
              (rowIndex === 0 ? '#f0f0f0' : null),
            hLineColor: '#e0e0e0',
            vLineColor: '#e0e0e0'
          }
        }
      ],
      defaultStyle: {
        fontSize: 9
      }
    } as any;
  }

}