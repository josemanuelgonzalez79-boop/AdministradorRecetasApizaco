import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponseDTO } from '../../../interfaces/ApiResponse';
import { enviroment } from '../../../../enviroments/enviroment';
import { GuardaPresentacion } from '../../../interfaces/GuardaPresentacion';


@Injectable({
  providedIn: 'root'
})

export class PresentacionesService{

    private presentacionesUrl = `${enviroment.apiUrl}/api/v1/recetPrebatch/`;

    constructor(private http: HttpClient) {}

    comboPresentaciones(): Observable<ApiResponseDTO>{

        const comboUrl = `${this.presentacionesUrl}comboPresentations`;

        return this.http.get<ApiResponseDTO>(comboUrl);
    }

    propiedadesPresentacion(id: string): Observable<ApiResponseDTO>{

        const propiedadesUrl = `${this.presentacionesUrl}propertiesPresentation?id=${id}`;

        return this.http.post<ApiResponseDTO>(propiedadesUrl,{});
    }

    obtenerContenido(): Observable<ApiResponseDTO> {

        const contenidoUrl = `${this.presentacionesUrl}getContent`;

        return this.http.get<ApiResponseDTO>(contenidoUrl);
    }

    contenidoSegmentado(id: string): Observable<ApiResponseDTO> {

        const segmentadoUrl = `${this.presentacionesUrl}segmentedContent?id=${id}`;

        return this.http.post<ApiResponseDTO>(segmentadoUrl,{});
    }

    contenidPreCargado(id: string): Observable<ApiResponseDTO> {

        const segmentadoUrl = `${this.presentacionesUrl}preloadedContent?id=${id}`;

        return this.http.post<ApiResponseDTO>(segmentadoUrl,{});
    }

    actualizaGuardadoPresentacion(id: string): Observable<ApiResponseDTO> {

        const actualizaGuardadoUrl = `${this.presentacionesUrl}updatesSavedPresentations?id=${id}`;

        return this.http.post<ApiResponseDTO>(actualizaGuardadoUrl,{});
    }

    guardadoPresentacion(body: GuardaPresentacion): Observable<ApiResponseDTO> {

        const presentacionUrl = `${this.presentacionesUrl}savePresentation`;

        return this.http.post<ApiResponseDTO>(presentacionUrl,body);
    }

    eliminarPresentacion(id: string): Observable<ApiResponseDTO> {

        const presentacionUrl = `${this.presentacionesUrl}deletePresentations?id=${id}`;

        return this.http.post<ApiResponseDTO>(presentacionUrl,{});
    }

    validaPresentacionNoObsoleta(presentation_id: string): Observable<ApiResponseDTO> {

        const presentacionNoObsoletaUrl = `${this.presentacionesUrl}validatePresentationsNoObsolete`;

        return this.http.post<ApiResponseDTO>(presentacionNoObsoletaUrl,{presentation_id});
    }

    validaPresentacionObsoleta(presentation_id: string): Observable<ApiResponseDTO> {

        const presentacionObsoletaUrl = `${this.presentacionesUrl}validatePresentationsObsolete`;

        return this.http.post<ApiResponseDTO>(presentacionObsoletaUrl,{presentation_id});
    }

    creaNuevaPresentacion(nuevaPresentation_id: string, nuevaPresentation_name: string, nuevaRecipe_reference: string, nuevoC01_id: string): Observable<ApiResponseDTO> {

        const presentacionObsoletaUrl = `${this.presentacionesUrl}createNewPresentation`;

        return this.http.post<ApiResponseDTO>(presentacionObsoletaUrl,{nuevaPresentation_id, nuevaPresentation_name, nuevaRecipe_reference, nuevoC01_id } );
    }

    actualizaPresentacionExistente(presentation_id: string): Observable<ApiResponseDTO> {

        const presentacionExistenteUrl = `${this.presentacionesUrl}updateExistingPresentation`;

        return this.http.post<ApiResponseDTO>(presentacionExistenteUrl,{presentation_id});
    }

}