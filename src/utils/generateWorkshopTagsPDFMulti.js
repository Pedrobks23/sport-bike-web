import jsPDF from "jspdf";
import { discoverFromOrder, renderSingleTag } from "./tagPdfEngine";

// Layout da grade (A4)
const MARGIN = 10; // margem externa
const COLS = 2;
const ROWS = 3;
const GAP = 6;     // espaçamento entre células

export default function generateWorkshopTagsPDFMulti(osList /* array de OS */, opts = {}) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // calcula célula
  const totalGapX = GAP * (COLS - 1) + MARGIN * 2;
  const totalGapY = GAP * (ROWS - 1) + MARGIN * 2;
  const cellW = (pageW - totalGapX) / COLS;
  const cellH = (pageH - totalGapY) / ROWS;

  let i = 0;
  for (const order of osList) {
    const tag = discoverFromOrder(order, opts.bikeIndex ?? 0);

    const col = i % COLS;
    const row = Math.floor(i / COLS) % ROWS;

    if (i > 0 && row === 0 && col === 0) {
      doc.addPage();
    }

    const x = MARGIN + col * (cellW + GAP);
    const y = MARGIN + row * (cellH + GAP);

    // desenha a tag na célula usando o mesmo motor
    const r = renderSingleTag(
      doc,
      tag,
      { x, y, w: cellW, h: cellH },
      { drawFrame: true }
    );

    // Caso MUITO raro de overflow mesmo com auto-fit:
    // cria nova página e continua a tag na mesma posição
    if (r.overflow) {
      doc.addPage();
      renderSingleTag(doc, tag, { x, y, w: cellW, h: cellH }, { drawFrame: true });
    }

    i++;
  }

  // nome genérico
  doc.save("multi_tags.pdf");
}

