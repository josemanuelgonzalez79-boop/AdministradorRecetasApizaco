import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Componentes } from '../../interfaces/componente';
import { componenteCompleto } from '../../interfaces/componenteCompleto';
import { validaEliminar } from '../../interfaces/validaEliminar';
import { ApiResponseDTO } from '../../interfaces/ApiResponse';
import { GuardaComponente } from '../../interfaces/GuardaComponente';
import { enviroment } from '../../../enviroments/enviroment';

export { Componentes };

@Injectable({
  providedIn: 'root'
})

export class ComponentsService {

  private fullComponentUrl = `${enviroment.apiUrl}/api/v1/recetPrebatch/`;

  constructor(private http: HttpClient) {}

  obtenerComponentes(): Observable<Componentes[]> {
    const getComponentUrl = `${this.fullComponentUrl}getComponent`;

    return this.http.get<Componentes[]>(getComponentUrl);
  }

  obtenerComponentesCompleto(id: string): Observable<componenteCompleto> {
    const fullComponentUrl = `${this.fullComponentUrl}getFullComponent`;

    return this.http.post<componenteCompleto>(fullComponentUrl, { id });
  }

  validaBtnEliminar(id: string): Observable<validaEliminar> {
    const validaEliminarUrl = `${this.fullComponentUrl}validateDelete`;

    return this.http.post<validaEliminar>(validaEliminarUrl, { id });
  }

  eliminar(id: string): Observable<ApiResponseDTO> {
    const eliminarUrl = `${this.fullComponentUrl}deleteComponent`;

    return this.http.post<ApiResponseDTO>(eliminarUrl,{ id });
  }

  validaNoObsoleto(id: string): Observable<ApiResponseDTO> {
    const validaNoObsoletoUrl = `${this.fullComponentUrl}validaNoObsoleto`;

    return this.http.post<ApiResponseDTO>(validaNoObsoletoUrl,{ id });
  }

  validaObsoleto(id: string): Observable<ApiResponseDTO> {
    const validaObsoletoUrl = `${this.fullComponentUrl}validaObsoleto`;

    return this.http.post<ApiResponseDTO>(validaObsoletoUrl, { id });
  }

  creaComponente(id: string, name: string, reference: string, type: string): Observable<ApiResponseDTO> {
    const creaComponenteUrl = `${this.fullComponentUrl}createComponent`;

    return this.http.post<ApiResponseDTO>(creaComponenteUrl, {id,name,reference,type});
  }

  actualizaComponente(id: string): Observable<ApiResponseDTO> {
    const actualizaComponenteUrl = `${this.fullComponentUrl}updateComponentExists`;
    
    return this.http.post<ApiResponseDTO>(actualizaComponenteUrl, { id });
  }

  guardaComponente(guardaComponente: GuardaComponente): Observable<ApiResponseDTO>{
    const guardaComponenteUrl = `${this.fullComponentUrl}saveComponent`;

    return this.http.post<ApiResponseDTO>(guardaComponenteUrl, guardaComponente);
  }

  actualizaGuardadoComponente( id: string): Observable <ApiResponseDTO>{
    const actualizaGuardadoUrl = `${this.fullComponentUrl}updatedComponentSaved`;

    return this.http.post<ApiResponseDTO>(actualizaGuardadoUrl, {id})
  }

}