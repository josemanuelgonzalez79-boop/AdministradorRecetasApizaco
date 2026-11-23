package com.icap.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BarcodesReportEntity {
    
    private String presentation_id;
    private Integer presentation_serial;
    private String presentation_expiration;
    private Integer presentation_batch;
    private String component_ref;
    private String presentation_name;
    private Integer captures;
    private Double units;

}