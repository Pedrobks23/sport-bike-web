import { jsPDF } from "jspdf";
import { discoverFromOrder, renderSingleTag } from "./tagPdfEngine.js";

function generateWorkshopTagsPDFMulti(selections) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const cols = 2;
  const rows = 3;
  const gapX = 10;
  const gapY = 10;
  const marginX = 10;
  const marginY = 10;
  const cellW = (W - marginX * 2 - gapX * (cols - 1)) / cols;
  const cellH = (H - marginY * 2 - gapY * (rows - 1)) / rows;
  const cellsPerPage = cols * rows;

  let slot = 0;

  selections.forEach((sel) => {
    if (slot >= cellsPerPage) {
      doc.addPage();
      slot = 0;
    }
    const col = slot % cols;
    const row = Math.floor(slot / cols);
    const rect = {
      x: marginX + col * (cellW + gapX),
      y: marginY + row * (cellH + gapY),
      w: cellW,
      h: cellH,
    };
    const tag = discoverFromOrder(
      sel.ordem ?? sel.order,
      sel.index ?? sel.bikeIndex ?? 0
    );

    let svcIndex = 0;
    let partIndex = 0;
    let result;
    do {
      result = renderSingleTag(doc, tag, rect, {
        drawFrame: true,
        serviceIndex: svcIndex,
        partIndex: partIndex,
      });
      svcIndex = result.nextService;
      partIndex = result.nextPart;
      if (result.overflow) {
        doc.addPage();
      }
    } while (result.overflow);

    slot++;
  });

  doc.save(`OS-Tags-Oficina.pdf`);
}

export default generateWorkshopTagsPDFMulti;
