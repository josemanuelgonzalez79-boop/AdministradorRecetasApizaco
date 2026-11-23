package com.icap.entities;

import java.sql.Timestamp;
import java.time.Duration;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ComponentsFullEntity {
    
    private String id;
    private String name;
    private String recipeReference;
    private Double mass;
    private Double water;
    private Double temp;
    private Boolean obsolete;
    private String comments;
    private Integer type;
    private Timestamp updateTime;
    private Integer version;
    private Boolean bayonet;
    private Boolean hard;
    private Boolean agitationAutomatic;
    private Duration agitationDuration;
    private Boolean circulate;
    private Boolean noInventoryValidation;
    private Boolean liquidsTank;
    private Boolean directWaterLoad;
    private Boolean t01;
    private Boolean t02;
    private Boolean ibc;
    private Boolean tn01;
    private Boolean b01;
    private Boolean agitationAutomatic2;
    private Duration agitationDuration2;
    private String comments2;
    private Boolean directWaterLoad2;
    private Double water2;
}