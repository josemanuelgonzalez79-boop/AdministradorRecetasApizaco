/** Datos disponibles y campos reservados para una futura modificación del SCADA. */
export interface ReportLogItem {
  processId: number;
  position: number;
  step: number;
  updateTime: string;
  manual: boolean;
  waterConfigured: number | null;
  unitName: string | null;
  cycleNumber: number | null;
  actualWaterKg: number | null;
  metaKg: number | null;
  durationSeconds: number | null;
}
