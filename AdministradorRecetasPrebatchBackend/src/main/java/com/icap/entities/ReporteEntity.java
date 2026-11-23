package com.icap.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReporteEntity {
    
    private String fecha;
    private Integer processId;
    private Integer prebatch;
    private String recipeId;
    private String name;
    private String tankName;
    private Double sucroseAccum;
    private Double fructoseAccum;
    private Double waterAccum;

}
