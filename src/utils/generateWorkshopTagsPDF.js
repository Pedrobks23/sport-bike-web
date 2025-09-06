// src/utils/generateWorkshopTagsPDF.js
// Gera 1 tag por página (A4) com fluxo vertical dinâmico
// - Não corta itens longos
// - Lista "Serviços" e "Peças" inteiras antes do SUBTOTAL
// - Paginação automática se necessário
// - Sem barras pretas sobre o nome da bicicleta

import jsPDF from "jspdf";

// ---------- Helpers ----------
function brl(v) {
  const n = Number(v ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function val(x, ...alts) {
  for (const k of [x, ...alts]) if (k !== undefined && k !== null) return k;
  return undefined;
}
function extractServicos(order) {
  const src = val(order?.servicos, order?.serviços, order?.services) ?? [];
  return normalizeItemArray(src);
}
function extractPecas(order) {
  const src = val(order?.pecas, order?.peças, order?.parts, order?.itensPecas) ?? [];
  return normalizeItemArray(src);
}
function normalizeItemArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((it) => {
    if (typeof it === "string") return { nome: it, quantidade: 1, preco: undefined };
    return {
      nome: val(it?.nome, it?.name, it?.titulo, it?.descricao, it?.description) ?? "",
      quantidade: val(it?.quantidade, it?.qtd, it?.qty, 1),
      preco: val(it?.preco, it?.price, it?.valor, it?.valorUnit, 0),
    };
  });
}
function formatItemLine(it) {
  const q = Number(it.quantidade ?? 1);
  const preco = it.preco != null ? ` = ${brl(it.preco)}` : "";
  return `• ${String(it.nome)}  (${q}x)${preco}`;
}
function sum(arr) {
  return arr.reduce((acc, it) => acc + Number(it.preco ?? 0) * Number(it.quantidade ?? 1), 0);
}
function writeLines(doc, lines, x, y, maxWidth, lineHeight, bottomLimit) {
  let yy = y;
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, maxWidth);
    for (const w of wrapped) {
      if (yy > bottomLimit) {
        doc.addPage();
        yy = drawPageFrame(doc);
      }
      doc.text(w, x, yy);
      yy += lineHeight;
    }
  }
  return yy;
}
function drawPageFrame(doc) {
  const m = 12;
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setDrawColor(0);
  doc.setLineWidth(0.8);
  doc.setLineDash([3, 3], 0);
  doc.rect(m, m, W - m * 2, H - m * 2);
  doc.setLineDash([]);
  return m + 10;
}

// ---------- Main ----------
export default function generateWorkshopTagsPDF(order) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const marginX = 18;
  const maxWidth = doc.internal.pageSize.getWidth() - marginX * 2;
  const line = 6.2;
  let y = drawPageFrame(doc);

  // Cabeçalho (OS + bike label)
  const codigoOS = val(order?.codigo, order?.codigoOS, order?.id, "OS");
  const bikeLabel = "BIKE 1"; // se houver índice específico, ajuste na chamada

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(`${codigoOS} | ${bikeLabel}`, marginX, y);
  y += 10;

  // Cliente + Telefone
  const cliente = val(order?.clienteNome, order?.cliente?.nome, "—");
  const tel = val(order?.clienteTelefone, order?.cliente?.telefone, "—");
  doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text(String(cliente), marginX, y); y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`Tel: ${String(tel)}`, marginX, y); y += 8;

  // Nome/Modelo da Bike (sem barras/linhas por cima)
  const modelo = val(order?.bicicletaModelo, order?.bike?.modelo, order?.bicicletas?.[0]?.modelo) ?? "—";
  doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text(String(modelo), marginX, y);
  // Se quiser sublinhado fino, desenhe ABAIXO do texto:
  // doc.setDrawColor(0); doc.setLineWidth(0.5);
  // doc.line(marginX, y + 2.5, marginX + maxWidth, y + 2.5);
  y += 9;

  // SERVIÇOS
  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("SERVIÇOS:", marginX, y); y += 7;
  doc.setFont("helvetica", "normal"); doc.setFontSize(12);
  const servicos = extractServicos(order);
  if (servicos.length) {
    const linesServ = servicos.map(formatItemLine);
    y = writeLines(doc, linesServ, marginX, y, maxWidth, line, doc.internal.pageSize.getHeight() - 22);
  } else {
    y = writeLines(doc, ["—"], marginX, y, maxWidth, line, doc.internal.pageSize.getHeight() - 22);
  }
  y += 2;

  // PEÇAS
  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("PEÇAS:", marginX, y); y += 7;
  doc.setFont("helvetica", "normal"); doc.setFontSize(12);
  const pecas = extractPecas(order);
  if (pecas.length) {
    const linesPecas = pecas.map(formatItemLine);
    y = writeLines(doc, linesPecas, marginX, y, maxWidth, line, doc.internal.pageSize.getHeight() - 28);
  } else {
    y = writeLines(doc, ["—"], marginX, y, maxWidth, line, doc.internal.pageSize.getHeight() - 28);
  }

  // SUBTOTAL (após tudo)
  y += 4;
  const subtotalPecas = sum(pecas);
  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  const text = `SUBTOTAL: ${brl(subtotalPecas)}`;
  const textW = doc.getTextWidth(text);
  const barH = 8;
  const xBar = marginX;
  const yBar = y - 6;
  doc.setFillColor(220); // cinza claro
  doc.rect(xBar, yBar, Math.max(textW + 6, 60), barH, "F");
  doc.setTextColor(0);
  doc.text(text, xBar + 3, yBar + barH - 2);

  doc.save(`${String(codigoOS)}_tag.pdf`);
}
