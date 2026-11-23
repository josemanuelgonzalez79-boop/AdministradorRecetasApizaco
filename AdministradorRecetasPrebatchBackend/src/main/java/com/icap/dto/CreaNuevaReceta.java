package com.icap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreaNuevaReceta {

    private String id;
    private String nombre;
    private Integer idNumeric;
    private Float jarabe;
    private Float brix;
    private Float densidad;
    private Integer tipo;
    private Float sacarosa;
    private Float fructosa;
    private Float agua;
    private String componente;

}
