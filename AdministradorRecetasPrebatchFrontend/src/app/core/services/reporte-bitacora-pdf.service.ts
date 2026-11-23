import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import { ReportePdfService } from './reporte-pdf.service';
import { crearSeccionesBitacora } from './secciones-bitacora';
import { ReportMain, ReportConcItem, ReportPosItem } from '../../interfaces/ReporteIndividual';
import { ReportLogItem } from '../../interfaces/ReporteBitacora';

/**
 * Adaptador para la generación del PDF detallado con la bitácora.
 * Conserva sin cambios reporte-pdf.service.ts y el formato ya utilizado.
 * Pendiente: al modernizar el servicio original, exponer docOneDetailed
 * con un método público en vez del acceso transitorio por any.
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
    // La implementación existente utiliza un método TypeScript private,
    // pero su visibilidad es de compilación y existe en tiempo de ejecución.
    // Esta adaptación evita sustituir cientos de líneas de código estable.
    const generador = (this.pdfActual as any).docOneDetailed;
    if (typeof generador !== 'function') {
      throw new Error('No se encontró el generador del reporte detallado');
    }
    const documento = await generador.call(this.pdfActual, main, conc, pos, []);
    if (!documento || !Array.isArray(documento.content)) {
      throw new Error('Formato inesperado del reporte de disolución');
    }
    documento.content.push(...crearSeccionesBitacora(conc, eventos));
    pdfMake.createPdf(documento).open();
  }
}
