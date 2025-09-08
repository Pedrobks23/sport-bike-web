import { jsPDF } from "jspdf";
import { discoverFromOrder, renderSingleTag } from "./tagPdfEngine.js";

export default function generateWorkshopTagsPDF(order, opts = {}) {
  const tag = discoverFromOrder(order, opts.bikeIndex ?? 0);

  const TAG_W = 160;
  const TAG_H_MIN = 120;
  const TAG_H_MAX = 200;

  const measureDoc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const measureRect = { x: 0, y: 0, w: TAG_W, h: TAG_H_MAX };
  const m = renderSingleTag(measureDoc, tag, measureRect, {});
  const tagH = Math.max(
    TAG_H_MIN,
    Math.min(TAG_H_MAX, m.height ?? TAG_H_MIN)
  );

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const rect = { x: (W - TAG_W) / 2, y: (H - tagH) / 2, w: TAG_W, h: tagH };
  renderSingleTag(doc, tag, rect, { drawFrame: true });
  doc.save(`${tag.codigoOS}_tag.pdf`);
}
