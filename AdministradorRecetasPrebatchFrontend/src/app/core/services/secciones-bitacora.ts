import { ReportConcItem, ReportPosItem } from '../../interfaces/ReporteIndividual';
import { ReportLogItem } from '../../interfaces/ReporteBitacora';

/**
 * Secciones exclusivamente nuevas para el reporte de disolución.
 * Una posición ocupa UNA sola fila en el resumen, aunque tenga varios componentes.
 * Los eventos de inicio NO significan que un ciclo haya concluido.
 */
export interface SeccionesBitacora {
  resumen: any[];
  bitacora: any[];
}

export function crearSeccionesBitacora(
  concentrados: ReportConcItem[],
  posicionesRegistradas: ReportPosItem[],
  eventos: ReportLogItem[]
): SeccionesBitacora {
  const titulo = (text: string) => ({
    text, bold: true, fontSize: 10, margin: [0, 10, 0, 4]
  });
  const columna = (text: string) => ({
    text, bold: true, color: '#344054', fillColor: '#EEF2F6'
  });
  const formato = (value: number, decimales = 2) =>
    new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales
    }).format(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  const duracion = (valor: number) => {
    const seg = Math.max(0, Math.round(valor));
    return `${pad(Math.floor(seg / 3600))}:${pad(Math.floor((seg % 3600) / 60))}:${pad(seg % 60)}`;
  };
  const hora = (valor: string) => /\d{2}:\d{2}:\d{2}/.exec(valor ?? '')?.[0] ?? '—';

  const componentes = new Map<number, ReportConcItem[]>();
  for (const c of concentrados) {
    if (!Number.isFinite(c.pos) || c.pos <= 0 || !c.id || c.id === '-') continue;
    const arr = componentes.get(c.pos) ?? [];
    arr.push(c);
    componentes.set(c.pos, arr);
  }

  const posiciones = new Map<number, ReportPosItem>();
  for (const p of posicionesRegistradas) {
    if (!Number.isFinite(p.position) || p.position <= 0) continue;
    const anterior = posiciones.get(p.position);
    // Algunos procesos tienen varios renglones de avance por una misma posición.
    // No sustituir el valor de agua registrado por otro renglón con cero.
    if (!anterior || (p.water > 0 && anterior.water <= 0)) {
      posiciones.set(p.position, p);
    }
  }

  const eventosPorPosicion = new Map<number, ReportLogItem[]>();
  for (const e of eventos) {
    if (!Number.isFinite(e.position) || e.position <= 0) continue;
    const arr = eventosPorPosicion.get(e.position) ?? [];
    arr.push(e);
    eventosPorPosicion.set(e.position, arr);
  }

  const numeros = [...new Set<number>([
    ...componentes.keys(), ...posiciones.keys(), ...eventosPorPosicion.keys()
  ])].sort((a, b) => a - b);

  // Una posición por fila. Cada concentrado conserva su ID, descripción y
  // masa INDIVIDUAL tal como la devolvió reportConc (sin sumar ni recalcular).
  const cuerpoResumen: any[][] = [[
    columna('Pos.'), columna('Concentrados y masa'), columna('Procesamiento'),
    columna('Agua (L)'), columna('Duración'), columna('Ciclos')
  ]];

  for (const pos of numeros) {
    const comps = componentes.get(pos) ?? [];
    const registro = posiciones.get(pos);
    const historial = eventosPorPosicion.get(pos) ?? [];
    const transferencias = historial.filter(e => e.step === 5);
    const duraciones = transferencias.filter(e => e.durationSeconds != null);
    const ciclosConcluidos = new Set(transferencias
      .map(e => e.cycleNumber)
      .filter((v): v is number => v != null && v > 0));

    // No sumar tiempo sin cierre, ni inferir ciclos de los eventos step=1.
    const tiempo = duraciones.length === transferencias.length && duraciones.length > 0
      ? duracion(duraciones.reduce((s, e) => s + (e.durationSeconds ?? 0), 0))
      : 'Pendiente SCADA';
    const ciclos = ciclosConcluidos.size > 0 ? String(ciclosConcluidos.size) : 'Pendiente SCADA';
    const estado = registro?.manual ? 'Omitido'
      : transferencias.length ? 'Transferido'
      : (registro || historial.length) ? 'Registrado' : 'Sin registro';

    // Minilista dentro de una sola celda: facilita distinguir dos o más
    // concentrados en la MISMA posición sin repetir estado, agua ni ciclos.
    // La masa NO se multiplica por unidades porque se conserva el valor que
    // originalmente mostraba la tabla CONCENTRADOS.
    const detalleConcentrados: any = comps.length ? {
      table: {
        widths: ['*', 52],
        body: comps.map(c => [
          {
            stack: [
              { text: c.id, bold: true, fontSize: 7.1, color: '#885533' },
              { text: c.name || '—', fontSize: 7.7, color: '#253035' }
            ],
            margin: [0, 1, 3, 1]
          },
          {
            text: `${formato(c.mass)} kg`,
            alignment: 'right',
            noWrap: true,
            fontSize: 7.5,
            color: '#253035',
            margin: [0, 3, 0, 1]
          }
        ])
      },
      layout: {
        hLineWidth: (i: number) => i > 0 && i < comps.length ? 0.4 : 0,
        vLineWidth: () => 0,
        hLineColor: () => '#DDD9D3',
        paddingTop: () => 1,
        paddingBottom: () => 1,
        paddingLeft: () => 0,
        paddingRight: () => 0
      }
    } : { text: '—', color: '#77838F' };

    cuerpoResumen.push([
      { text: String(pos), alignment: 'center' },
      detalleConcentrados,
      { text: estado, alignment: 'center' },
      { text: registro ? `${formato(registro.water)} L` : '—', alignment: 'right' },
      { text: tiempo, alignment: 'center', color: tiempo === 'Pendiente SCADA' ? '#667085' : '#344054' },
      { text: ciclos, alignment: 'center', color: ciclos === 'Pendiente SCADA' ? '#667085' : '#344054' }
    ]);
  }

  if (!numeros.length) {
    cuerpoResumen.push([
      { text: 'No hay posiciones registradas para este proceso', colSpan: 6 },
      {}, {}, {}, {}, {}
    ]);
  }

  const estiloTabla = {
    hLineColor: '#D9E0E8',
    vLineColor: '#D9E0E8',
    fillColor: (i: number) => i > 0 && i % 2 === 0 ? '#FAFBFC' : null,
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 4,
    paddingBottom: () => 4
  };

  const resumen: any[] = [
    titulo('POSICIONES Y CONCENTRADOS'),
    {
      table: {
        headerRows: 1,
        widths: [29, '*', 75, 68, 75, 61],
        dontBreakRows: true,
        body: cuerpoResumen
      },
      layout: estiloTabla,
      fontSize: 8.2,
      margin: [0, 0, 0, 2]
    },
    {
      text: 'Agua: valor registrado por posición (no necesariamente dosificado). Duración y ciclos: pendientes de SCADA.',
      italics: true,
      color: '#667085',
      fontSize: 7.5,
      margin: [0, 2, 0, 2]
    }
  ];

  const ordenados = [...eventos].sort((a, b) =>
    (a.updateTime ?? '').localeCompare(b.updateTime ?? '') || a.position - b.position || a.step - b.step
  );

  if (!ordenados.length) {
    return {
      resumen,
      bitacora: [
        titulo('BITÁCORA DE PROCESAMIENTO'),
        { text: 'Sin eventos históricos registrados para este proceso.', color: '#667085', fontSize: 8.5 }
      ]
    };
  }

  const nombresPaso: Record<number, string> = {
    1: 'Iniciado', 2: 'Agua cargada', 3: 'Concentrados agregados',
    4: 'Agitación concluida', 5: 'Concentrados transferidos'
  };
  // Conservar la BITÁCORA COMPLETA, incluso si SCADA solamente registró
  // eventos de inicio (step=1). Es una cronología, no un resumen de posiciones.
  // El agua del resumen es distinta del agua real de cada evento.
  const cuerpoBitacora: any[][] = [[
    columna('Hora'), columna('Pos.'), columna('Componente'),
    columna('Unidad'), columna('Paso'), columna('Ciclo'),
    columna('Agua (kg)'), columna('Meta (kg)')
  ]];

  for (const e of ordenados) {
    const nombres = (componentes.get(e.position) ?? [])
      .map(c => c.name)
      .filter(Boolean)
      .join(', ') || '—';

    cuerpoBitacora.push([
      hora(e.updateTime),
      { text: String(e.position), alignment: 'center' },
      nombres,
      e.unitName || 'Pendiente',
      nombresPaso[e.step] ?? `Paso ${e.step}`,
      { text: e.cycleNumber == null ? 'Pendiente' : String(e.cycleNumber), alignment: 'center' },
      {
        text: e.actualWaterKg == null ? 'Pendiente SCADA' : formato(e.actualWaterKg, 4),
        alignment: 'right'
      },
      {
        text: e.metaKg == null ? 'Pendiente SCADA' : formato(e.metaKg, 4),
        alignment: 'right'
      }
    ]);
  }

  return {
    resumen,
    bitacora: [
      titulo('BITÁCORA DE PROCESAMIENTO'),
      {
        table: {
          headerRows: 1,
          widths: [44, 27, 110, 52, 84, 42, 69, 69],
          dontBreakRows: true,
          body: cuerpoBitacora
        },
        fontSize: 7.3,
        layout: estiloTabla,
        margin: [0, 0, 0, 3]
      },
      {
        text: 'Pendiente SCADA: dato histórico no disponible. El agua por posición no se asume dosificada en cada evento.',
        italics: true,
        color: '#667085',
        fontSize: 7.2,
        margin: [0, 2, 0, 4]
      }
    ]
  };
}
