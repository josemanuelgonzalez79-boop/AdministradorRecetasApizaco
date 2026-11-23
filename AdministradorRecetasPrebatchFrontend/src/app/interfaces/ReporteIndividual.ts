
export interface ReportMain {
  startTime: Date;
  finishTime: Date;
  processId: number;
  prebatch: number;
  recipeId: string;
  name: string;
  brix: number;
  density: number;
  recipeType: string;
  units: number;
  userName: string;
  tankName: string;
  massSetpoint: number;
  massAccum: number;
  volumeSetpoint: number;
  volumeAccum: number;
  sucroseSetpoint: number;
  sucroseAccum: number;
  fructoseSetpoint: number;
  fructoseAccum: number;
  waterSetpoint: number;
  waterAccum: number;
}

export interface ReportConcItem {
  pos: number;
  id: string;
  name: string;
  mass: number;
}

export interface ReportPosItem {
  position: number;
  manual: boolean;
  water: number;
}

export interface ReportBarcodeItem {
  presentationId: string;
  presentationBatch: number;
  presentationExpiration: string;
  presentationSerial: number;
  componentRef: string;       
  presentationName: string;
  captures: number;
  units: number;
}
