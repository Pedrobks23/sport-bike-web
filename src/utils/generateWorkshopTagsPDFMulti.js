import { jsPDF } from "jspdf";
import { discoverArrays, renderSingleTag } from "./tagPdfEngine.js";

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
  const tagW = (W - marginX * 2 - gapX * (cols - 1)) / cols;
  const tagH = (H - marginY * 2 - gapY * (rows - 1)) / rows;
  const tagsPerPage = cols * rows;

  let slot = 0;

  selections.forEach((sel) => {
    if (slot >= tagsPerPage) {
      doc.addPage();
      slot = 0;
    }
    const col = slot % cols;
    const row = Math.floor(slot / cols);
    const rect = {
      x: marginX + col * (tagW + gapX),
      y: marginY + row * (tagH + gapY),
      w: tagW,
      h: tagH,
    };
    const tag = discoverArrays(sel.ordem ?? sel.order, sel.index ?? sel.bikeIndex ?? 0);
    const startPages = doc.getNumberOfPages();
    renderSingleTag(doc, tag, rect, { drawFrame: true });
    const endPages = doc.getNumberOfPages();
    if (endPages > startPages) {
      slot = tagsPerPage; // force new page for next tag
    } else {
      slot++;
    }
  });

  doc.save(`OS-Tags-Oficina.pdf`);
}

export default generateWorkshopTagsPDFMulti;
