package com.icap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class GuardaEtiquetasDTO {
    
    private String presentation_id;
    private Integer presentation_batch;
    private String presentation_expiration;
    private Integer presentation_serial;

}