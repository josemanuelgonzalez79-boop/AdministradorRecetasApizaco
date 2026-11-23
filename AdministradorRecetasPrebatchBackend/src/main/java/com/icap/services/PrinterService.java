package com.icap.services;

import org.springframework.stereotype.Service;

import com.icap.dto.PrintBrotherRequest;
import com.icap.dto.PrintZplRequest;

// ZXing
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.client.j2se.MatrixToImageWriter;

// Impresión Java
import javax.print.Doc;
import javax.print.DocFlavor;
import javax.print.DocPrintJob;
import javax.print.PrintService;
import javax.print.PrintServiceLookup;
import javax.print.SimpleDoc;
import javax.print.attribute.HashPrintRequestAttributeSet;

// AWT / gráficos
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.print.PageFormat;
import java.awt.print.Printable;
import java.awt.print.PrinterJob;
import java.awt.image.BufferedImage;

// Otros
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.awt.print.Paper;


@Service
public class PrinterService {

    // ================== ZEBRA (ZPL) ==================
    public void print(PrintZplRequest req) throws Exception {
        int copies = (req.getCopies() == null || req.getCopies() < 1) ? 1 : req.getCopies();

        for (int i = 0; i < copies; i++) {
            if (req.getPrinterIp() != null && !req.getPrinterIp().isBlank()) {
                printRaw9100(req.getPrinterIp(), 9100, req.getZpl());
            } else if (req.getPrinterName() != null && !req.getPrinterName().isBlank()) {
                printToWindowsSpool(req.getPrinterName(), req.getZpl());
            } else {
                throw new IllegalArgumentException("Especifique printerIp o printerName");
            }
        }
    }

    private void printRaw9100(String ip, int port, String zpl) throws Exception {
        try (Socket s = new Socket()) {
            s.connect(new java.net.InetSocketAddress(ip, port), 4000);
            s.setSoTimeout(4000);
            try (OutputStream os = s.getOutputStream()) {
                os.write(zpl.getBytes(StandardCharsets.US_ASCII));
                os.flush();
            }
        }
    }

    private void printToWindowsSpool(String printerName, String zpl) throws Exception {
        DocFlavor flavor = DocFlavor.BYTE_ARRAY.AUTOSENSE;
        PrintService[] services = PrintServiceLookup.lookupPrintServices(null, null);
        PrintService target = null;
        for (PrintService ps : services) {
            if (ps.getName().equalsIgnoreCase(printerName) || ps.getName().contains(printerName)) {
                target = ps;
                break;
            }
        }
        if (target == null) throw new IllegalStateException("No se encontró la impresora: " + printerName);

        DocPrintJob job = target.createPrintJob();
        Doc doc = new SimpleDoc(zpl.getBytes(StandardCharsets.UTF_8), flavor, null);
        job.print(doc, new HashPrintRequestAttributeSet());
    }

    // NUEVO: IMPRESIÓN PARA BROTHER QL-800 (USB / SPOOL WINDOWS)

    public void printBrother(PrintBrotherRequest req) throws Exception {
        List<String> barcodes = req.getBarcodes();
        if (barcodes == null || barcodes.isEmpty()) {
            throw new IllegalArgumentException("No se recibieron códigos para imprimir");
        }

            System.out.println("[BROTHER] barcodes=" + barcodes
            + " ref=" + req.getRef()
            + " name=" + req.getName());

        String printerName = (req.getPrinterName() == null || req.getPrinterName().isBlank())
                ? "Brother QL-800"
                : req.getPrinterName();

        PrintService brother = findPrintServiceByName(printerName);
        if (brother == null) {
            throw new IllegalStateException("No se encontró la impresora Brother: " + printerName);
        }

        int copies = (req.getCopies() == null || req.getCopies() < 1) ? 1 : req.getCopies();

        for (int c = 0; c < copies; c++) {
            for (String code : barcodes) {
                printSingleLabel(brother, code, req.getRef(), req.getName());
            }
        }
    }

    private PrintService findPrintServiceByName(String name) {
        PrintService[] services = PrintServiceLookup.lookupPrintServices(null, null);
        for (PrintService ps : services) {
            if (ps.getName().equalsIgnoreCase(name) || ps.getName().contains(name)) {
                return ps;
            }
        }
        return null;
    }

  private void printSingleLabel(PrintService printer, String barcode, String ref, String name) throws Exception {
      PrinterJob job = PrinterJob.getPrinterJob();
      job.setPrintService(printer);

      PageFormat pf = job.defaultPage();

      // === Papel 62mm x 100mm (ancho real del rollo = 62mm) ===
      double mmToPoints = 72.0 / 25.4; // 1 mm en puntos
      double paperWidth  = 62 * mmToPoints;   // ANCHO del rollo
      double paperHeight = 100 * mmToPoints;  // LONGITUD de la etiqueta

      Paper paper = new Paper();
      paper.setSize(paperWidth, paperHeight);

      // Usa casi toda el área imprimible (si quieres, deja 1mm de margen real)
      double marginMm = 1.0;
      double marginPt = marginMm * mmToPoints;
      paper.setImageableArea(
              marginPt,             // x
              marginPt,             // y
              paperWidth  - 2*marginPt,
              paperHeight - 2*marginPt
      );

      pf.setPaper(paper);
      pf.setOrientation(PageFormat.LANDSCAPE); // etiqueta horizontal

      // --- de aquí hacia abajo deja tal cual el código que ya tienes ---
      Printable printable = (graphics, pageFormat, pageIndex) -> {
          if (pageIndex > 0) return Printable.NO_SUCH_PAGE;

          Graphics2D g2 = (Graphics2D) graphics;
          g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

          double w  = pageFormat.getImageableWidth();
          double h  = pageFormat.getImageableHeight();
          double x0 = pageFormat.getImageableX();
          double y0 = pageFormat.getImageableY();

          String data = (barcode == null) ? "" : barcode.trim();
          if (data.isEmpty()) return Printable.PAGE_EXISTS;

          // === Márgenes internos relativos (muy pequeños) ===
          double sideMarginFrac   = 0.03;
          double topMarginFrac    = 0.04;
          double bottomMarginFrac = 0.04;

          double sideMargin   = w * sideMarginFrac;
          double topMargin    = h * topMarginFrac;
          double bottomMargin = h * bottomMarginFrac;

          double usableWidth  = w - 2 * sideMargin;
          double usableHeight = h - topMargin - bottomMargin;

          // Barras ~68%, número ~14%, descripción ~18%
          double barHeight  = usableHeight * 0.68;
          double hriHeight  = usableHeight * 0.14;
          double descHeight = usableHeight * 0.18;

          int xBar = (int) Math.round(x0 + sideMargin);
          int yBar = (int) Math.round(y0 + topMargin);
          int barW = (int) Math.round(usableWidth);
          int barH = (int) Math.round(barHeight);

          // ===== CÓDIGO DE BARRAS =====
          BufferedImage barcodeImg;
          try {
              barcodeImg = generateCode128BarcodeImage(data, barW, barH);
          } catch (Exception e) {
              e.printStackTrace();
              return Printable.PAGE_EXISTS;
          }
          g2.drawImage(barcodeImg, xBar, yBar, barW, barH, null);

          // ===== NÚMERO =====
          String hri = digitsOnly(data);
          if (!hri.isEmpty()) {
              int maxTextWidth = barW;
              int fontSize = (int) Math.round(hriHeight * 0.8);

              Font font;
              FontMetrics fm;
              do {
                  font = new Font("Arial", Font.BOLD, fontSize);
                  g2.setFont(font);
                  fm = g2.getFontMetrics();
                  if (fm.stringWidth(hri) <= maxTextWidth || fontSize <= 7) break;
                  fontSize--;
              } while (true);

              int hriWidth = fm.stringWidth(hri);
              int hriX = (int) Math.round(x0 + (w - hriWidth) / 2);
              int hriBaseline = yBar + barH + fm.getAscent() + 2;
              g2.drawString(hri, hriX, hriBaseline);

              // ===== DESCRIPCIÓN =====
              String line = "";
              if (ref != null && !ref.isBlank()) line += ref.trim();
              if (name != null && !name.isBlank()) {
                  if (!line.isEmpty()) line += "  ";
                  line += name.trim();
              }

              if (!line.isEmpty()) {
                  int descFontSize = (int) Math.round(descHeight * 0.7);
                  do {
                      font = new Font("Arial", Font.PLAIN, descFontSize);
                      g2.setFont(font);
                      fm = g2.getFontMetrics();
                      if (fm.stringWidth(line) <= maxTextWidth || descFontSize <= 7) break;
                      descFontSize--;
                  } while (true);

                  String descToPrint = line;
                  if (fm.stringWidth(descToPrint) > maxTextWidth) {
                      descToPrint = clipToWidth(descToPrint, fm, maxTextWidth);
                  }

                  int lineWidth = fm.stringWidth(descToPrint);
                  int lineX = (int) Math.round(x0 + (w - lineWidth) / 2);
                  int lineY = hriBaseline + fm.getHeight() + 2;
                  g2.drawString(descToPrint, lineX, lineY);
              }
          }

          return Printable.PAGE_EXISTS;
      };

      job.setPrintable(printable, pf);
      job.print();
  }

  private String digitsOnly(String s) {
      return (s == null) ? "" : s.replaceAll("\\D+", "");
  }

  private BufferedImage generateCode128BarcodeImage(String data, int width, int height) throws Exception {
      Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
      // Reducimos margen interno para que no se desperdicie ancho
      hints.put(EncodeHintType.MARGIN, 2);

      BitMatrix bitMatrix = new MultiFormatWriter()
              .encode(data, BarcodeFormat.CODE_128, width, height, hints);

      return MatrixToImageWriter.toBufferedImage(bitMatrix);
  }

    private String clipToWidth(String text, FontMetrics fm, int maxWidth) {
        if (fm.stringWidth(text) <= maxWidth) return text;
        String ellipsis = "...";
        int ellipsisW = fm.stringWidth(ellipsis);
        StringBuilder sb = new StringBuilder();
        for (char ch : text.toCharArray()) {
            sb.append(ch);
            if (fm.stringWidth(sb.toString()) + ellipsisW > maxWidth) {
                return sb.toString() + ellipsis;
            }
        }
        return text;
    }

    //método para loguear impresoras disponibles
    public void logAvailablePrinters() {
        PrintService[] services = PrintServiceLookup.lookupPrintServices(null, null);
        System.out.println("=== Impresoras detectadas por Java ===");
        for (PrintService ps : services) {
            System.out.println(" - " + ps.getName());
        }
    }
}
