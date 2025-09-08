import { jsPDF } from "jspdf";
import { discoverArrays, renderSingleTag } from "./tagPdfEngine.js";

export default function generateWorkshopTagsPDF(order, opts = {}) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 12;
  const rect = { x: margin, y: margin, w: W - margin * 2, h: H - margin * 2 };
  const tag = discoverArrays(order, opts.bikeIndex ?? 0);
  renderSingleTag(doc, tag, rect, { drawFrame: true });
  doc.save(`${tag.codigoOS}_tag.pdf`);
}
