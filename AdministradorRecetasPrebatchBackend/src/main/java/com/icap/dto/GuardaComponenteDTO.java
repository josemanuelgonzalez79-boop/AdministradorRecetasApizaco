package com.icap.dto;

import java.time.Duration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuardaComponenteDTO {
    
    private Boolean agitationAutomatic;
    private String agitationDuration;
    private Boolean bayonet;
    private Boolean circulate;
    private String comments;
    private Boolean directWaterLoad;
    private Boolean hard;
    private String id;
    private Boolean liquidsTank;
    private Double mass;
    private String name;
    private Boolean noInventoryValidation;
    private Boolean obsolete;
    private String recipeReference;
    private Double temp;
    private Integer type;
    private Integer version;
    private Double water;
    private Boolean t01;
    private Boolean t02;
    private Boolean ibc;
    private Boolean tn01;
    private Boolean b01;
    private Boolean agitationAutomatic2;
    private String agitationDuration2;
    private String comments2;
    private Boolean directWaterLoad2;
    private Double water2;
}