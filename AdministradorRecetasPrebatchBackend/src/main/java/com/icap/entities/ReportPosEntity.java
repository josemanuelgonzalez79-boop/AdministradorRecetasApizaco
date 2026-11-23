package com.icap.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReportPosEntity {
    
    private Integer processId;
    private Integer position;
    private Boolean manual;
    private Double water;
    private String updateTime;

}
