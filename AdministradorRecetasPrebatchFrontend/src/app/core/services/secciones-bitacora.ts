import { ReportConcItem } from '../../interfaces/ReporteIndividual';
import { ReportLogItem } from '../../interfaces/ReporteBitacora';

/** Secciones de pdfMake. Nunca inventa datos faltantes del SCADA. */
export function crearSeccionesBitacora(
  concentrados: ReportConcItem[],
  eventos: ReportLogItem[]
): any[] {
  const titulo = (text: string) => ({
    text, bold: true, fontSize: 10, margin: [0, 12, 0, 5]
  });
  const fmt = (v: number | null | undefined) =>
    v == null ? 'Pendiente SCADA' : new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(v);
  const pad = (n: number) => String(n).padStart(2, '0');
  const segundos = (v: number | null | undefined) => {
    if (v == null) return 'Pendiente SCADA';
    const s = Math.max(0, Math.round(v));
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  };
  const paso: Record<number, string> = {
    1: 'Iniciado',
    2: 'Agua cargada',
    3: 'Concentrados agregados',
    4: 'Agitación concluida',
    5: 'Concentrados transferidos'
  };

  const porPos = new Map<number, ReportConcItem[]>();
  for (const c of concentrados) {
    if (c.pos <= 0 || !c.id || c.id === '-') continue;
    const x = porPos.get(c.pos) ?? [];
    x.push(c);
    porPos.set(c.pos, x);
  }
  const posiciones = Array.from(new Set([
    ...porPos.keys(), ...eventos.map(e => e.position)
  ])).sort((a, b) => a - b);

  const resumen: any[][] = [[
    'Posición', 'Componentes', 'Duración', 'Ciclos'
  ].map(text => ({ text, bold: true, fillColor: '#F1F3F5' }))];
  for (const pos of posiciones) {
    const relacionados = eventos.filter(e => e.position === pos);
    const terminados = relacionados.filter(e => e.step === 5 && e.durationSeconds != null);
    const ciclos = new Set(relacionados.map(e => e.cycleNumber).filter(v => v != null));
    const nombres = (porPos.get(pos) ?? []).map(c => c.name).filter(Boolean).join(', ');
    resumen.push([
      String(pos), nombres || 'Sin asignación',
      terminados.length
        ? segundos(terminados.reduce((total, e) => total + (e.durationSeconds ?? 0), 0))
        : 'Pendiente SCADA',
      ciclos.size ? String(ciclos.size) : 'Pendiente SCADA'
    ]);
  }
  if (resumen.length === 1) {
    resumen.push([{ text: 'Sin posiciones', colSpan: 4 }, {}, {}, {}]);
  }

  const bitacora: any[][] = [[
    'Hora', 'Pos.', 'Componente', 'Unidad', 'Paso', 'Ciclo', 'Agua (kg)', 'Meta (kg)'
  ].map(text => ({ text, bold: true, fillColor: '#F1F3F5' }))];
  for (const e of eventos) {
    const hora = /\d{2}:\d{2}:\d{2}/.exec(e.updateTime)?.[0] ?? '-';
    const componentes = (porPos.get(e.position) ?? []).map(c => c.name).join(', ');
    bitacora.push([
      hora, String(e.position), componentes || '-', e.unitName || 'Pendiente',
      paso[e.step] ?? `Paso ${e.step}`,
      e.cycleNumber == null ? 'Pendiente' : String(e.cycleNumber),
      fmt(e.actualWaterKg), fmt(e.metaKg)
    ]);
  }
  if (bitacora.length === 1) {
    bitacora.push([{ text: 'No hay eventos guardados', colSpan: 8 }, {}, {}, {}, {}, {}, {}, {}]);
  }

  const estiloTabla = {
    hLineColor: '#E1E4E8', vLineColor: '#E1E4E8',
    fillColor: (i: number) => i > 0 && i % 2 === 0 ? '#FAFAFA' : null,
    paddingTop: () => 4, paddingBottom: () => 4
  };

  return [
    titulo('COMPONENTES POR POSICIÓN DE TRANSFERENCIA'),
    {
      table: { headerRows: 1, widths: [47, '*', 99, 83], body: resumen },
      layout: estiloTabla, fontSize: 8
    },
    titulo('BITÁCORA DE PROCESAMIENTO'),
    {
      table: {
        headerRows: 1,
        widths: [42, 24, 82, 46, 81, 36, 67, 66],
        body: bitacora
      },
      layout: estiloTabla, fontSize: 7
    },
    {
      text: 'Pendiente SCADA = información histórica no disponible. ' +
        'Agua y meta reales no se deducen del valor configurado en el inicio. ' +
        'La duración y los ciclos se mostrarán cuando el SCADA los registre.',
      italics: true, color: '#686868', fontSize: 8, margin: [0, 5, 0, 8]
    }
  ];
}
