package com.icap.controller;

import com.icap.dto.ReporteBitacoraEvento;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Endpoint independiente: no altera el controlador existente ni el SCADA.
 * Solo publica los eventos realmente presentes en pb_recipes_progress.
 */
@RestController
@RequestMapping("api/v1/recetPrebatch")
@RequiredArgsConstructor
public class ReporteBitacoraController {

    private final NamedParameterJdbcTemplate jdbc;

    public record ReporteRequest(Integer processId) {}

    @PostMapping("reportLog")
    public Map<String, Object> reporteBitacora(@RequestBody ReporteRequest request) {
        if (request == null || request.processId() == null || request.processId() <= 0) {
            throw new IllegalArgumentException("processId es obligatorio y debe ser positivo");
        }

        List<ReporteBitacoraEvento> eventos = jdbc.query("""
            SELECT process_id, position, step, update_time, manual, water
            FROM public.pb_recipes_progress
            WHERE process_id = :processId
            ORDER BY update_time, position, step
            """, Map.of("processId", request.processId()), (rs, rowNum) ->
            new ReporteBitacoraEvento(
                rs.getInt("process_id"),
                rs.getInt("position"),
                rs.getInt("step"),
                rs.getString("update_time"),
                rs.getBoolean("manual"),
                (Double) rs.getObject("water"),
                null,  // unitName: pendiente SCADA
                null,  // cycleNumber: pendiente SCADA
                null,  // actualWaterKg: pendiente SCADA
                null,  // metaKg: pendiente SCADA
                null   // durationSeconds: pendiente SCADA
            )
        );
        return Map.of("data", eventos);
    }
}
