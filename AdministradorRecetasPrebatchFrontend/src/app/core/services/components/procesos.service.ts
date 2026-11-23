import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponseDTO } from '../../../interfaces/ApiResponse';
import { enviroment } from '../../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})

export class ReporteService{

    private reporteUrl = `${enviroment.apiUrl}/api/v1/recetPrebatch/`;

    constructor(private http: HttpClient) {}


    datosReporte(fechaInicio: string, fechaFin: string): Observable<ApiResponseDTO>{

        const fullComponentUrl = `${this.reporteUrl}reportData`;

        return this.http.post<ApiResponseDTO>(fullComponentUrl, { fechaInicio,fechaFin });
    }

    reporteMain(processId: string): Observable<ApiResponseDTO> {

      const reporteMainUrl = `${this.reporteUrl}reportMain`;

      return this.http.post<ApiResponseDTO>(reporteMainUrl,{processId});

    }

    reporteConc(processId: string): Observable<ApiResponseDTO> {

      const reporteConc = `${this.reporteUrl}reportConc`;

      return this.http.post<ApiResponseDTO>(reporteConc,{processId});

    }

    reportePos(processId: string): Observable<ApiResponseDTO> {

      const reportePos = `${this.reporteUrl}reportPos`;

      return this.http.post<ApiResponseDTO>(reportePos,{processId});

    }

    actualizaBrix(brix: number, processId: number): Observable<ApiResponseDTO> {

      const brixUrl = `${this.reporteUrl}updateBrix`;

      return this.http.post<ApiResponseDTO>(brixUrl,{ brix, processId });

    }

    reporteBarcodes(processId: string): Observable<ApiResponseDTO> {

      const url = `${this.reporteUrl}barcodes`;

      return this.http.post<ApiResponseDTO>(url, { processId });
      
    }

}