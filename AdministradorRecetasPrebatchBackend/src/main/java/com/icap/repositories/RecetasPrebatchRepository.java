package com.icap.repositories;

import java.time.Duration;
import java.util.AbstractMap.SimpleEntry;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.EmptySqlParameterSource;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;

import com.icap.dto.CreaNuevaReceta;
import com.icap.dto.EliminarRecetaDTO;
import com.icap.dto.GuardaComponenteDTO;
import com.icap.dto.GuardaEtiquetasDTO;
import com.icap.dto.GuardaRecetaDTO;
import com.icap.dto.GuardadoPresentacionDTO;
import com.icap.dto.IdPropertiesRec;
import com.icap.dto.NuevaPresentacionDTO;
import com.icap.dto.PresentacionNoObsoletaDTO;
import com.icap.dto.PresentacionObsoletaDTO;
import com.icap.dto.ValidaEtiquetasDTO;
import com.icap.entities.BarcodesReportEntity;
import com.icap.entities.ComponentsCurrentEntity;
import com.icap.entities.ComponentsEntity;
import com.icap.entities.ComponentsFullEntity;
import com.icap.entities.ContenidoEntity;
import com.icap.entities.ContenidoPreCargadoEntity;
import com.icap.entities.ContenidoSegmentadoEntity;
import com.icap.entities.DatosPresentacionEntity;
import com.icap.entities.EliminarEntity;
import com.icap.entities.PresentationEntity;
import com.icap.entities.RecipesEntity;
import com.icap.entities.RecipesFullEntity;
import com.icap.entities.ReportConcEntity;
import com.icap.entities.ReportMainEntity;
import com.icap.entities.ReportPosEntity;
import com.icap.entities.ReporteEntity;
import com.icap.entities.UsuariosEntity;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class RecetasPrebatchRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private JdbcTemplate jdbcTemplate2;


    public List<ComponentsEntity> getComponents(){

        List<ComponentsEntity> componentes = jdbcTemplate.query(
            """
                SELECT id,
                '[R' || LPAD(version::text, 3, '0') || '] - ' || recipe_reference || '  ' || name || ' (' || id::text || ')' AS componentes
                FROM pb_components
                WHERE obsolete = false
                ORDER BY recipe_reference;
            """, 
            (rs,rowNum) -> new ComponentsEntity(
                rs.getString("id"),
                rs.getString("componentes")
            )
        );
        return componentes.isEmpty() ? null : componentes;
    }

    public ComponentsFullEntity fullComponentes(String id) {
        return jdbcTemplate.queryForObject(
            """
                SELECT id, name, recipe_reference, mass, water, temp, obsolete, comments,
                type, update_time, version, bayonet, hard, agitation_automatic, agitation_duration,
                circulate, no_inventory_validation, liquids_tank,direct_water_load,t01,t02,ibc,tn01,b01,agitation_automatic2,
                agitation_duration2,comments2,direct_water_load2,water2
                FROM pb_components
                WHERE obsolete = false AND id = :id LIMIT 1
            """,
            Map.of("id", id),
            (rs, rowNum) -> {
                //Conversión segura del campo interval (hh:mm:ss) a java.time.Duration
                String intervalStr = rs.getString("agitation_duration");
                Duration agitationDuration = Duration.ZERO;
                if (intervalStr != null) {
                    String[] parts = intervalStr.split(":");
                    int hours = Integer.parseInt(parts[0]);
                    int minutes = Integer.parseInt(parts[1]);
                    int seconds = Integer.parseInt(parts[2]);
                    agitationDuration = Duration.ofHours(hours)
                                                .plusMinutes(minutes)
                                                .plusSeconds(seconds);
                }

                String intervalStr2 = rs.getString("agitation_duration2");
                Duration agitationDuration2 = Duration.ZERO;
                if (intervalStr2 != null) {
                    String[] parts = intervalStr2.split(":");
                    int hours = Integer.parseInt(parts[0]);
                    int minutes = Integer.parseInt(parts[1]);
                    int seconds = Integer.parseInt(parts[2]);
                    agitationDuration2 = Duration.ofHours(hours)
                                                .plusMinutes(minutes)
                                                .plusSeconds(seconds);
                }

                return new ComponentsFullEntity(
                    rs.getString("id"),
                    rs.getString("name"),
                    rs.getString("recipe_reference"),
                    rs.getDouble("mass"),
                    rs.getDouble("water"),
                    rs.getDouble("temp"),
                    rs.getBoolean("obsolete"),
                    rs.getString("comments"),
                    rs.getInt("type"),
                    rs.getTimestamp("update_time"),
                    rs.getInt("version"),
                    rs.getBoolean("bayonet"),
                    rs.getBoolean("hard"),
                    rs.getBoolean("agitation_automatic"),
                    agitationDuration,
                    rs.getBoolean("circulate"),
                    rs.getBoolean("no_inventory_validation"),
                    rs.getBoolean("liquids_tank"),
                    rs.getBoolean("direct_water_load"),
                    rs.getBoolean("t01"),
                    rs.getBoolean("t02"),
                    rs.getBoolean("ibc"),
                    rs.getBoolean("tn01"),
                    rs.getBoolean("b01"),
                    rs.getBoolean("agitation_automatic2"),
                    agitationDuration2,
                    rs.getString("comments2"),
                    rs.getBoolean("direct_water_load2"),
                    rs.getDouble("water2")
                );
            }
        );
    }

    public List<EliminarEntity> habilitaEliminar(String id){

        List<EliminarEntity> habilitaEliminar = jdbcTemplate.query(
            """
                SELECT id_text,name FROM pb_recipes_current_intermediate WHERE c01_id = :id OR c02_id = :id OR c03_id = :id
                OR c04_id = :id OR c05_id = :id OR c06_id = :id OR c07_id = :id OR c08_id = :id OR c09_id = :id 
                OR c10_id = :id OR c11_id = :id OR c12_id = :id OR c13_id = :id OR c14_id = :id OR c15_id = :id;
            """, 
            Map.of("id", id),
            (rs,rowNum) -> new EliminarEntity(
                rs.getString("id_text"),
                rs.getString("name")
            )
        );

            return habilitaEliminar.isEmpty() ? null : habilitaEliminar;
    }

    @Transactional
    public void eliminar(String id){

        jdbcTemplate.update(
            """
                UPDATE pb_components SET obsolete = true WHERE id = :id
            """,
             Map.of("id",id)
        );
    }

    @Transactional
    public void createComponent(String id, String name, String reference, Integer type){

        jdbcTemplate.update(
            """
                INSERT INTO pb_components (id, name, recipe_reference, type) VALUES (:id, :name, :reference, :type)
            """,
             Map.of("id",id,"name",name,"reference",reference,"type",type)
        );
    }

    public String validaNoObsoleto(String id){

        String validaId = jdbcTemplate.queryForObject(
            """
                select id from pb_components where id = :id and obsolete = false LIMIT 1
            """,
            Map.of("id", id),
            String.class
        );

        return validaId.isEmpty() ? null : validaId;
    }

    public String validaObsoleto(String id){

        String validaObsoleto = jdbcTemplate.queryForObject(
            """
                SELECT id FROM pb_components WHERE id = :id ORDER BY update_time DESC LIMIT 1
            """,
            Map.of("id",id),
            String.class
        );

        return validaObsoleto.isEmpty() ? null : validaObsoleto;
    }

    @Transactional
    public void actualizaComponenteExistente(String id){

        jdbcTemplate.update(
            """
                UPDATE pb_components SET obsolete = false WHERE id = :id
                AND version = (SELECT MAX(version)FROM pb_components
                WHERE id = :id);
            """,
            Map.of("id",id)
        );
    }

    @Transactional
    public void guardaComponente(GuardaComponenteDTO data) {

        try {
            jdbcTemplate.update(
                """
                INSERT INTO pb_components (
                    id, name, recipe_reference, mass, water, temp, obsolete, comments, type,
                    update_time, version, bayonet, hard, agitation_automatic, agitation_duration,
                    circulate, no_inventory_validation, liquids_tank,direct_water_load,t01,t02,ibc,
                    tn01,b01,agitation_automatic2,agitation_duration2,comments2,direct_water_load2,water2
                ) VALUES (
                    :id, :name, :recipeReference, :mass, :water, :temp, :obsolete, :comments, :type,
                    CURRENT_TIMESTAMP(6), :version, :bayonet, :hard, :agitationAutomatic, CAST(:agitationDuration AS interval),
                    :circulate, :noInventoryValidation, :liquidsTank, :directWaterLoad, :t01, :t02, :ibc, :tn01, :b01, :agitationAutomatic2,
                    CAST(:agitationDuration2 AS interval), :comments2, :directWaterLoad2, :water2
                )
                """,
                Map.ofEntries(
                    new SimpleEntry<>("id", data.getId()),
                    new SimpleEntry<>("name", data.getName()),
                    new SimpleEntry<>("recipeReference", data.getRecipeReference()),
                    new SimpleEntry<>("mass", data.getMass()),
                    new SimpleEntry<>("water", data.getWater()),
                    new SimpleEntry<>("temp", data.getTemp()),
                    new SimpleEntry<>("obsolete", data.getObsolete()),
                    new SimpleEntry<>("comments", data.getComments()),
                    new SimpleEntry<>("type", data.getType()),
                    new SimpleEntry<>("version", data.getVersion()),
                    new SimpleEntry<>("bayonet", data.getBayonet()),
                    new SimpleEntry<>("hard", data.getHard()),
                    new SimpleEntry<>("agitationAutomatic", data.getAgitationAutomatic()),
                    new SimpleEntry<>("agitationDuration", iso8601ToPgInterval(data.getAgitationDuration())),
                    new SimpleEntry<>("circulate", data.getCirculate()),
                    new SimpleEntry<>("noInventoryValidation", data.getNoInventoryValidation()),
                    new SimpleEntry<>("liquidsTank", data.getLiquidsTank()),
                    new SimpleEntry<>("directWaterLoad", data.getDirectWaterLoad()),
                    new SimpleEntry<>("t01", data.getT01()),
                    new SimpleEntry<>("t02", data.getT02()),
                    new SimpleEntry<>("ibc", data.getIbc()),
                    new SimpleEntry<>("tn01", data.getTn01()),
                    new SimpleEntry<>("b01", data.getB01()),
                    new SimpleEntry<>("agitationAutomatic2", data.getAgitationAutomatic2()),
                    new SimpleEntry<>("agitationDuration2", iso8601ToPgInterval(data.getAgitationDuration2())),
                    new SimpleEntry<>("comments2", data.getComments2()),
                    new SimpleEntry<>("directWaterLoad2", data.getDirectWaterLoad2()),
                    new SimpleEntry<>("water2", data.getWater2())
                )
            );
        } catch (Exception ex) {
            System.err.println(" Error al insertar componente:");
            System.err.println("SQL con Named Parameters: " );
            ex.printStackTrace();
            throw ex;
        }
    }

    @Transactional
    public void actualizaGuardadoComponente(String id){

        jdbcTemplate.update(
            """
                UPDATE pb_components SET obsolete = TRUE WHERE id = :id AND obsolete = FALSE
            """,
            Map.of("id",id)
        );

    }

    public static String iso8601ToPgInterval(String iso) {
        Duration d = Duration.parse(iso);
        long seconds = d.getSeconds();
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;
        return String.format("%02d:%02d:%02d", hours, minutes, secs);
    }

    ////////////////////////////////////////////////////////////////////////////////RECETAS/////////////////////////////////////////////////////////////////////////////////////////////////


    public List<RecipesEntity> cargaDDRecetas() {

        List<RecipesEntity> recetas = jdbcTemplate.query(
            """
            SELECT id_text AS idText,
                '[R' || LPAD(version::text, 3, '0') || '] - ' || 
                name || ' - ' || 
                CASE type
                    WHEN 0 THEN '-'
                    WHEN 1 THEN 'Dietética'
                    WHEN 2 THEN 'Sacarosa'
                    WHEN 3 THEN 'Sacarosa pasteurizada'
                    WHEN 4 THEN 'Fructosa'
                    WHEN 5 THEN 'Sacarosa y fructosa'
                    ELSE '-'
                END || ' (' || id_text || ')' AS recipesCombo
            FROM pb_recipes_current_intermediate
            """,
            (rs,rowNum) -> new RecipesEntity(
                rs.getString("idText"),
                rs.getString("recipesCombo")
            )
        );

        return recetas.isEmpty() ? null : recetas;
    }
    
    public RecipesFullEntity propiedadesReceta(IdPropertiesRec id) {

        RecipesFullEntity recetas = jdbcTemplate.queryForObject(
            """
                SELECT update_time,id_text,id_numeric,name,mass,brix,density,type,sucrose,fructose,water,agitation_duration,
                holding_duration,comments,version,c01_id, c01_pos, c02_id, c02_pos, c03_id, c03_pos, c04_id, c04_pos,
                c05_id, c05_pos, c06_id, c06_pos, c07_id, c07_pos, c08_id, c08_pos,
                c09_id, c09_pos, c10_id, c10_pos, c11_id, c11_pos, c12_id, c12_pos,
                c13_id, c13_pos, c14_id, c14_pos, c15_id, c15_pos, c16_id, c16_pos
                FROM pb_recipes_current_intermediate
                where id_text = :id LIMIT 1
            """,
            Map.of("id",id.getId()),
            (rs,rowNum) -> new RecipesFullEntity(
                rs.getString("update_time"),
                rs.getString("id_text"),
                rs.getInt("id_numeric"),
                rs.getString("name"),
                rs.getFloat("mass"),
                rs.getFloat("brix"),
                rs.getFloat("density"),
                rs.getInt("type"),
                rs.getFloat("sucrose"),
                rs.getFloat("fructose"),
                rs.getFloat("water"),
                rs.getInt("agitation_duration"),
                rs.getInt("holding_duration"),
                rs.getString("comments"),
                rs.getInt("version"),
                rs.getString("c01_id"),
                rs.getInt("c01_pos"),
                rs.getString("c02_id"),
                rs.getInt("c02_pos"),
                rs.getString("c03_id"),
                rs.getInt("c03_pos"),
                rs.getString("c04_id"),
                rs.getInt("c04_pos"),
                rs.getString("c05_id"),
                rs.getInt("c05_pos"),
                rs.getString("c06_id"),
                rs.getInt("c06_pos"),
                rs.getString("c07_id"),
                rs.getInt("c07_pos"),
                rs.getString("c08_id"),
                rs.getInt("c08_pos"),
                rs.getString("c09_id"),
                rs.getInt("c09_pos"),
                rs.getString("c10_id"),
                rs.getInt("c10_pos"),
                rs.getString("c11_id"),
                rs.getInt("c11_pos"),
                rs.getString("c12_id"),
                rs.getInt("c12_pos"),
                rs.getString("c13_id"),
                rs.getInt("c13_pos"),
                rs.getString("c14_id"),
                rs.getInt("c14_pos"),
                rs.getString("c15_id"),
                rs.getInt("c15_pos"),
                rs.getString("c16_id"),
                rs.getInt("c16_pos")
            )
        );

        return recetas;
    }


    public List<ComponentsCurrentEntity> componentsCombo() {

        List<ComponentsCurrentEntity> componentsCombo = jdbcTemplate.query(
            """
                SELECT id,recipe_reference || ' ' || name || ' [' || id || '] (' || to_char(mass, 'FM999999990.0000') || ' kg)' AS componentes
                FROM pb_components_current;
            """,
            (rs,rowNum) -> new ComponentsCurrentEntity(
                rs.getString("id"),
                rs.getString("componentes")
            )
        );

        return componentsCombo.isEmpty() ? null : componentsCombo;
    }

    @Transactional
    public void eliminarReceta(EliminarRecetaDTO id) {

        jdbcTemplate.update(
            """
                UPDATE pb_recipes SET obsolete = TRUE WHERE id_text = :id;
            """,
            Map.of("id",id.getId())
        );

    }

    @Transactional
    public void guardaReceta(GuardaRecetaDTO receta) {

        jdbcTemplate.update(
            """
                INSERT INTO pb_recipes( id_text,id_numeric,name,mass,brix,density,type,update_time,sucrose,fructose,water,agitation_duration,
                holding_duration,comments,version,c01_id, c01_pos, c02_id, c02_pos, c03_id, c03_pos, c04_id, c04_pos,
                c05_id, c05_pos, c06_id, c06_pos, c07_id, c07_pos, c08_id, c08_pos,
                c09_id, c09_pos, c10_id, c10_pos, c11_id, c11_pos, c12_id, c12_pos,
                c13_id, c13_pos, c14_id, c14_pos, c15_id, c15_pos, c16_id, c16_pos ) VALUES 
                ( :id, :id_numeric, :name, :mass, :brix, :density, :type, CURRENT_TIMESTAMP(6), :sucrose, :fructose, :water, :agitationDuration, :holdingDuration,
                  :comments, :version, :c01_id, :c01_pos, :c02_id, :c02_pos, :c03_id, :c03_pos, :c04_id, :c04_pos, :c05_id, :c05_pos, :c06_id, :c06_pos,
                  :c07_id, :c07_pos, :c08_id, :c08_pos, :c09_id, :c09_pos, :c10_id, :c10_pos, :c11_id, :c11_pos, :c12_id, :c12_pos, :c13_id, :c13_pos,
                  :c14_id, :c14_pos, :c15_id, :c15_pos, :c16_id, :c16_pos )
            """,
            Map.ofEntries(
                new SimpleEntry<>("id", receta.getId()),
                new SimpleEntry<>("id_numeric", receta.getIdNumeric()),
                new SimpleEntry<>("name", receta.getName()),
                new SimpleEntry<>("mass", receta.getMass()),
                new SimpleEntry<>("brix", receta.getBrix()),
                new SimpleEntry<>("density", receta.getDensity()),
                new SimpleEntry<>("type", receta.getType()),
                new SimpleEntry<>("sucrose", receta.getSucrose()),
                new SimpleEntry<>("fructose", receta.getFructose()),
                new SimpleEntry<>("water", receta.getWater()),
                new SimpleEntry<>("agitationDuration", receta.getAgitationDuration()),
                new SimpleEntry<>("holdingDuration", receta.getHoldingDuration()),
                new SimpleEntry<>("comments", receta.getComments()),
                new SimpleEntry<>("version", receta.getVersion()),
                new SimpleEntry<>("c01_id", receta.getC01_id()),
                new SimpleEntry<>("c01_pos", receta.getC01_pos()),
                new SimpleEntry<>("c02_id", receta.getC02_id()),
                new SimpleEntry<>("c02_pos", receta.getC02_pos()),
                new SimpleEntry<>("c03_id", receta.getC03_id()),
                new SimpleEntry<>("c03_pos", receta.getC03_pos()),
                new SimpleEntry<>("c04_id", receta.getC04_id()),
                new SimpleEntry<>("c04_pos", receta.getC04_pos()),
                new SimpleEntry<>("c05_id", receta.getC05_id()),
                new SimpleEntry<>("c05_pos", receta.getC05_pos()),
                new SimpleEntry<>("c06_id", receta.getC06_id()),
                new SimpleEntry<>("c06_pos", receta.getC06_pos()),
                new SimpleEntry<>("c07_id", receta.getC07_id()),
                new SimpleEntry<>("c07_pos", receta.getC07_pos()),
                new SimpleEntry<>("c08_id", receta.getC08_id()),
                new SimpleEntry<>("c08_pos", receta.getC08_pos()),
                new SimpleEntry<>("c09_id", receta.getC09_id()),
                new SimpleEntry<>("c09_pos", receta.getC09_pos()),
                new SimpleEntry<>("c10_id", receta.getC10_id()),
                new SimpleEntry<>("c10_pos", receta.getC10_pos()),
                new SimpleEntry<>("c11_id", receta.getC11_id()),
                new SimpleEntry<>("c11_pos", receta.getC11_pos()),
                new SimpleEntry<>("c12_id", receta.getC12_id()),
                new SimpleEntry<>("c12_pos", receta.getC12_pos()),
                new SimpleEntry<>("c13_id", receta.getC13_id()),
                new SimpleEntry<>("c13_pos", receta.getC13_pos()),
                new SimpleEntry<>("c14_id", receta.getC14_id()),
                new SimpleEntry<>("c14_pos", receta.getC14_pos()),
                new SimpleEntry<>("c15_id", receta.getC15_id()),
                new SimpleEntry<>("c15_pos", receta.getC15_pos()),
                new SimpleEntry<>("c16_id", receta.getC16_id()),
                new SimpleEntry<>("c16_pos", receta.getC16_pos())

            )
        );

    }

    @Transactional
    public void actualizaGuardadoReceta(String id){

        jdbcTemplate.update(
            """
                UPDATE pb_recipes SET obsolete = true WHERE id_text = :id AND obsolete = false
            """,
            Map.of("id",id)
        );

    }

    public String validaRecetaExistente(String id){

        String recetaExistente = jdbcTemplate.queryForObject(
            """
                SELECT id_text FROM pb_recipes_current_basic WHERE id_text = :id LIMIT 1
            """, 
            Map.of("id", id),
            String.class
        );

        return recetaExistente.isEmpty() ? null : recetaExistente;

    }


    public String validaRecetaObsoleta(String id){

        String recetaObsoleta = jdbcTemplate.queryForObject(
            """
                SELECT id_text FROM pb_recipes WHERE id_text = :id ORDER BY update_time DESC LIMIT 1
            """, 
            Map.of("id",id),
             String.class
        );

        return recetaObsoleta.isEmpty() ? null : recetaObsoleta;

    }

    @Transactional
    public void restaurarRecetaObsoleta(String id){

        jdbcTemplate.update(
            """
                UPDATE pb_recipes SET obsolete = false WHERE id_text = :id
                AND version = (SELECT MAX(version)FROM pb_recipes
                WHERE id_text = :id);
            """,
            Map.of("id",id)
        );

    }

    @Transactional
    public void creaNuevaReceta(CreaNuevaReceta data) {
        String sql = """
            INSERT INTO pb_recipes
            (id_text, name, id_numeric, mass, brix, density, type, sucrose, fructose, water, c01_id, c01_pos)
            VALUES (:id, :nombre, :idNumeric, :jarabe, :brix, :densidad, :tipo, :sacarosa, :fructosa, :agua, :componente, 1)
        """;

        MapSqlParameterSource p = new MapSqlParameterSource()
            .addValue("id",        data.getId())
            .addValue("nombre",    data.getNombre())
            .addValue("idNumeric", data.getIdNumeric())
            .addValue("jarabe",    data.getJarabe())
            .addValue("brix",      data.getBrix())
            .addValue("densidad",  data.getDensidad())
            .addValue("tipo",      data.getTipo())
            .addValue("sacarosa",  data.getSacarosa())
            .addValue("fructosa",  data.getFructosa())
            .addValue("agua",      data.getAgua())
            .addValue("componente",data.getComponente());

        jdbcTemplate.update(sql, p);
    }


    public Integer nuevoIdReceta(){

        Integer nuevoIdReceta = jdbcTemplate.queryForObject(
            """
                SELECT MAX(id_numeric) AS id_numeric FROM pb_recipes_newest_versions
            """,
            new EmptySqlParameterSource(),
            Integer.class
        );
        return nuevoIdReceta;

    }

////////////////////////////////////////////////////////////////////REPORTES//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    public List<ReporteEntity> datosReporte(String fechaInicio, String fechaFin) {

        List<ReporteEntity> datosReporte = jdbcTemplate.query(
            """
                SELECT start_time, process_id, prebatch, recipe_id, name, tank_name, 
                    sucrose_accum, fructose_accum, water_accum
                FROM pb_recipes_executed_report_main 
                WHERE start_time BETWEEN :fechaInicio::timestamp AND :fechaFin::timestamp ORDER BY process_id DESC
            """,
            Map.of("fechaInicio", fechaInicio, "fechaFin", fechaFin),
            (rs, rowNum) -> new ReporteEntity(
                rs.getString("start_time"),
                rs.getInt("process_id"),
                rs.getInt("prebatch"),
                rs.getString("recipe_id"),
                rs.getString("name"),
                rs.getString("tank_name"),
                rs.getDouble("sucrose_accum"),
                rs.getDouble("fructose_accum"),
                rs.getDouble("water_accum")
            )
        );

        return datosReporte;
    }

    public ReportMainEntity reporteMain(Integer processId) {

        ReportMainEntity reporteMain = jdbcTemplate.queryForObject(
            """
                SELECT start_time, finish_time, process_id, prebatch, recipe_id, name, brix, density, recipe_type, units,
                    user_name, tank_name, mass_setpoint, mass_accum, volume_setpoint, volume_accum, sucrose_setpoint, sucrose_accum,
                    fructose_setpoint, fructose_accum, water_setpoint, water_accum
                FROM pb_recipes_executed_report_main WHERE process_id = :processId LIMIT 1
            """,
            Map.of("processId",processId),
            (rs,rowNum) -> new ReportMainEntity(
                rs.getString("start_time"),
                rs.getString("finish_time"),
                rs.getInt("process_id"),
                rs.getInt("prebatch"),
                rs.getString("recipe_id"),
                rs.getString("name"),
                rs.getDouble("brix"),
                rs.getDouble("density"),
                rs.getString("recipe_type"),
                rs.getInt("units"),
                rs.getString("user_name"),
                rs.getString("tank_name"),
                rs.getDouble("mass_setpoint"),
                rs.getDouble("mass_accum"),
                rs.getDouble("volume_setpoint"),
                rs.getDouble("volume_accum"),
                rs.getDouble("sucrose_setpoint"),
                rs.getDouble("sucrose_accum"),
                rs.getDouble("fructose_setpoint"),
                rs.getDouble("fructose_accum"),
                rs.getDouble("water_setpoint"),
                rs.getDouble("water_accum")

            )
        );
        return reporteMain;

    }

    public ReportConcEntity reporteConcatenado(Integer processId) {

        ReportConcEntity reportConc = jdbcTemplate.queryForObject(
            """
                SELECT c01_pos, c01_id, c01_name, c01_mass, c02_pos, c02_id, c02_name,
                c02_mass, c03_pos, c03_id, c03_name, c03_mass, c04_pos, c04_id, c04_name,
                c04_mass, c05_pos, c05_id, c05_name, c05_mass, c06_pos, c06_id, c06_name,
                c06_mass, c07_pos, c07_id, c07_name, c07_mass, c08_pos, c08_id, c08_name,
                c08_mass, c09_pos, c09_id, c09_name, c09_mass, c10_pos, c10_id, c10_name, 
                c10_mass, c11_pos, c11_id, c11_name, c11_mass, c12_pos, c12_id, c12_name,
                c12_mass, c13_pos, c13_id, c13_name, c13_mass, c14_pos, c14_id, c14_name, 
                c14_mass, c15_pos, c15_id, c15_name, c15_mass, c16_pos, c16_id, c16_name, c16_mass
                FROM pb_recipes_executed_report_conc WHERE process_id = :processId LIMIT 1
            """,
            Map.of("processId",processId),
            (rs,rowNum) -> new ReportConcEntity(
                rs.getInt("c01_pos"),
                rs.getString("c01_id"),
                rs.getString("c01_name"),
                rs.getDouble("c01_mass"),
                rs.getInt("c02_pos"),
                rs.getString("c02_id"),
                rs.getString("c02_name"),
                rs.getDouble("c02_mass"),
                rs.getInt("c03_pos"),
                rs.getString("c03_id"),
                rs.getString("c03_name"),
                rs.getDouble("c03_mass"),
                rs.getInt("c04_pos"),
                rs.getString("c04_id"),
                rs.getString("c04_name"),
                rs.getDouble("c04_mass"),
                rs.getInt("c05_pos"),
                rs.getString("c05_id"),
                rs.getString("c05_name"),
                rs.getDouble("c05_mass"),
                rs.getInt("c06_pos"),
                rs.getString("c06_id"),
                rs.getString("c06_name"),
                rs.getDouble("c06_mass"),
                rs.getInt("c07_pos"),
                rs.getString("c07_id"),
                rs.getString("c07_name"),
                rs.getDouble("c07_mass"),
                rs.getInt("c08_pos"),
                rs.getString("c08_id"),
                rs.getString("c08_name"),
                rs.getDouble("c08_mass"),
                rs.getInt("c09_pos"),
                rs.getString("c09_id"),
                rs.getString("c09_name"),
                rs.getDouble("c09_mass"),
                rs.getInt("c10_pos"),
                rs.getString("c10_id"),
                rs.getString("c10_name"),
                rs.getDouble("c10_mass"),
                rs.getInt("c11_pos"),
                rs.getString("c11_id"),
                rs.getString("c11_name"),
                rs.getDouble("c11_mass"),
                rs.getInt("c12_pos"),
                rs.getString("c12_id"),
                rs.getString("c12_name"),
                rs.getDouble("c12_mass"),
                rs.getInt("c13_pos"),
                rs.getString("c13_id"),
                rs.getString("c13_name"),
                rs.getDouble("c13_mass"),
                rs.getInt("c14_pos"),
                rs.getString("c14_id"),
                rs.getString("c14_name"),
                rs.getDouble("c14_mass"),
                rs.getInt("c15_pos"),
                rs.getString("c15_id"),
                rs.getString("c15_name"),
                rs.getDouble("c15_mass"),
                rs.getInt("c16_pos"),
                rs.getString("c16_id"),
                rs.getString("c16_name"),
                rs.getDouble("c16_mass")
            )
        );

        return reportConc;
    }

    public List<ReportPosEntity> reportePos(Integer processId) {

        List<ReportPosEntity> reportePos = jdbcTemplate.query(
            """
                SELECT process_id, position, manual, water, update_time FROM pb_recipes_progress WHERE process_id = :processId ORDER BY position ASC

            """,
            Map.of("processId",processId),
            (rs,rowNum) -> new ReportPosEntity(
                rs.getInt("process_id"),
                rs.getInt("position"),
                rs.getBoolean("manual"),
                rs.getDouble("water"),
                rs.getString("update_time")
            )
        );

        return reportePos;
    }

    @Transactional
    public void actualizaBrix(Double brix, Integer processId) {

        jdbcTemplate.update(
            """
                UPDATE public.pb_recipes_executed
                SET brix_user = :brix
                WHERE process_id = :processId
            """,
            Map.of("brix",brix,"processId",processId)
        );
    }

    public List<BarcodesReportEntity> codigosDeBarraReporte(Integer processId){
        
        List<BarcodesReportEntity> codigos = jdbcTemplate.query(
            """
                SELECT presentation_id,presentation_serial, presentation_expiration, presentation_batch ,component_ref, 
                presentation_name, captures,units
                FROM pb_recipes_barcodes_report
                WHERE process_id = :process_id
                ORDER BY component_ref, presentation_id
            """, 
            Map.of("process_id",processId), 
            (rs,rowNum) -> new BarcodesReportEntity(
                rs.getString("presentation_id"),
                rs.getInt("presentation_serial"),
                rs.getString("presentation_expiration"),
                rs.getInt("presentation_batch"),
                rs.getString("component_ref"),
                rs.getString("presentation_name"),
                rs.getInt("captures"),
                rs.getDouble("units")
            )
        );

        return codigos;
    }

    ///////////////////////////////////////////////////////LOGIN//////////////////////////////////////////////////////////////////////////////////////////////
    public List<UsuariosEntity> consultaUsuarios() {

        List<UsuariosEntity> usuarios = jdbcTemplate.query(
            """
                SELECT id,username,role FROM app_users ORDER BY id ASC
            """, 
            new EmptySqlParameterSource(),
            (rs,rowNum) -> new UsuariosEntity(
                rs.getInt("id"),
                rs.getString("username"),
                rs.getString("role")
            )
        );
        return usuarios.isEmpty() ? null : usuarios;
    }

    public void nuevoUsuario(String username, String pass, String role ) {

        jdbcTemplate.update(
            """
                INSERT INTO app_users (username, password_hash, role, enabled)
                VALUES ( :username, :pass, :role, true);
            """,
             Map.of("username", username, "pass",pass, "role", role)
        );

    }

    @Transactional
    public void eliminarUsuario(Integer id) {

        if (id == 1) {
            return;
        }
        jdbcTemplate.update(
            """
                DELETE FROM app_users WHERE id = :id
            """, 
            Map.of("id",id)
        );
    }

    @Transactional
    public void actualizarUsuarioSinPass(String username, String role, Integer id) {
        jdbcTemplate.update(
            """
            UPDATE app_users
            SET username = :username, role = :role
            WHERE id = :id
            """,
            Map.of("username", username, "role", role, "id", id)
        );
    }

    @Transactional
    public void actualizarUsuario(String username, String pass, String role, Integer id) {
        jdbcTemplate.update(
            """
            UPDATE app_users
            SET username = :username, role = :role, password_hash = :pass
            WHERE id = :id
            """,
            Map.of("username", username, "pass", pass, "role", role, "id", id)
        );
    }


    @Service
    @RequiredArgsConstructor
    public class AuthAppService {

        private final NamedParameterJdbcTemplate jdbc;
        private final PasswordEncoder passwordEncoder;

        public Optional<Map<String, Object>> validaLogin(String userName, String pass) {
            try {
                var row = jdbc.queryForMap(
                    """
                    SELECT id, password_hash, enabled, role
                    FROM app_users
                    WHERE username = :user
                    LIMIT 1
                    """,
                    Map.of("user", userName)
                );

                boolean enabled = (boolean) row.get("enabled");
                if (!enabled) return Optional.empty();

                String hash = (String) row.get("password_hash");
                if (passwordEncoder.matches(pass, hash)) {
                    Integer id   = (Integer) row.get("id");
                    String role  = (String) row.get("role");
                    return Optional.of(Map.of(
                        "id", id,
                        "role", role,
                        "userName", userName
                    ));
                }
                return Optional.empty();

            } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
                return Optional.empty();
            }
        }
    }

    //////////////////////////////////////////////////////PRESENTACIONES///////////////////////////////////////////////////////////////////////////////////////////////
     
    public List<PresentationEntity> obtenerComboPresentaciones(){

        List<PresentationEntity> presentaciones = jdbcTemplate.query(
            """
                SELECT presentation_id,'[R' || LPAD(version::text, 3, '0') || ']' ||' '|| '[' || presentation_id || ']' || ' ' || '[' || units || 'U]'
                || ' ' || recipe_reference || ' ' || presentation_name AS presentation
                FROM pb_component_presentations WHERE obsolete = false
            """, 
            (rs,rowNum) -> new PresentationEntity(
                rs.getString("presentation_id"),
                rs.getString("presentation")
            )
        );

        return presentaciones.isEmpty() ? null : presentaciones;
    }

    public DatosPresentacionEntity propiedadesPresentacion(String id){

        DatosPresentacionEntity propiedades = jdbcTemplate.queryForObject(
            """
                SELECT update_time, presentation_id, presentation_name, recipe_reference, units, comments, version
                FROM pb_component_presentations WHERE obsolete = false AND presentation_id = :id LIMIT 1
            """,
            Map.of("id",id),
            (rs,rowNum) -> new DatosPresentacionEntity(
                rs.getString("update_time"),
                rs.getString("presentation_id"),
                rs.getString("presentation_name"),
                rs.getString("recipe_reference"),
                rs.getDouble("units"),
                rs.getString("comments"),
                rs.getInt("version")
            )
        );
        
        return propiedades;
    }

    public List<ContenidoEntity> obtenerContenido() {

        List<ContenidoEntity> contenido = jdbcTemplate.query(
            """
                select id,'[' || id || ']' || ' ' || recipe_reference || ' ' || name AS contenido
                from pb_components_current
            """, 
            (rs,rowNum) -> new ContenidoEntity(
                rs.getString("id"),
                rs.getString("contenido")
            )
        );
        return contenido.isEmpty() ? null : contenido;
    }

    public ContenidoSegmentadoEntity contenidoSegmentado(String id) {

        ContenidoSegmentadoEntity contenido = jdbcTemplate.queryForObject(
            """
                SELECT c01_id,c02_id,c03_id,c04_id,c05_id FROM pb_component_presentations
                WHERE presentation_id = :id AND obsolete = false LIMIT 1;
            """, 
            Map.of("id",id),
            (rs,rowNum) -> new ContenidoSegmentadoEntity(
                rs.getString("c01_id"),
                rs.getString("c02_id"),
                rs.getString("c03_id"),
                rs.getString("c04_id"),
                rs.getString("c05_id")
            )
        );
        return contenido;
    }

    public ContenidoPreCargadoEntity contenidoPreCargado(String id){

        ContenidoPreCargadoEntity contenido = jdbcTemplate.queryForObject(
            """
                SELECT id,'[' || id || ']' || ' ' || recipe_reference || ' ' || name AS contenido
                FROM pb_components_current WHERE id = :id AND obsolete = false
            """,
            Map.of("id",id), 
            (rs,rowNum) -> new ContenidoPreCargadoEntity(
                rs.getString("id"),
                rs.getString("contenido")
            )
        );
        return contenido;
    }

    @Transactional
    public void actualizaGuardadoPresentacion(String id){

        jdbcTemplate.update(
            """
                update pb_component_presentations set obsolete = true WHERE presentation_id = :id;
            """,
            Map.of("id",id)
        );

    }

    @Transactional
    public void guardadoPresentacion(GuardadoPresentacionDTO data) {
        String sql = """
            INSERT INTO pb_component_presentations(
                presentation_id, presentation_name, recipe_reference, units,
                c01_id, c02_id, c03_id, c04_id, c05_id, comments, version, obsolete
            )
            VALUES (
                :presentation_id, :presentation_name, :recipe_reference, :units,
                COALESCE(NULLIF(NULLIF(TRIM(:c01_id), '[default]'), ''), '-'),
                COALESCE(NULLIF(NULLIF(TRIM(:c02_id), '[default]'), ''), '-'),
                COALESCE(NULLIF(NULLIF(TRIM(:c03_id), '[default]'), ''), '-'),
                COALESCE(NULLIF(NULLIF(TRIM(:c04_id), '[default]'), ''), '-'),
                COALESCE(NULLIF(NULLIF(TRIM(:c05_id), '[default]'), ''), '-'),
                :comments, :version, false
            )
        """;

        var p = new MapSqlParameterSource()
            .addValue("presentation_id", data.getPresentation_id())
            .addValue("presentation_name", data.getPresentation_name())
            .addValue("recipe_reference", data.getRecipe_reference())
            .addValue("units", data.getUnits())
            .addValue("c01_id", data.getC01_id())
            .addValue("c02_id", data.getC02_id())
            .addValue("c03_id", data.getC03_id())
            .addValue("c04_id", data.getC04_id())
            .addValue("c05_id", data.getC05_id())
            .addValue("comments", data.getComments())
            .addValue("version", data.getVersion());

        jdbcTemplate.update(sql, p);
    }

    @Transactional
    public void eliminarPresentacion(String id) {

        jdbcTemplate.update(
            """
                UPDATE pb_component_presentations SET obsolete = true WHERE presentation_id = :id;
            """,
             Map.of("id",id)
        );

    }

    public String validaPresentacionNoObsoleta(PresentacionNoObsoletaDTO data) {

        String presentacionNoObsoleta = jdbcTemplate.queryForObject(
            """
                SELECT presentation_id FROM pb_component_presentations WHERE presentation_id = :id AND obsolete = false LIMIT 1
            """, 
            Map.of("id", data.getPresentation_id()), 
            String.class
        );

        return presentacionNoObsoleta.isEmpty() ? null : presentacionNoObsoleta;

    }

    public String validaPresentacionObsoleta(PresentacionObsoletaDTO data) {

        String presentacionObsoleta = jdbcTemplate.queryForObject(
            """
                SELECT presentation_id FROM pb_component_presentations WHERE presentation_id = :id LIMIT 1
            """,
            Map.of("id",data.getPresentation_id()),
            String.class
        );
        return presentacionObsoleta.isEmpty() ? null : presentacionObsoleta;

    }

    @Transactional
    public void crearNuevaPresentacion(NuevaPresentacionDTO data) {

        jdbcTemplate.update(
            """
                INSERT INTO pb_component_presentations(presentation_id,presentation_name,recipe_reference,c01_id) VALUES (:presentation_id, :presentation_name, :recipe_reference, :c01_id)
            """,
             Map.of("presentation_id",data.getNuevaPresentation_id(),"presentation_name", data.getNuevaPresentation_name(), "recipe_reference",data.getNuevaRecipe_reference(), "c01_id", data.getNuevoC01_id())
        );

    }

    @Transactional
    public void actualizaPresentacionExistente(String id) {

        jdbcTemplate.update(
            """
                UPDATE pb_component_presentations SET obsolete = false WHERE presentation_id = :id
                AND version = (SELECT MAX(version)FROM pb_component_presentations
                WHERE presentation_id = :id);
            """,
             Map.of("id",id)
        );

    }

    @Transactional
    public void guardaEtiquetas(GuardaEtiquetasDTO data) {
        jdbcTemplate.update(
            """
            INSERT INTO pb_inventory_custom_codes
            (presentation_id, presentation_batch, presentation_expiration, presentation_serial)
            VALUES (:id, :batch, :expiration, :serial)
            ON CONFLICT (presentation_id, presentation_batch, presentation_serial)
            DO UPDATE SET update_time = NOW()
            """,
            Map.of(
            "id", data.getPresentation_id(),
            "batch", data.getPresentation_batch(),
            "expiration", data.getPresentation_expiration(),
            "serial", data.getPresentation_serial()
            )
        );
    }

    
    public String validaExistenciaEtiqueta(ValidaEtiquetasDTO data) {
        try {
            String sql = """
                SELECT presentation_id
                FROM pb_inventory_custom_codes
                WHERE presentation_id = :id
                AND presentation_batch = :batch
                AND presentation_serial = :serial
                LIMIT 1
            """;
            Map<String, ?> params = Map.of(
                "id", data.getPresentation_id(),
                "batch", data.getPresentation_batch(),
                "serial", data.getPresentation_serial()
            );
            return jdbcTemplate.queryForObject(sql, params, String.class);
        } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
            return null; 
        }
    }

}