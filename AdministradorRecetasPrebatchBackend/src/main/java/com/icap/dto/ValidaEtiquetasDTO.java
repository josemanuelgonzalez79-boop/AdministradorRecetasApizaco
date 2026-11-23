package com.icap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidaEtiquetasDTO {
    
    private String presentation_id;
    private Integer presentation_batch;
    private Integer presentation_serial;

}