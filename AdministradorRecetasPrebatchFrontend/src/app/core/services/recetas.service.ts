import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ComboRecetas } from '../../interfaces/ComboRecetas';
import { ApiResponseDTO } from '../../interfaces/ApiResponse';
import { RecipePayload } from '../../interfaces/RecipePayLoad';
import { NuevaReceta } from '../../interfaces/NuevaReceta';
import { enviroment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})

export class RecetasService {

    private recetasUrl = `${enviroment.apiUrl}/api/v1/recetPrebatch/`;

    constructor(private http: HttpClient) {}

    obtenerComboRecetas(): Observable<ApiResponseDTO> {

        const fullComponentUrl = `${this.recetasUrl}loadComboRecipes`;

        return this.http.get<ApiResponseDTO>(fullComponentUrl);

    }

    propiedadesRecetas(id: string): Observable<ApiResponseDTO> {

      const propiedadesUrl = `${this.recetasUrl}propertiesRecipe`;

      return this.http.post<ApiResponseDTO>(propiedadesUrl,{id});

    }

    componentesCombo(): Observable<ApiResponseDTO> {

      const fullComponentUrl = `${this.recetasUrl}componentsCombo`;

      return this.http.get<ApiResponseDTO>(fullComponentUrl);

    }

    eliminarReceta(id: string): Observable<ApiResponseDTO> {

      const eliminarRecetaUrl =  `${this.recetasUrl}deleteRecipe`;

      return this.http.post<ApiResponseDTO>(eliminarRecetaUrl,{id});

    }

    guardarReceta(payload: RecipePayload): Observable<ApiResponseDTO> {

      const guardaRecetaUrl = `${this.recetasUrl}saveRecipe`;

      return this.http.post<ApiResponseDTO>(guardaRecetaUrl,payload);

    }

    actualizaGuardadoReceta(id: string): Observable<ApiResponseDTO> {

      const actualizaGuardaUrl = `${this.recetasUrl}updateSaveRecipe`;

      return this.http.post<ApiResponseDTO>(actualizaGuardaUrl,{id});

    }

  validaExisteReceta(id: string): Observable<ApiResponseDTO> {
    
    const validaIdReceta = `${this.recetasUrl}validateExistsRecipe`;

    return this.http.post<ApiResponseDTO>(validaIdReceta,{id});

  }

  validaRecetaObsoleta(id: string): Observable<ApiResponseDTO> {

    const recetaObsoletaUrl = `${this.recetasUrl}validateRecipeObsolete`;

    return this.http.post<ApiResponseDTO>(recetaObsoletaUrl,{id});

  }

  restaurarRecetaObsoleta(id: string): Observable<ApiResponseDTO> {

    const restaurarRecetaUrl = `${this.recetasUrl}restoreObsoleteRecipe`;

    return this.http.post<ApiResponseDTO>(restaurarRecetaUrl,{id});
  }

  creaNuevaReceta(nuevaReceta: NuevaReceta): Observable<ApiResponseDTO> {

    const nuevaRecetaUrl = `${this.recetasUrl}createNewRecipe`;

        return this.http.post<ApiResponseDTO>(nuevaRecetaUrl,nuevaReceta);

  }

}