package com.icap.services;

import com.icap.dto.ActualizaBrixDTO;
import com.icap.dto.ActualizaCompExistenteDTO;
import com.icap.dto.ActualizaGuardadoComponenteDTO;
import com.icap.dto.ActualizaGuardadoRecetaDTO;
import com.icap.dto.ApiResponseDTO;
import com.icap.dto.ComponenteNoObsoletoDTO;
import com.icap.dto.ComponenteObsolteoDTO;
import com.icap.dto.CreaComponenteDTO;
import com.icap.dto.CreaNuevaReceta;
import com.icap.dto.DeleteComponentDTO;
import com.icap.dto.EliminarRecetaDTO;
import com.icap.dto.FullComponentsDTO;
import com.icap.dto.GuardaComponenteDTO;
import com.icap.dto.GuardaEtiquetasDTO;
import com.icap.dto.GuardaRecetaDTO;
import com.icap.dto.GuardadoPresentacionDTO;
import com.icap.dto.IdPropertiesRec;
import com.icap.dto.NuevaPresentacionDTO;
import com.icap.dto.NuevoUsuarioDTO;
import com.icap.dto.PresentacionExistenteDTO;
import com.icap.dto.PresentacionNoObsoletaDTO;
import com.icap.dto.PresentacionObsoletaDTO;
import com.icap.dto.ProcessIdDTO;
import com.icap.dto.ReportConcDTO;
import com.icap.dto.ReportMainDTO;
import com.icap.dto.ReportPosDTO;
import com.icap.dto.ReporteDTO;
import com.icap.dto.RestauraRecetaObsoletaDTO;
import com.icap.dto.ValidaEtiquetasDTO;
import com.icap.dto.ValidaRecetaExisteDTO;
import com.icap.dto.ValidaRecetaObsoletaDTO;
import com.icap.dto.ValidateDeleteDTO;

import jakarta.servlet.http.HttpServletResponse;

public interface RecetasPrebatchService {

    ///////////////////////////////////////////////////COMPONENTES///////////////////////////////////////////////////////////////////
    
    ApiResponseDTO getComponents();
    ApiResponseDTO getFullComponents(FullComponentsDTO data, HttpServletResponse response);
    ApiResponseDTO validateDelete(ValidateDeleteDTO data, HttpServletResponse response);
    ApiResponseDTO deleteComponent(DeleteComponentDTO data, HttpServletResponse response);
    ApiResponseDTO validaNoObsoleto(ComponenteNoObsoletoDTO data, HttpServletResponse response);
    ApiResponseDTO validaObsoleto(ComponenteObsolteoDTO data, HttpServletResponse response);
    ApiResponseDTO creaComponente(CreaComponenteDTO data, HttpServletResponse response);
    ApiResponseDTO actualizaComponenteExistente(ActualizaCompExistenteDTO data, HttpServletResponse response);
    ApiResponseDTO guardaComponente(GuardaComponenteDTO data, HttpServletResponse response);
    ApiResponseDTO actualizaGuardadoComponente(ActualizaGuardadoComponenteDTO data, HttpServletResponse response);

    //////////////////////////////////////////RECETAS/////////////////////////////////////////////////////////////////////////////////
    
    ApiResponseDTO cargaComboRecetas();
    ApiResponseDTO propiedadesReceta(IdPropertiesRec data, HttpServletResponse response);
    ApiResponseDTO componentsCombo();
    ApiResponseDTO eliminarReceta(EliminarRecetaDTO data, HttpServletResponse response);
    ApiResponseDTO guardaReceta(GuardaRecetaDTO data, HttpServletResponse response);
    ApiResponseDTO actualizaGuardadoReceta(ActualizaGuardadoRecetaDTO data, HttpServletResponse response);
    ApiResponseDTO validaRecetaExistente(ValidaRecetaExisteDTO data, HttpServletResponse response);
    ApiResponseDTO validaRecetaObsoleta(ValidaRecetaObsoletaDTO data, HttpServletResponse response);
    ApiResponseDTO restaurarRecetaObsoleta(RestauraRecetaObsoletaDTO data, HttpServletResponse response);
    ApiResponseDTO creaNuevaReceta(CreaNuevaReceta data, HttpServletResponse response);

    ////////////////////////////////////////REPORTES///////////////////////////////////////////////////////////////////////////////////
    
    ApiResponseDTO datosReporte(ReporteDTO data, HttpServletResponse response);
    ApiResponseDTO reporteMain(ReportMainDTO data, HttpServletResponse response);
    ApiResponseDTO reporteConc(ReportConcDTO data, HttpServletResponse response);
    ApiResponseDTO reportePos(ReportPosDTO data, HttpServletResponse response);
    ApiResponseDTO actualizaBrix(ActualizaBrixDTO data, HttpServletResponse response);
    ApiResponseDTO codigosDeBarraReporte(ProcessIdDTO data, HttpServletResponse response);

    //////////////////////////////////////////////LOGIN////////////////////////////////////////////////////////////////////////////////
    
    ApiResponseDTO consultaUsuarios();
    ApiResponseDTO nuevoUsuario(NuevoUsuarioDTO data, HttpServletResponse response);
    ApiResponseDTO eliminarUsuario(Integer id);
    ApiResponseDTO actualizarUsuario(String username, String pass,String role, Integer id);

    ///////////////////////////////////////////////PRESENTACIONES//////////////////////////////////////////////////////////////////////

    ApiResponseDTO obtenerComboPresentaciones();
    ApiResponseDTO propiedadesPresentacion(String id);
    ApiResponseDTO obtenerContenido();
    ApiResponseDTO contenidoSegmentado(String id);
    ApiResponseDTO contenidoPreCargado(String id);
    ApiResponseDTO guardadoPresentacion(GuardadoPresentacionDTO data, HttpServletResponse response);
    ApiResponseDTO actualizaGuardadoPresentacion(String id);
    ApiResponseDTO eliminarPresentacion(String id);
    ApiResponseDTO validaPresentacionNoObsoleta(PresentacionNoObsoletaDTO data, HttpServletResponse response);
    ApiResponseDTO validaPresentacionObsoleta(PresentacionObsoletaDTO data, HttpServletResponse response);
    ApiResponseDTO crearNuevaPresentacion(NuevaPresentacionDTO data, HttpServletResponse response);
    ApiResponseDTO actualizaPresentacionExistente(PresentacionExistenteDTO data, HttpServletResponse response);


    ApiResponseDTO guardaEtiquetas(GuardaEtiquetasDTO data, HttpServletResponse response);
    ApiResponseDTO validaExisteEtiqueta(ValidaEtiquetasDTO data, HttpServletResponse response);
}