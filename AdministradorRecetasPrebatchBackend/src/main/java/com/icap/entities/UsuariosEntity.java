package com.icap.entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UsuariosEntity {
    
    private Integer id;
    private String userName;
    private String role;

}
