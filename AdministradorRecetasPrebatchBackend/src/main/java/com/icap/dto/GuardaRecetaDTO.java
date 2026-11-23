package com.icap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuardaRecetaDTO {
    
    private String id;
    private Integer idNumeric;
    private String name;
    private Double mass;
    private Double brix;
    private Double density;
    private Integer type;
    private Double sucrose;
    private Double fructose;
    private Double water;
    private Integer agitationDuration;
    private Integer holdingDuration;
    private String comments;
    private Integer version;
    private String c01_id;
    private Integer c01_pos;
    private String c02_id;
    private Integer c02_pos;
    private String c03_id;
    private Integer c03_pos;
    private String c04_id;
    private Integer c04_pos;
    private String c05_id;
    private Integer c05_pos;
    private String c06_id;
    private Integer c06_pos;
    private String c07_id;
    private Integer c07_pos;
    private String c08_id;
    private Integer c08_pos;
    private String c09_id;
    private Integer c09_pos;
    private String c10_id;
    private Integer c10_pos;
    private String c11_id;
    private Integer c11_pos;
    private String c12_id;
    private Integer c12_pos;
    private String c13_id;
    private Integer c13_pos;
    private String c14_id;
    private Integer c14_pos;
    private String c15_id;
    private Integer c15_pos;
    private String c16_id;
    private Integer c16_pos;

}
