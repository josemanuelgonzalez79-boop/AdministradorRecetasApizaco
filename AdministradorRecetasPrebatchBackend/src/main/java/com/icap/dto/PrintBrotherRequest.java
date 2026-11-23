// com.icap.dto.PrintBrotherRequest.java
package com.icap.dto;

import java.util.List;

public class PrintBrotherRequest {
    private List<String> barcodes;
    private String ref;
    private String name;
    private Integer copies;
    private String printerName;

    public List<String> getBarcodes() {
        return barcodes;
    }
    public void setBarcodes(List<String> barcodes) {
        this.barcodes = barcodes;
    }

    public String getRef() {
        return ref;
    }
    public void setRef(String ref) {
        this.ref = ref;
    }

    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }

    public Integer getCopies() {
        return copies;
    }
    public void setCopies(Integer copies) {
        this.copies = copies;
    }

    public String getPrinterName() {
        return printerName;
    }
    public void setPrinterName(String printerName) {
        this.printerName = printerName;
    }
}
