package com.icap.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

/**
 * Consulta histórica de SOLO LECTURA. Usa la misma vista que los reportes
 * actuales; no altera recetas, procesos ni las tablas de SCADA.
 *
 * Las metas y acumulados se retornan sin deducir calidad ni cumplimiento.
 * La seguridad de acceso debe ser controlada por WebSecurityConfig.
 */
@RestController
@RequestMapping("api/v1/recetPrebatch")
@RequiredArgsConstructor
public class AnalisisHistoricoController {

    private static final int MAX_FILAS = 500;
    private final NamedParameterJdbcTemplate jdbc;

    public record Consulta(LocalDate desde, LocalDate hasta, String recipeId) {}

    @PostMapping("reportAnalysis")
    public Map<String, Object> analizar(@RequestBody Consulta consulta) {
        if (consulta == null || consulta.desde() == null || consulta.hasta() == null
                || consulta.recipeId() == null || consulta.recipeId().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Fechas y receta son obligatorias");
        }
        if (consulta.hasta().isBefore(consulta.desde())) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "La fecha final no puede ser anterior a la inicial");
        }
        if (consulta.desde().isBefore(LocalDate.of(2000, 1, 1))
                || consulta.hasta().isAfter(LocalDate.now().plusDays(1))) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "El rango de fechas está fuera del intervalo permitido");
        }
        if (consulta.recipeId().length() > 160) {
            throw new ResponseStatusException(BAD_REQUEST, "Identificador de receta inválido");
        }

        // Limite MAX_FILAS+1 para identificar truncamiento sin una consulta COUNT.
        final String sql = """
            SELECT process_id, start_time, finish_time, prebatch,
                   recipe_id, name, tank_name, units, brix, density,
                   mass_setpoint, mass_accum, volume_setpoint, volume_accum,
                   sucrose_setpoint, sucrose_accum, fructose_setpoint, fructose_accum,
                   water_setpoint, water_accum
            FROM public.pb_recipes_executed_report_main
            WHERE recipe_id = :receta
              AND start_time >= :inicio
              AND start_time < :finExclusivo
            ORDER BY start_time DESC, process_id DESC
            LIMIT 501
            """;

        MapSqlParameterSource parametros = new MapSqlParameterSource()
                .addValue("receta", consulta.recipeId())
                .addValue("inicio", consulta.desde().atStartOfDay())
                .addValue("finExclusivo", consulta.hasta().plusDays(1).atStartOfDay());

        List<Map<String, Object>> resultados = jdbc.query(sql, parametros, (rs, n) -> {
            Map<String, Object> fila = new LinkedHashMap<>();
            fila.put("processId", rs.getInt("process_id"));
            fila.put("startTime", rs.getString("start_time"));
            fila.put("finishTime", rs.getString("finish_time"));
            fila.put("prebatch", rs.getInt("prebatch"));
            fila.put("recipeId", rs.getString("recipe_id"));
            fila.put("name", rs.getString("name"));
            fila.put("tankName", rs.getString("tank_name"));
            fila.put("units", rs.getObject("units"));
            fila.put("brix", rs.getObject("brix"));
            fila.put("density", rs.getObject("density"));
            fila.put("massSetpoint", rs.getObject("mass_setpoint"));
            fila.put("massAccum", rs.getObject("mass_accum"));
            fila.put("volumeSetpoint", rs.getObject("volume_setpoint"));
            fila.put("volumeAccum", rs.getObject("volume_accum"));
            fila.put("sucroseSetpoint", rs.getObject("sucrose_setpoint"));
            fila.put("sucroseAccum", rs.getObject("sucrose_accum"));
            fila.put("fructoseSetpoint", rs.getObject("fructose_setpoint"));
            fila.put("fructoseAccum", rs.getObject("fructose_accum"));
            fila.put("waterSetpoint", rs.getObject("water_setpoint"));
            fila.put("waterAccum", rs.getObject("water_accum"));
            return fila;
        });
        boolean limitado = resultados.size() > MAX_FILAS;
        List<Map<String, Object>> datos = limitado
                ? resultados.subList(0, MAX_FILAS)
                : resultados;
        return Map.of("data", datos, "limited", limitado, "maxRows", MAX_FILAS);
    }
}
