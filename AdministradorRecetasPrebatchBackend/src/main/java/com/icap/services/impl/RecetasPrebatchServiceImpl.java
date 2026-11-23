package com.icap.services.impl;

import org.springframework.context.annotation.Bean;
import org.springframework.dao.DataAccessException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.icap.dto.ActualizaBrixDTO;
import com.icap.dto.ActualizaCompExistenteDTO;
import com.icap.dto.ActualizaGuardadoComponenteDTO;
import com.icap.dto.ActualizaGuardadoRecetaDTO;
import com.icap.dto.ApiResponseDTO;
import com.icap.dto.ComponenteNoObsoletoDTO;
import com.icap.dto.ComponenteObsolteoDTO;
import com.icap.dto.ContenidoDTO;
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
import com.icap.dto.UsersDTO;
import com.icap.dto.ValidaEtiquetasDTO;
import com.icap.dto.ValidaRecetaExisteDTO;
import com.icap.dto.ValidaRecetaObsoletaDTO;
import com.icap.dto.ValidateDeleteDTO;
import com.icap.entities.BarcodesReportEntity;
import com.icap.entities.ComponentsCurrentEntity;
import com.icap.entities.ComponentsEntity;
import com.icap.entities.ComponentsFullEntity;
import com.icap.entities.ContenidoEntity;
import com.icap.entities.ContenidoPreCargadoEntity;
import com.icap.entities.ContenidoSegmentadoEntity;
import com.icap.entities.DatosPresentacionEntity;
import com.icap.entities.RecipesEntity;
import com.icap.entities.RecipesFullEntity;
import com.icap.entities.ReportConcEntity;
import com.icap.entities.ReportMainEntity;
import com.icap.entities.ReportPosEntity;
import com.icap.entities.ReporteEntity;
import com.icap.entities.UsuariosEntity;
import com.icap.entities.EliminarEntity;
import com.icap.entities.PresentationEntity;
import com.icap.repositories.RecetasPrebatchRepository;
import com.icap.services.RecetasPrebatchService;
import com.icap.utils.LogUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;

import static com.icap.constants.Estado.FALLO;
import static com.icap.constants.Estado.FINALIZA_TRANSACCION;
import static com.icap.constants.Estado.INICIA_TRANSACCION;
import static com.icap.constants.AppMessages.ACTUALIZABRIX;
import static com.icap.constants.AppMessages.ACTUALIZAGUARDADOCOMPONENTE;
import static com.icap.constants.AppMessages.ACTUALIZAGUARDADOPRESENTACIONES;
import static com.icap.constants.AppMessages.ACTUALIZAGUARDADORECETA;
import static com.icap.constants.AppMessages.ACTUALIZARUSUARIO;
import static com.icap.constants.AppMessages.ALTAARTICULOS;
import static com.icap.constants.AppMessages.BAJAARTICULOS;
import static com.icap.constants.AppMessages.CAMBIOARTICULOS;
import static com.icap.constants.AppMessages.CARGACOMBORECETAS;
import static com.icap.constants.AppMessages.CODIGOSDEBARRA;
import static com.icap.constants.AppMessages.COMBOPRESENTACIONES;
import static com.icap.constants.AppMessages.COMPONENTEEXISTENTE;
import static com.icap.constants.AppMessages.COMPONENTSCOMBO;
import static com.icap.constants.AppMessages.CONSULTAUSUARIOS;
import static com.icap.constants.AppMessages.CONTENIDOPRECARGADO;
import static com.icap.constants.AppMessages.CONTENIDOSEGMENTADO;
import static com.icap.constants.AppMessages.CREACOMPONENTE;
import static com.icap.constants.AppMessages.DATOSREPORTE;
import static com.icap.constants.AppMessages.DELETECOMPONENT;
import static com.icap.constants.AppMessages.ELIMINARPRESENTACION;
import static com.icap.constants.AppMessages.ELIMINARRECETA;
import static com.icap.constants.AppMessages.ELIMINARUSUARIO;
import static com.icap.constants.AppMessages.GUARDACOMPONENTE;
import static com.icap.constants.AppMessages.GUARDADOPRESENTACION;
import static com.icap.constants.AppMessages.GUARDAETIQUETAS;
import static com.icap.constants.AppMessages.GUARDARECETA;
import static com.icap.constants.AppMessages.NUEVAPRESENTACION;
import static com.icap.constants.AppMessages.NUEVOUSUARIO;
import static com.icap.constants.AppMessages.OBTAINCOMPONENTS;
import static com.icap.constants.AppMessages.OBTAINFULLCOMPONENTS;
import static com.icap.constants.AppMessages.OBTENERCONTENIDO;
import static com.icap.constants.AppMessages.PRESENTACIONEXISTENTE;
import static com.icap.constants.AppMessages.PROPIEDADESPRESENTACION;
import static com.icap.constants.AppMessages.PROPIEDADESRECETAS;
import static com.icap.constants.AppMessages.REPORTECONC;
import static com.icap.constants.AppMessages.REPORTEMAIN;
import static com.icap.constants.AppMessages.REPORTEPOS;
import static com.icap.constants.AppMessages.RESTAURARRECETAOBSOLETA;
import static com.icap.constants.AppMessages.VALIDAEXISTEETIQUETAS;
import static com.icap.constants.AppMessages.VALIDANOOBSOLETO;
import static com.icap.constants.AppMessages.VALIDAOBSOLETO;
import static com.icap.constants.AppMessages.VALIDAPRESENTACIONNOOBSOLETA;
import static com.icap.constants.AppMessages.VALIDAPRESENTACIONOBSOLETA;
import static com.icap.constants.AppMessages.VALIDARECETAEXISTA;
import static com.icap.constants.AppMessages.VALIDARECETAOBSOLETA;
import static com.icap.constants.AppMessages.VALIDATEDELETE;
import static com.icap.constants.MetaConstanst.META_ERROR;
import static com.icap.constants.MetaConstanst.META_OK;

import java.util.List;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecetasPrebatchServiceImpl implements RecetasPrebatchService{
    
    private final RecetasPrebatchRepository recetasPrebatchRepository;
    private final LogUtil log;

//////////////////////////////////////////////////////////////////COMPONENTES//////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    public ApiResponseDTO getComponents() {

        log.grabar(INICIA_TRANSACCION, OBTAINCOMPONENTS, "");

        try{

            List<ComponentsEntity> components = recetasPrebatchRepository.getComponents();

            log.grabar(FINALIZA_TRANSACCION, OBTAINCOMPONENTS, "");

            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(components)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, OBTAINCOMPONENTS, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();

        }
    }

    @Override
    public ApiResponseDTO getFullComponents(FullComponentsDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, OBTAINFULLCOMPONENTS, "");

        try{

            ComponentsFullEntity fullComponent = recetasPrebatchRepository.fullComponentes(data.getId());

            log.grabar(FINALIZA_TRANSACCION, OBTAINFULLCOMPONENTS, "");

            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(fullComponent)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, OBTAINFULLCOMPONENTS, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();

        }

    }

    @Override
    public ApiResponseDTO validateDelete(ValidateDeleteDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, VALIDATEDELETE, "");

        try{

            List<EliminarEntity> habilitaEliminar = recetasPrebatchRepository.habilitaEliminar(data.getId());

            log.grabar(FINALIZA_TRANSACCION, VALIDATEDELETE, "");

            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(habilitaEliminar)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, VALIDATEDELETE, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();

        }
    }

    @Override
    @Transactional
    public ApiResponseDTO deleteComponent(DeleteComponentDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, DELETECOMPONENT, "");

        try{

            recetasPrebatchRepository.eliminar(data.getId());

            log.grabar(FINALIZA_TRANSACCION, DELETECOMPONENT, "");

            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, DELETECOMPONENT, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();

        }
    }

    @Override
    public ApiResponseDTO validaNoObsoleto(ComponenteNoObsoletoDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, VALIDANOOBSOLETO, "");
        String validaIdNoObsoleto = "";


        try{

             validaIdNoObsoleto = recetasPrebatchRepository.validaNoObsoleto(data.getId());

        }catch(DataAccessException e){

            log.grabar(FALLO, VALIDANOOBSOLETO, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();

        }

        log.grabar(FINALIZA_TRANSACCION, VALIDANOOBSOLETO, "");
        return ApiResponseDTO.builder()
        .meta(META_OK.getMeta())
        .data(validaIdNoObsoleto)
        .build();
    }

    @Override
    public ApiResponseDTO validaObsoleto(ComponenteObsolteoDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, VALIDAOBSOLETO, "");
        String validaIdObsoleto = "";

        try{

             validaIdObsoleto = recetasPrebatchRepository.validaObsoleto(data.getId());

            log.grabar(FINALIZA_TRANSACCION, VALIDAOBSOLETO, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(validaIdObsoleto)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, VALIDAOBSOLETO, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }

    }

    @Override
    @Transactional
    public ApiResponseDTO creaComponente(CreaComponenteDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, CREACOMPONENTE, "");

        try{

            recetasPrebatchRepository.createComponent(data.getId(),data.getName(),data.getReference(),data.getType());

            log.grabar(FINALIZA_TRANSACCION, CREACOMPONENTE, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, CREACOMPONENTE, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }

    }

    @Override
    @Transactional
    public ApiResponseDTO actualizaComponenteExistente(ActualizaCompExistenteDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, COMPONENTEEXISTENTE, "");

        try{

            recetasPrebatchRepository.actualizaComponenteExistente(data.getId());

            log.grabar(FINALIZA_TRANSACCION, COMPONENTEEXISTENTE, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, COMPONENTEEXISTENTE, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }

    }

    @Override
    @Transactional
    public ApiResponseDTO guardaComponente(GuardaComponenteDTO data, HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, GUARDACOMPONENTE, "");

        try{

            recetasPrebatchRepository.guardaComponente(data);

            log.grabar(FINALIZA_TRANSACCION, GUARDACOMPONENTE, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, GUARDACOMPONENTE, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    @Transactional
    public ApiResponseDTO actualizaGuardadoComponente(ActualizaGuardadoComponenteDTO data,HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, ACTUALIZAGUARDADOCOMPONENTE, "");

        try{

            recetasPrebatchRepository.actualizaGuardadoComponente(data.getId());

            log.grabar(FINALIZA_TRANSACCION, ACTUALIZAGUARDADOCOMPONENTE, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, ACTUALIZAGUARDADOCOMPONENTE, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }

    }


/////////////////////////////////////////////////////RECETAS//////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    public ApiResponseDTO cargaComboRecetas() {

        log.grabar(INICIA_TRANSACCION, CARGACOMBORECETAS, "");

        try{

            List<RecipesEntity> recetasCombo =  recetasPrebatchRepository.cargaDDRecetas();

            log.grabar(FINALIZA_TRANSACCION, CARGACOMBORECETAS, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(recetasCombo)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, CARGACOMBORECETAS, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();

        }

    }

    @Override
    public ApiResponseDTO propiedadesReceta(IdPropertiesRec id,HttpServletResponse response) {

        log.grabar(INICIA_TRANSACCION, PROPIEDADESRECETAS, "");

        try{

            RecipesFullEntity propiedadesRecetas =  recetasPrebatchRepository.propiedadesReceta(id);

            log.grabar(FINALIZA_TRANSACCION, PROPIEDADESRECETAS, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(propiedadesRecetas)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, PROPIEDADESRECETAS, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();

        }

    }

    @Override
    public ApiResponseDTO componentsCombo() {

        log.grabar(INICIA_TRANSACCION, COMPONENTSCOMBO, "");

        try{

            List<ComponentsCurrentEntity> componentsCombo =  recetasPrebatchRepository.componentsCombo();

            log.grabar(FINALIZA_TRANSACCION, COMPONENTSCOMBO, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(componentsCombo)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, COMPONENTSCOMBO, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();

        }
    }

    @Override
    @Transactional
    public ApiResponseDTO eliminarReceta(EliminarRecetaDTO id ,HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, ELIMINARRECETA, "");

        try{

            recetasPrebatchRepository.eliminarReceta(id);

            log.grabar(FINALIZA_TRANSACCION, ELIMINARRECETA, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, ELIMINARRECETA, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();

        }
    }

    @Override
    @Transactional
    public ApiResponseDTO guardaReceta(GuardaRecetaDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, GUARDARECETA, "");

        try{

            recetasPrebatchRepository.guardaReceta(data);

            log.grabar(FINALIZA_TRANSACCION, GUARDARECETA, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, GUARDARECETA, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();

        }
    }

    @Override
    @Transactional
    public ApiResponseDTO actualizaGuardadoReceta(ActualizaGuardadoRecetaDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, ACTUALIZAGUARDADORECETA, "");

        try{

            recetasPrebatchRepository.actualizaGuardadoReceta(data.getId());

            log.grabar(FINALIZA_TRANSACCION, ACTUALIZAGUARDADORECETA, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, ACTUALIZAGUARDADORECETA, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    public ApiResponseDTO validaRecetaExistente(ValidaRecetaExisteDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, VALIDARECETAEXISTA, "");

        try{

            String validaReceta = recetasPrebatchRepository.validaRecetaExistente(data.getId());

            log.grabar(FINALIZA_TRANSACCION, VALIDARECETAEXISTA, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(validaReceta)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, VALIDARECETAEXISTA, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    public ApiResponseDTO validaRecetaObsoleta(ValidaRecetaObsoletaDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, VALIDARECETAOBSOLETA, "");

        try{

            String validaRecetaObsoleta = recetasPrebatchRepository.validaRecetaObsoleta(data.getId());

            log.grabar(FINALIZA_TRANSACCION, VALIDARECETAOBSOLETA, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(validaRecetaObsoleta)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, VALIDARECETAOBSOLETA, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    @Transactional
    public ApiResponseDTO restaurarRecetaObsoleta(RestauraRecetaObsoletaDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, RESTAURARRECETAOBSOLETA, "");

        try{

            recetasPrebatchRepository.restaurarRecetaObsoleta(data.getId());

            log.grabar(FINALIZA_TRANSACCION, RESTAURARRECETAOBSOLETA, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, RESTAURARRECETAOBSOLETA, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    @Transactional
    public ApiResponseDTO creaNuevaReceta(CreaNuevaReceta data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, RESTAURARRECETAOBSOLETA, "");

        try{

            Integer nuevoIdReceta = recetasPrebatchRepository.nuevoIdReceta();
            data.setIdNumeric(nuevoIdReceta + 1);
            recetasPrebatchRepository.creaNuevaReceta(data);

            log.grabar(FINALIZA_TRANSACCION, RESTAURARRECETAOBSOLETA, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, RESTAURARRECETAOBSOLETA, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    public ApiResponseDTO datosReporte(ReporteDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, DATOSREPORTE, "");

        try{

            List<ReporteEntity> datosReporte = recetasPrebatchRepository.datosReporte(data.getFechaInicio(),data.getFechaFin());

            log.grabar(FINALIZA_TRANSACCION, DATOSREPORTE, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(datosReporte)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, DATOSREPORTE, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    public ApiResponseDTO reporteMain(ReportMainDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, REPORTEMAIN, "");

        try{

            ReportMainEntity reporteMain = recetasPrebatchRepository.reporteMain(data.getProcessId());

            log.grabar(FINALIZA_TRANSACCION, REPORTEMAIN, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(reporteMain)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, REPORTEMAIN, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    public ApiResponseDTO reporteConc(ReportConcDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, REPORTECONC, "");

        try{

            ReportConcEntity reporteConc = recetasPrebatchRepository.reporteConcatenado(data.getProcessId());

            log.grabar(FINALIZA_TRANSACCION, REPORTECONC, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(reporteConc)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, REPORTECONC, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    public ApiResponseDTO reportePos(ReportPosDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, REPORTEPOS, "");

        try{

            List<ReportPosEntity> reportePos = recetasPrebatchRepository.reportePos(data.getProcessId());

            log.grabar(FINALIZA_TRANSACCION, REPORTEPOS, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(reportePos)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, REPORTEPOS, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    @Transactional
    public ApiResponseDTO actualizaBrix(ActualizaBrixDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, ACTUALIZABRIX, "");

        try{

            recetasPrebatchRepository.actualizaBrix(data.getBrix(),data.getProcessId());

            log.grabar(FINALIZA_TRANSACCION, ACTUALIZABRIX, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, ACTUALIZABRIX, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    /////////////////////////////////////////////////LOGIN/////////////////////////////////////////////////////////////////////////

    @Override
    public ApiResponseDTO consultaUsuarios() {
        log.grabar(INICIA_TRANSACCION, CONSULTAUSUARIOS, "");

        try{

            List<UsuariosEntity> usuarios = recetasPrebatchRepository.consultaUsuarios();

            log.grabar(FINALIZA_TRANSACCION, CONSULTAUSUARIOS, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(usuarios)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, CONSULTAUSUARIOS, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    public ApiResponseDTO nuevoUsuario(NuevoUsuarioDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, NUEVOUSUARIO, "");

        String passEncrypt = new BCryptPasswordEncoder().encode(data.getPass());

        try{

            recetasPrebatchRepository.nuevoUsuario(data.getUsername(),passEncrypt,data.getRole());

            log.grabar(FINALIZA_TRANSACCION, NUEVOUSUARIO, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, NUEVOUSUARIO, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    @Transactional
    public ApiResponseDTO eliminarUsuario(Integer id) {
        log.grabar(INICIA_TRANSACCION, ELIMINARUSUARIO, "");

        try{

            recetasPrebatchRepository.eliminarUsuario(id);

            log.grabar(FINALIZA_TRANSACCION, ELIMINARUSUARIO, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, ELIMINARUSUARIO, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    @Transactional
    public ApiResponseDTO actualizarUsuario(String username, String pass, String role, Integer id) {
        log.grabar(INICIA_TRANSACCION, ACTUALIZARUSUARIO, "");

        try {
            if (pass == null || pass.isBlank()) {
                // SIN password
                recetasPrebatchRepository.actualizarUsuarioSinPass(username, role, id);
            } else {
                String passEncrypt = new BCryptPasswordEncoder().encode(pass);
                recetasPrebatchRepository.actualizarUsuario(username, passEncrypt, role, id);
            }

            log.grabar(FINALIZA_TRANSACCION, ACTUALIZARUSUARIO, "");
            return ApiResponseDTO.builder().meta(META_OK.getMeta()).build();
        } catch (DataAccessException e) {
            log.grabar(FALLO, ACTUALIZARUSUARIO, e.getMessage());
            return ApiResponseDTO.builder().meta(META_ERROR.getMeta()).build();
        }
    }

    /////////////////////////////////////////////////PRESENTACIONES////////////////////////////////////////////////////////////////////

    @Override
    public ApiResponseDTO obtenerComboPresentaciones() {
        log.grabar(INICIA_TRANSACCION, COMBOPRESENTACIONES, "");

        try{

            List<PresentationEntity> presentaciones = recetasPrebatchRepository.obtenerComboPresentaciones();

            log.grabar(FINALIZA_TRANSACCION, COMBOPRESENTACIONES, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(presentaciones)
            .build();

        } catch (DataAccessException e) {
            Throwable root = (e.getMostSpecificCause() != null) ? e.getMostSpecificCause() : e;
            log.grabar(FALLO, COMBOPRESENTACIONES, root.getMessage());
            throw e;
        }
    }

    @Override
    public ApiResponseDTO propiedadesPresentacion(String id) {
        log.grabar(INICIA_TRANSACCION, PROPIEDADESPRESENTACION, "");

        try{

            DatosPresentacionEntity presentaciones = recetasPrebatchRepository.propiedadesPresentacion(id);

            log.grabar(FINALIZA_TRANSACCION, PROPIEDADESPRESENTACION, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(presentaciones)
            .build();

        } catch (DataAccessException e) {
            Throwable root = (e.getMostSpecificCause() != null) ? e.getMostSpecificCause() : e;
            log.grabar(FALLO, PROPIEDADESPRESENTACION, root.getMessage());
            throw e;
        }
    }

    @Override
    public ApiResponseDTO obtenerContenido() {
        log.grabar(INICIA_TRANSACCION, OBTENERCONTENIDO, "");

        try{

            List<ContenidoEntity> contenido = recetasPrebatchRepository.obtenerContenido();

            log.grabar(FINALIZA_TRANSACCION, OBTENERCONTENIDO, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(contenido)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, OBTENERCONTENIDO, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    public ApiResponseDTO contenidoSegmentado(String id) {
        log.grabar(INICIA_TRANSACCION, CONTENIDOSEGMENTADO, "");

        try{

            ContenidoSegmentadoEntity contenido = recetasPrebatchRepository.contenidoSegmentado(id);

            log.grabar(FINALIZA_TRANSACCION, CONTENIDOSEGMENTADO, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(contenido)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, CONTENIDOSEGMENTADO, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    public ApiResponseDTO contenidoPreCargado(String id) {
        log.grabar(INICIA_TRANSACCION, CONTENIDOPRECARGADO, "");

        try{

            ContenidoPreCargadoEntity contenido = recetasPrebatchRepository.contenidoPreCargado(id);

            log.grabar(FINALIZA_TRANSACCION, CONTENIDOPRECARGADO, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(contenido)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, CONTENIDOPRECARGADO, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    @Transactional
    public ApiResponseDTO actualizaGuardadoPresentacion(String id) {
        log.grabar(INICIA_TRANSACCION, ACTUALIZAGUARDADOPRESENTACIONES, "");

        try{

            recetasPrebatchRepository.actualizaGuardadoPresentacion(id);

            log.grabar(FINALIZA_TRANSACCION, ACTUALIZAGUARDADOPRESENTACIONES, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, ACTUALIZAGUARDADOPRESENTACIONES, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    @Transactional
    public ApiResponseDTO guardadoPresentacion(GuardadoPresentacionDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, GUARDADOPRESENTACION, "");

        try{

            recetasPrebatchRepository.guardadoPresentacion(data);

            log.grabar(FINALIZA_TRANSACCION, GUARDADOPRESENTACION, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, GUARDADOPRESENTACION, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    @Transactional
    public ApiResponseDTO eliminarPresentacion(String id) {
        log.grabar(INICIA_TRANSACCION, ELIMINARPRESENTACION, "");

        try{

            recetasPrebatchRepository.eliminarPresentacion(id);

            log.grabar(FINALIZA_TRANSACCION, ELIMINARPRESENTACION, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, ELIMINARPRESENTACION, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    public ApiResponseDTO validaPresentacionNoObsoleta(PresentacionNoObsoletaDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, VALIDAPRESENTACIONNOOBSOLETA, "");

        try{

            String presentacionNoObsoleta = recetasPrebatchRepository.validaPresentacionNoObsoleta(data);

            log.grabar(FINALIZA_TRANSACCION, VALIDAPRESENTACIONNOOBSOLETA, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(presentacionNoObsoleta)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, VALIDAPRESENTACIONNOOBSOLETA, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    public ApiResponseDTO validaPresentacionObsoleta(PresentacionObsoletaDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, VALIDAPRESENTACIONOBSOLETA, "");

        try{

            String presentacionObsoleta = recetasPrebatchRepository.validaPresentacionObsoleta(data);

            log.grabar(FINALIZA_TRANSACCION, VALIDAPRESENTACIONOBSOLETA, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(presentacionObsoleta)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, VALIDAPRESENTACIONOBSOLETA, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    @Transactional
    public ApiResponseDTO crearNuevaPresentacion(NuevaPresentacionDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, NUEVAPRESENTACION, "");

        try{

            recetasPrebatchRepository.crearNuevaPresentacion(data);

            log.grabar(FINALIZA_TRANSACCION, NUEVAPRESENTACION, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, NUEVAPRESENTACION, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    @Transactional
    public ApiResponseDTO actualizaPresentacionExistente(PresentacionExistenteDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, PRESENTACIONEXISTENTE, "");

        try{

            recetasPrebatchRepository.actualizaPresentacionExistente(data.getPresentation_id());

            log.grabar(FINALIZA_TRANSACCION, PRESENTACIONEXISTENTE, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, PRESENTACIONEXISTENTE, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    @Transactional
    public ApiResponseDTO guardaEtiquetas(GuardaEtiquetasDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, GUARDAETIQUETAS, "");

        try{

            recetasPrebatchRepository.guardaEtiquetas(data);

            log.grabar(FINALIZA_TRANSACCION, GUARDAETIQUETAS, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, GUARDAETIQUETAS, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    public ApiResponseDTO validaExisteEtiqueta(ValidaEtiquetasDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, VALIDAEXISTEETIQUETAS, "");

        try{

            String validaEtiquetas = recetasPrebatchRepository.validaExistenciaEtiqueta(data);

            log.grabar(FINALIZA_TRANSACCION, VALIDAEXISTEETIQUETAS, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(validaEtiquetas)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, VALIDAEXISTEETIQUETAS, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

    @Override
    public ApiResponseDTO codigosDeBarraReporte(ProcessIdDTO data, HttpServletResponse response) {
        log.grabar(INICIA_TRANSACCION, CODIGOSDEBARRA, "");

        try{

            List<BarcodesReportEntity> codigos = recetasPrebatchRepository.codigosDeBarraReporte(data.getProcessId());

            log.grabar(FINALIZA_TRANSACCION, CODIGOSDEBARRA, "");
            return ApiResponseDTO.builder()
            .meta(META_OK.getMeta())
            .data(codigos)
            .build();

        }catch(DataAccessException e){

            log.grabar(FALLO, CODIGOSDEBARRA, e.getMessage());
            return ApiResponseDTO.builder()
            .meta(META_ERROR.getMeta())
            .build();
        }
    }

}