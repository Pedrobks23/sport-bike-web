// Motor único de PDF para TAGS — jsPDF
// - Descobre serviços/peças na OS e/ou na bicicleta
// - Desenha 1 tag dentro de um retângulo (usa fluxo vertical e wrap)
// - Nunca sobrepõe o nome da bike

import jsPDF from "jspdf";

// ------ Utils de formatação ------
export const brl = (v) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const clean = (s = "") =>
  String(s)
    .replace(/,\s*/g, ", ")
    .replace(/;\s*/g, "; ")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s{2,}/g, " ")
    .trim();

const normItems = (arr) =>
  Array.isArray(arr)
    ? arr.map((it) =>
        typeof it === "string"
          ? { nome: clean(it), quantidade: 1, preco: undefined }
          : {
              nome: clean(
                it?.nome ?? it?.name ?? it?.titulo ?? it?.descricao ?? it?.description ?? ""
              ),
              quantidade: Number(it?.quantidade ?? it?.qtd ?? it?.qty ?? 1),
              preco: it?.preco ?? it?.price ?? it?.valor ?? it?.valorUnit ?? undefined,
            }
      )
    : [];

// ------ Descoberta de dados (robusta) ------
export function discoverFromOrder(order, bikeIndex = 0) {
  const bikes = order?.bicicletas ?? [];
  const bike = bikes[bikeIndex] ?? order?.bike ?? order?.bicicleta ?? {};

  const pick = (o, keys) =>
    keys.map((k) => o?.[k]).find((x) => Array.isArray(x) && x.length) ?? [];

  const servKeys = [
    "servicos",
    "serviços",
    "services",
    "itensServicos",
    "itensServiços",
    "servicosSelecionados",
    "servicosSelecionadosLista",
  ];
  const pecasKeys = [
    "pecas",
    "peças",
    "parts",
    "itensPecas",
    "pecasSelecionadas",
    "itensPecasSelecionadas",
  ];

  const servOrder = pick(order, servKeys);
  const servBike = pick(bike, servKeys);
  const pecasOrder = pick(order, pecasKeys);
  const pecasBike = pick(bike, pecasKeys);

  // prioridade: bike > order, mas juntamos e removemos duplicatas por nome+preço
  const servicos = dedupeByKey([...normItems(servOrder), ...normItems(servBike)], (it) =>
    `${it.nome}@@${it.preco ?? "?"}`
  );
  const pecas = dedupeByKey([...normItems(pecasOrder), ...normItems(pecasBike)], (it) =>
    `${it.nome}@@${it.preco ?? "?"}`
  );

  return {
    codigoOS: String(order?.codigo ?? order?.codigoOS ?? order?.id ?? "OS"),
    cliente: String(order?.clienteNome ?? order?.cliente?.nome ?? "—"),
    telefone: String(order?.clienteTelefone ?? order?.cliente?.telefone ?? "—"),
    bikeModel: String(
      order?.bicicletaModelo ??
        bike?.modelo ??
        order?.bicicletas?.[bikeIndex]?.modelo ??
        "—"
    ),
    servicos,
    pecas,
  };
}

function dedupeByKey(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}

// ------ Motor de escrita (fluxo vertical) ------
function writeFlow(doc, lines, x, y, maxW, lineH, bottom) {
  let yy = y;
  for (const line of lines) {
    const chunks = doc.splitTextToSize(line, maxW);
    for (const c of chunks) {
      if (yy > bottom) return { y: yy, overflow: true };
      doc.text(c, x, yy);
      yy += lineH;
    }
  }
  return { y: yy, overflow: false };
}

function tryAutoFit(doc, painter) {
  // tenta 12, 11, 10, 9
  for (const size of [12, 11, 10, 9]) {
    doc.setFontSize(size);
    const ok = painter(Math.max(5.2, 6.2 - (12 - size) * 0.3));
    if (ok) return true;
  }
  return false;
}

// ------ API: renderiza UMA tag dentro do retângulo ------
export function renderSingleTag(doc, tag, rect, opts = {}) {
  const { x, y, w, h } = rect;
  const PAD = 8;
  const left = x + PAD;
  const top = y + PAD;
  const bottom = y + h - PAD;
  const maxW = w - PAD * 2;

  if (opts.drawFrame) {
    doc.setDrawColor(0);
    doc.setLineWidth(0.8);
    doc.setLineDash([3, 3], 0);
    doc.rect(x, y, w, h);
    doc.setLineDash([]);
  }

  let yy = top;

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${tag.codigoOS} | BIKE 1`, left, yy);
  yy += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(tag.cliente, left, yy);
  yy += 5.2;

  doc.setFont("helvetica", "normal");
  doc.text(`Tel: ${tag.telefone}`, left, yy);
  yy += 6.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(tag.bikeModel, left, yy);
  yy += 7.5;

  const serviceLines =
    tag.servicos?.length
      ? tag.servicos.map((it) => {
          const q = Number(it.quantidade ?? 1);
          const price =
            it.preco != null ? ` = ${brl(Number(it.preco) * q)}` : "";
          return `• ${it.nome}  (${q}x)${price}`;
        })
      : ["—"];

  const partLines =
    tag.pecas?.length
      ? tag.pecas.map((it) => {
          const q = Number(it.quantidade ?? 1);
          const price =
            it.preco != null ? ` = ${brl(Number(it.preco) * q)}` : "";
          return `• ${it.nome}  (${q}x)${price}`;
        })
      : ["—"];

  const painter = (lineH) => {
    let overflow = false;

    // SERVIÇOS
    doc.setFont("helvetica", "bold");
    doc.text("SERVIÇOS:", left, yy);
    yy += lineH + 0.5;

    doc.setFont("helvetica", "normal");
    let r = writeFlow(doc, serviceLines, left, yy, maxW, lineH, bottom);
    yy = r.y + 2;
    overflow = overflow || r.overflow;

    // PEÇAS
    doc.setFont("helvetica", "bold");
    doc.text("PEÇAS:", left, yy);
    yy += lineH + 0.5;

    doc.setFont("helvetica", "normal");
    r = writeFlow(doc, partLines, left, yy, maxW, lineH, bottom);
    yy = r.y + 3;
    overflow = overflow || r.overflow;

    // SUBTOTAL (peças)
    const subtotal = (tag.pecas ?? []).reduce(
      (acc, it) => acc + Number(it.preco ?? 0) * Number(it.quantidade ?? 1),
      0
    );
    const label = `SUBTOTAL: ${brl(subtotal)}`;

    const barH = Math.max(6, lineH);
    const textW = doc.getTextWidth(label);
    const yBar = Math.min(yy - (barH - 2), bottom - barH);

    doc.setFillColor(220);
    doc.rect(left, yBar, Math.max(textW + 6, 60), barH, "F");
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(label, left + 3, yBar + barH - 2);

    return !overflow;
  };

  const ok = tryAutoFit(doc, painter);
  return { overflow: !ok };
}

