import { ReportConcItem, ReportPosItem } from '../../interfaces/ReporteIndividual';
import { ReportLogItem } from '../../interfaces/ReporteBitacora';

/**
 * La tabla consolidada sustituye POSICIONES y COMPONENTES POR POSICIÓN.
 * La bitácora solo describe eventos realmente guardados en el SCADA.
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
    text,
    bold: true,
    fontSize: 10,
    margin: [0, 10, 0, 4]
  });
  const header = (text: string) => ({
    text,
    bold: true,
    color: '#344054',
    fillColor: '#EEF2F6'
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
  const eventosPorPosicion = new Map<number, ReportLogItem[]>();
  const componentesPorPosicion = new Map<number, ReportConcItem[]>();
  const registroPorPosicion = new Map<number, ReportPosItem>();

  for (const componente of concentrados) {
    if (componente.pos <= 0 || !componente.id || componente.id === '-') continue;
    const grupo = componentesPorPosicion.get(componente.pos) ?? [];
    grupo.push(componente);
    componentesPorPosicion.set(componente.pos, grupo);
  }
  for (const registro of posicionesRegistradas) {
    if (registro.position <= 0) continue;
    const anterior = registroPorPosicion.get(registro.position);
    // Si existen varios pasos, no sobrescribir el agua con eventos sin volumen.
    if (!anterior || (registro.water > 0 && anterior.water <= 0)) {
      registroPorPosicion.set(registro.position, registro);
    }
  }
  for (const evento of eventos) {
    if (evento.position <= 0) continue;
    const grupo = eventosPorPosicion.get(evento.position) ?? [];
    grupo.push(evento);
    eventosPorPosicion.set(evento.position, grupo);
  }

  const numerosPosicion = Array.from(new Set([
    ...componentesPorPosicion.keys(),
    ...registroPorPosicion.keys(),
    ...eventosPorPosicion.keys()
  ])).sort((a, b) => a - b);

  const cuerpoResumen: any[][] = [[
    header('Pos.'), header('Componentes'), header('Procesamiento'),
    header('Agua (L)'), header('Duración'), header('Ciclos')
  ]];

  for (const numero of numerosPosicion) {
    const lista = componentesPorPosicion.get(numero) ?? [];
    const registros = eventosPorPosicion.get(numero) ?? [];
    const estado = registroPorPosicion.get(numero);
    const completas = registros.filter(e => e.step === 5 && e.durationSeconds != null);
    const ciclos = new Set(registros
      .map(e => e.cycleNumber)
      .filter((c): c is number => c != null && c > 0));
    // NULL significa "el SCADA aún no registró este dato"; jamás inventar ciclos.
    const tiempo = completas.length
      ? duracion(completas.reduce((acc, item) => acc + (item.durationSeconds ?? 0), 0))
      : 'Pendiente';
    const estadoTexto = estado?.manual ? 'Omitido'
      : registros.some(e => e.step === 5) ? 'Transferido'
      : estado || registros.length ? 'Registrado' : 'Sin registro';

    cuerpoResumen.push([
      { text: String(numero), alignment: 'center' },
      lista.map(c => c.name).filter(Boolean).join(', ') || '—',
      { text: estadoTexto, alignment: 'center' },
      { text: estado ? `${formato(estado.water)} L` : '—', alignment: 'right' },
      { text: tiempo, alignment: 'center', color: tiempo === 'Pendiente' ? '#667085' : undefined },
      { text: ciclos.size ? String(ciclos.size) : 'Pendiente', alignment: 'center', color: ciclos.size ? undefined : '#667085' }
    ]);
  }
  if (cuerpoResumen.length === 1) {
    cuerpoResumen.push([{ text: 'Sin posiciones registradas', colSpan: 6 }, {}, {}, {}, {}, {}]);
  }

  const estiloTabla = {
    hLineColor: '#D9E0E8',
    vLineColor: '#D9E0E8',
    fillColor: (indice: number) => indice > 0 && indice % 2 === 0 ? '#FAFBFC' : null,
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 4,
    paddingBottom: () => 4
  };

  const resumen: any[] = [
    titulo('RESUMEN DE POSICIONES DE TRANSFERENCIA'),
    {
      table: {
        headerRows: 1,
        widths: [29, '*', 75, 70, 68, 47],
        body: cuerpoResumen
      },
      layout: estiloTabla,
      fontSize: 8,
      margin: [0, 0, 0, 3]
    },
    {
      text: 'Agua (L): valor registrado por posición. Duración y ciclos: pendientes de instrumentación SCADA.',
      italics: true,
      color: '#667085',
      fontSize: 7.5,
      margin: [0, 2, 0, 5]
    }
  ];

  if (!eventos.length) {
    return {
      resumen,
      bitacora: [
        titulo('BITÁCORA DE PROCESAMIENTO'),
        { text: 'Sin eventos históricos registrados para este proceso.', fontSize: 9, color: '#667085' }
      ]
    };
  }

  const ordenados = [...eventos].sort((a, b) =>
    a.updateTime.localeCompare(b.updateTime) || a.position - b.position || a.step - b.step
  );
  const soloInicios = ordenados.every(e => e.step === 1);
  const hora = (valor: string) => /\d{2}:\d{2}:\d{2}/.exec(valor)?.[0] ?? '—';

  // En registros antiguos como el proceso 218 solo hay step=1.
  // No imprimir de nuevo la misma lista de posiciones y componentes.
  if (soloInicios) {
    const primera = hora(ordenados[0].updateTime);
    const ultima = hora(ordenados[ordenados.length - 1].updateTime);
    return {
      resumen,
      bitacora: [
        titulo('BITÁCORA DE PROCESAMIENTO'),
        {
          text: `${ordenados.length} evento(s) de inicio registrados entre ${primera} y ${ultima}. ` +
            'No hay pasos posteriores guardados; la bitácora detallada estará disponible cuando el SCADA los registre.',
          color: '#667085',
          fontSize: 8.5,
          margin: [0, 0, 0, 5]
        }
      ]
    };
  }

  const etiquetasPaso: Record<number, string> = {
    1: 'Iniciado', 2: 'Agua cargada', 3: 'Concentrados agregados',
    4: 'Agitación concluida', 5: 'Concentrados transferidos'
  };
  const cuerpoBitacora: any[][] = [[
    header('Hora'), header('Pos.'), header('Paso'), header('Unidad'),
    header('Ciclo'), header('Agua real (kg)'), header('Meta (kg)')
  ]];
  for (const evento of ordenados) {
    cuerpoBitacora.push([
      hora(evento.updateTime),
      { text: String(evento.position), alignment: 'center' },
      etiquetasPaso[evento.step] ?? `Paso ${evento.step}`,
      evento.unitName ?? '—',
      { text: evento.cycleNumber == null ? '—' : String(evento.cycleNumber), alignment: 'center' },
      { text: evento.actualWaterKg == null ? '—' : formato(evento.actualWaterKg, 4), alignment: 'right' },
      { text: evento.metaKg == null ? '—' : formato(evento.metaKg, 4), alignment: 'right' }
    ]);
  }
  return {
    resumen,
    bitacora: [
      titulo('BITÁCORA DE PROCESAMIENTO'),
      {
        table: {
          headerRows: 1,
          widths: [53, 29, '*', 56, 34, 75, 70],
          body: cuerpoBitacora
        },
        layout: estiloTabla,
        fontSize: 7.5
      },
      {
        text: '— = dato no disponible en SCADA. El agua configurada no se presenta como agua real.',
        color: '#667085',
        italics: true,
        fontSize: 7.5,
        margin: [0, 3, 0, 5]
      }
    ]
  };
}
