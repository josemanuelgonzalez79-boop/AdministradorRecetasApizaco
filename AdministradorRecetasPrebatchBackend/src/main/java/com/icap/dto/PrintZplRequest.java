package com.icap.dto;

import lombok.Data;

@Data
public class PrintZplRequest {
  private String zpl;
  private Integer copies;
  private String printerIp;
  private String printerName;
}
