package com.icap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NuevaPresentacionDTO {
    
    private String nuevaPresentation_id;
    private String nuevaPresentation_name;
    private String nuevaRecipe_reference;
    private String nuevoC01_id;

}