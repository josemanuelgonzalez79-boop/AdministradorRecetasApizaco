import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponseDTO } from '../../../interfaces/ApiResponse';
import { enviroment } from '../../../../enviroments/enviroment';
import { GuardaPresentacion } from '../../../interfaces/GuardaPresentacion';
import { GuardadoEtiquetas } from '../../../interfaces/GuardadoEtiquetas';
import { ValidaEtiquetasPayload } from '../../../interfaces/ValidaExisteEtiquetas';

@Injectable({
  providedIn: 'root'
})

export class HerramientasService{

    private presentacionesUrl = `${enviroment.apiUrl}/api/v1/recetPrebatch/`;

    constructor(private http: HttpClient) {}

    obtenerPresentaciones(): Observable<ApiResponseDTO> {

        const presentacionesUrl = `${this.presentacionesUrl}comboPresentations`;

        return this.http.get<ApiResponseDTO>(presentacionesUrl);
    }

    propiedadesEtiquetas(id: string): Observable<ApiResponseDTO>{

        const propiedadesUrl = `${this.presentacionesUrl}propertiesPresentation?id=${id}`;

        return this.http.post<ApiResponseDTO>(propiedadesUrl,{});
    }

    guardaEtiquetas(guardaEtiquetas: GuardadoEtiquetas): Observable<ApiResponseDTO> {

        const etiquetasUrl = `${this.presentacionesUrl}saveTags`;

        return this.http.post<ApiResponseDTO>(etiquetasUrl,guardaEtiquetas);
    }

    printZpl(body: { zpl: string; copies?: number; printerIp?: string; printerName?: string }) {
        const url = `${this.presentacionesUrl}printZpl`;
        return this.http.post<void>(url, body);
    }

    validaExisteEtiqueta(payload: ValidaEtiquetasPayload): Observable<ApiResponseDTO> {
    const url = `${this.presentacionesUrl}validateExistsTags`;
    return this.http.post<ApiResponseDTO>(url, payload);
    }

    printBrother(body: {
    barcodes: string[];
    ref?: string;
    name?: string;
    copies?: number;
    printerName?: string;
    }) {
    const url = `${this.presentacionesUrl}printBrother`;
    return this.http.post<void>(url, body);
    }

}