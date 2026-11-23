package com.icap.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DatosPresentacionEntity {
    
    private String update_time;
    private String presentation_id;
    private String presentation_name;
    private String recipe_reference;
    private Double units;
    private String comments;
    private Integer version;
}
