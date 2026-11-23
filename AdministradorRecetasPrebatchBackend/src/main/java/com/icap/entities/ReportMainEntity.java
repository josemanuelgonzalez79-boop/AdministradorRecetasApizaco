package com.icap.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReportMainEntity {
    
    private String startTime;
    private String finishTime;
    private Integer processId;
    private Integer prebatch;
    private String recipeId;
    private String name;
    private Double brix;
    private Double density;
    private String recipeType;
    private Integer units;
    private String userName;
    private String tankName;
    private Double massSetPoint;
    private Double massAccum;
    private Double volumeSetPoint;
    private Double volumeAccum;
    private Double sucroseSetPoint;
    private Double sucroseAccum;
    private Double fructoseSetPoint;
    private Double fructoseAccum;
    private Double waterSetPoint;
    private Double waterAccum;

}
