package com.icap.dto;

/**
 * Evento histórico y metadatos opcionales.
 * Los campos null indican datos que el SCADA todavía no registra.
 */
public record ReporteBitacoraEvento(
        Integer processId,
        Integer position,
        Integer step,
        String updateTime,
        Boolean manual,
        Double waterConfigured,
        String unitName,
        Integer cycleNumber,
        Double actualWaterKg,
        Double metaKg,
        Double durationSeconds
) {}
