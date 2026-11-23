package com.icap.controller;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
import com.icap.dto.PrintBrotherRequest;
import com.icap.dto.PrintZplRequest;
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
import com.icap.repositories.RecetasPrebatchRepository.AuthAppService;
import com.icap.services.PrinterService;
import com.icap.services.RecetasPrebatchService;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestParam;



@RestController
@RequestMapping("api/v1/recetPrebatch")
@RequiredArgsConstructor
public class RecetasPrebatchController {
        private final RecetasPrebatchService recetasPrebatchService;
        private final ObjectMapper mapper;
        private final AuthAppService auth;
        private final PrinterService printerService;


/////////////////////////////////////////////////////////COMPONENTES/////////////////////////////////////////////////////////////////////////
    @GetMapping("getComponent")
    public ApiResponseDTO getComponents() throws IOException{
        return recetasPrebatchService.getComponents();
    }

    @PostMapping("getFullComponent")
    public ApiResponseDTO getFullComponent(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        FullComponentsDTO data = mapper.readValue(json, FullComponentsDTO.class);        
        return recetasPrebatchService.getFullComponents(data,response);
    }

    @PostMapping("validateDelete")
    public ApiResponseDTO validateDelete(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ValidateDeleteDTO data = mapper.readValue(json, ValidateDeleteDTO.class);        
        return recetasPrebatchService.validateDelete(data,response);
    }

    @PostMapping("deleteComponent")
    public ApiResponseDTO deleteComponent(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        DeleteComponentDTO data = mapper.readValue(json, DeleteComponentDTO.class);
        return recetasPrebatchService.deleteComponent(data, response);
    }

    @PostMapping("validaNoObsoleto")
    public ApiResponseDTO validaNoObsoleto(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ComponenteNoObsoletoDTO data = mapper.readValue(json, ComponenteNoObsoletoDTO.class);
        return recetasPrebatchService.validaNoObsoleto(data, response);
    }

    @PostMapping("validaObsoleto")
    public ApiResponseDTO validaObsoleto(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ComponenteObsolteoDTO data = mapper.readValue(json, ComponenteObsolteoDTO.class);
        return recetasPrebatchService.validaObsoleto(data, response);
    }
    
    @PostMapping("createComponent")
    public ApiResponseDTO postMethodName(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        CreaComponenteDTO data = mapper.readValue(json, CreaComponenteDTO.class);
        return recetasPrebatchService.creaComponente(data, response);
    }
    
    @PostMapping("updateComponentExists")
    public ApiResponseDTO actualizaComponenteExistente(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ActualizaCompExistenteDTO data = mapper.readValue(json, ActualizaCompExistenteDTO.class);
        return recetasPrebatchService.actualizaComponenteExistente(data, response);
    }

    @PostMapping("saveComponent")
    public ApiResponseDTO guardaComponente(HttpServletResponse response, HttpServletRequest request) throws IOException{
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        GuardaComponenteDTO data = mapper.readValue(json, GuardaComponenteDTO.class);
        return recetasPrebatchService.guardaComponente(data, response);
    }

    @PostMapping("updatedComponentSaved")
    public ApiResponseDTO actualizaGuardadoComponente(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ActualizaGuardadoComponenteDTO data = mapper.readValue(json, ActualizaGuardadoComponenteDTO.class);
        return recetasPrebatchService.actualizaGuardadoComponente(data, response);
    }
    
/////////////////////////////////////////////////RECETAS///////////////////////////////////////////////////////////////////////////////////////////////

    @GetMapping("loadComboRecipes")
    public ApiResponseDTO CargaComboRecetas() throws IOException{
        return recetasPrebatchService.cargaComboRecetas();
    }
    
    @PostMapping("propertiesRecipe")
    public ApiResponseDTO propiedadesRecetas(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        IdPropertiesRec data = mapper.readValue(json, IdPropertiesRec.class);
        return recetasPrebatchService.propiedadesReceta(data, response);
    }

    @GetMapping("componentsCombo")
    public ApiResponseDTO ComponentsCombo() throws IOException{
        return recetasPrebatchService.componentsCombo();
    }
    
    @PostMapping("deleteRecipe")
    public ApiResponseDTO eliminarRecetas(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        EliminarRecetaDTO data = mapper.readValue(json, EliminarRecetaDTO.class);
        return recetasPrebatchService.eliminarReceta(data, response);
    }

    @PostMapping("saveRecipe")
    public ApiResponseDTO GuardaRecetas(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        GuardaRecetaDTO data = mapper.readValue(json, GuardaRecetaDTO.class);
        return recetasPrebatchService.guardaReceta(data, response);
    }

    @PostMapping("updateSaveRecipe")
    public ApiResponseDTO actualizaGuardadoReceta(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ActualizaGuardadoRecetaDTO data = mapper.readValue(json, ActualizaGuardadoRecetaDTO.class);
        return recetasPrebatchService.actualizaGuardadoReceta(data, response);
    }

    @PostMapping("validateExistsRecipe")
    public ApiResponseDTO validaExisteReceta(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ValidaRecetaExisteDTO data = mapper.readValue(json, ValidaRecetaExisteDTO.class);
        return recetasPrebatchService.validaRecetaExistente(data, response);
    }

    @PostMapping("validateRecipeObsolete")
    public ApiResponseDTO validaRecetaObsoleta(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ValidaRecetaObsoletaDTO data = mapper.readValue(json, ValidaRecetaObsoletaDTO.class);
        return recetasPrebatchService.validaRecetaObsoleta(data, response);
    }

    @PostMapping("restoreObsoleteRecipe")
    public ApiResponseDTO restaurarRecetaObsoleta(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        RestauraRecetaObsoletaDTO data = mapper.readValue(json, RestauraRecetaObsoletaDTO.class);
        return recetasPrebatchService.restaurarRecetaObsoleta(data, response);
    }

    @PostMapping("createNewRecipe")
    public ApiResponseDTO creaNuevaReceta(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        CreaNuevaReceta data = mapper.readValue(json, CreaNuevaReceta.class);
        return recetasPrebatchService.creaNuevaReceta(data, response);
    }

    @PostMapping("reportData")
    public ApiResponseDTO datosReportes(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ReporteDTO data = mapper.readValue(json, ReporteDTO.class);
        return recetasPrebatchService.datosReporte(data, response);
    }

    @PostMapping("reportMain")
    public ApiResponseDTO ReporteMain(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ReportMainDTO data = mapper.readValue(json, ReportMainDTO.class);
        return recetasPrebatchService.reporteMain(data, response);
    }

    @PostMapping("reportConc")
    public ApiResponseDTO ReporteConc(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ReportConcDTO data = mapper.readValue(json, ReportConcDTO.class);
        return recetasPrebatchService.reporteConc(data, response);
    }

    @PostMapping("reportPos")
    public ApiResponseDTO ReportePos(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ReportPosDTO data = mapper.readValue(json, ReportPosDTO.class);
        return recetasPrebatchService.reportePos(data, response);
    }

    @PostMapping("updateBrix")
    public ApiResponseDTO ActualizaBrix(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ActualizaBrixDTO data = mapper.readValue(json, ActualizaBrixDTO.class);
        return recetasPrebatchService.actualizaBrix(data, response);
    }

    @PostMapping("barcodes")
    public ApiResponseDTO CodigosDeBarra(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        ProcessIdDTO data = mapper.readValue(json, ProcessIdDTO.class);
        return recetasPrebatchService.codigosDeBarraReporte(data, response);
    }

    ///////////////////////////////////////////LOGIN//////////////////////////////////////////////////////////////////////////////

    @GetMapping("consultationUsers")
    public ApiResponseDTO ConsultaUsuarios() throws IOException{
        return recetasPrebatchService.consultaUsuarios();
    }
    
    @PostMapping("newUser")
    public ApiResponseDTO NuevoUsuario(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        NuevoUsuarioDTO data = mapper.readValue(json, NuevoUsuarioDTO.class);
        return recetasPrebatchService.nuevoUsuario(data, response);
    }

    @PostMapping("deleteUser")
    public ApiResponseDTO EliminarUsuario(@RequestParam Integer id) throws IOException{
        return recetasPrebatchService.eliminarUsuario(id);
    }

    @PostMapping("updateUser")
    public ApiResponseDTO actualizarUsuario(@RequestParam String username, @RequestParam String role,
    @RequestParam Integer id, @RequestParam(required = false) String pass) throws IOException {
        return recetasPrebatchService.actualizarUsuario(username, pass, role, id);
    }

    @PostMapping("validateLogin")
    public ResponseEntity<Map<String,Object>> login(
        @org.springframework.web.bind.annotation.RequestBody Map<String,String> body) {

        String userName = body.get("userName");
        String pass     = body.get("pass");

        return auth.validaLogin(userName, pass)
            .<ResponseEntity<Map<String,Object>>>map(data ->
                ResponseEntity.ok(Map.of("data", data))
            )
            .orElseGet(() -> ResponseEntity.status(401)
                .body(Map.of("message", "Credenciales incorrectas")));
    }

    ///////////////////////////////////////////////PRESENTACIONES/////////////////////////////////////////////////////////
    
    @GetMapping("comboPresentations")
    public ApiResponseDTO ComboPresentacioens() throws IOException{
        return recetasPrebatchService.obtenerComboPresentaciones();
    }

    @PostMapping("propertiesPresentation")
    public ApiResponseDTO PropiedadesPresentacion(@RequestParam String id) throws IOException{
        return recetasPrebatchService.propiedadesPresentacion(id);
    }
    
    @GetMapping("getContent")
    public ApiResponseDTO ObtenerContenido() throws IOException{
        return recetasPrebatchService.obtenerContenido();
    }

    @PostMapping("segmentedContent")
    public ApiResponseDTO ContenidoSegmentado(@RequestParam String id) throws IOException{
        return recetasPrebatchService.contenidoSegmentado(id);
    }

    @PostMapping("preloadedContent")
    public ApiResponseDTO ContenidoPreCargado(@RequestParam String id) throws IOException{
        return recetasPrebatchService.contenidoSegmentado(id);
    }

    @PostMapping("updatesSavedPresentations")
    public ApiResponseDTO actualizaGuardadoPresentaciones(@RequestParam String id) throws IOException{
        return recetasPrebatchService.actualizaGuardadoPresentacion(id);
    }

    @PostMapping("savePresentation")
    public ApiResponseDTO GuardadoPresentacion(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        GuardadoPresentacionDTO data = mapper.readValue(json, GuardadoPresentacionDTO.class);
        return recetasPrebatchService.guardadoPresentacion(data, response);
    }

    @PostMapping("deletePresentations")
    public ApiResponseDTO EliminarPresentacion(@RequestParam String id) throws IOException{
        return recetasPrebatchService.eliminarPresentacion(id);
    }

    @PostMapping("validatePresentationsNoObsolete")
    public ApiResponseDTO ValidaPresentacionNoObsoleta(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        PresentacionNoObsoletaDTO data = mapper.readValue(json, PresentacionNoObsoletaDTO.class);
        return recetasPrebatchService.validaPresentacionNoObsoleta(data, response);
    }

    @PostMapping("validatePresentationsObsolete")
    public ApiResponseDTO ValidaPresentacionObsoleta(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        PresentacionObsoletaDTO data = mapper.readValue(json, PresentacionObsoletaDTO.class);
        return recetasPrebatchService.validaPresentacionObsoleta(data, response);
    }

    @PostMapping("createNewPresentation")
    public ApiResponseDTO CraeNuevaPresentacion(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        NuevaPresentacionDTO data = mapper.readValue(json, NuevaPresentacionDTO.class);
        return recetasPrebatchService.crearNuevaPresentacion(data, response);
    }

    @PostMapping("updateExistingPresentation")
    public ApiResponseDTO ActualizaPresentacionExistente(HttpServletResponse response, HttpServletRequest request) throws IOException {
        String json = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        PresentacionExistenteDTO data = mapper.readValue(json, PresentacionExistenteDTO.class);
        return recetasPrebatchService.actualizaPresentacionExistente(data, response);
    }

    @PostMapping("saveTags")
    public ApiResponseDTO guardaEtiquetas(@RequestBody GuardaEtiquetasDTO data, HttpServletResponse response) {
        return recetasPrebatchService.guardaEtiquetas(data, response);
    }

    @PostMapping("printZpl")
    public ResponseEntity<Void> printZpl(@RequestBody PrintZplRequest req) throws Exception {
        printerService.print(req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("printBrother")
    public ResponseEntity<Void> printBrother(@RequestBody PrintBrotherRequest req) throws Exception {
        printerService.printBrother(req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("validateExistsTags")
    public ApiResponseDTO validaExisteEtiquetas(@RequestBody ValidaEtiquetasDTO data, HttpServletResponse response) {
        return recetasPrebatchService.validaExisteEtiqueta(data, response);
    }

}