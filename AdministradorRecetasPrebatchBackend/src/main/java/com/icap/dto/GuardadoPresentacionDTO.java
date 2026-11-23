package com.icap.dto;

import java.sql.Date;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuardadoPresentacionDTO {

    private Date update_time;
    private String presentation_id;
    private String presentation_name;
    private String recipe_reference;
    private Double units;
    private String c01_id;
    private String c02_id;
    private String c03_id;
    private String c04_id;
    private String c05_id;
    private String comments;
    private Integer version; 
}
