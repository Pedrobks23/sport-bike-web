export function cleanSeparators(s = "") {
  return s
    .replace(/,\s*/g, ", ")
    .replace(/;\s*/g, "; ")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function discoverFromOrder(order, bikeIndex = 0) {
  const bike =
    order?.bike ?? order?.bicicleta ?? order?.bicicletas?.[bikeIndex] ?? {};
  const servSrc =
    order?.servicos ??
    order?.serviços ??
    order?.services ??
    order?.itensServicos ??
    bike?.servicos ??
    bike?.serviços ??
    bike?.services ??
    bike?.itensServicos ??
    [];
  const pecasSrc =
    order?.pecas ??
    order?.peças ??
    order?.parts ??
    order?.itensPecas ??
    bike?.pecas ??
    bike?.peças ??
    bike?.parts ??
    bike?.itensPecas ??
    [];

  const norm = (arr) =>
    Array.isArray(arr)
      ? arr.map((it) =>
          typeof it === "string"
            ? { nome: cleanSeparators(it), quantidade: 1, preco: undefined }
            : {
                nome: cleanSeparators(
                  it?.nome ??
                    it?.name ??
                    it?.titulo ??
                    it?.descricao ??
                    it?.description ??
                    ""
                ),
                quantidade: Number(it?.quantidade ?? it?.qtd ?? it?.qty ?? 1),
                preco: Number(
                  it?.preco ?? it?.price ?? it?.valor ?? it?.valorUnit ?? 0
                ),
              }
        )
      : [];

  return {
    servicos: norm(servSrc),
    pecas: norm(pecasSrc),
    bikeModel:
      order?.bicicletaModelo ??
      bike?.modelo ??
      order?.bicicletas?.[bikeIndex]?.modelo ??
      "—",
    cliente: order?.clienteNome ?? order?.cliente?.nome ?? "—",
    telefone: order?.clienteTelefone ?? order?.cliente?.telefone ?? "—",
    codigoOS: String(order?.codigo ?? order?.codigoOS ?? order?.id ?? "OS"),
  };
}

function brl(v) {
  return Number(v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function writeFlow(doc, lines, start, x, y, maxW, lineH, bottom) {
  let yy = y;
  let i = start;
  for (; i < lines.length; i++) {
    const chunks = doc.splitTextToSize(lines[i], maxW);
    for (const c of chunks) {
      if (yy > bottom) {
        return { y: yy, next: i, overflow: true };
      }
      doc.text(c, x, yy);
      yy += lineH;
    }
  }
  return { y: yy, next: i, overflow: false };
}

export function renderSingleTag(doc, tag, rect, options = {}) {
  const { x, y, w, h } = rect;
  const PAD = 8;
  const left = x + PAD;
  const top = y + PAD;
  const bottom = y + h - PAD;
  const maxW = w - PAD * 2;
  const baseLineH = 6.2;

  const startService = options.serviceIndex ?? 0;
  const startPart = options.partIndex ?? 0;

  if (options.drawFrame) {
    doc.setDrawColor(0);
    doc.setLineDash([3, 3], 0);
    doc.setLineWidth(0.8);
    doc.rect(x, y, w, h);
    doc.setLineDash([]);
  }

  const servicesLines = tag.servicos.length
    ? tag.servicos.map(
        (it) =>
          `• ${it.nome}  (${it.quantidade}x)${
            it.preco != null ? ` = ${brl(it.preco * it.quantidade)}` : ""
          }`
      )
    : ["—"];
  const partsLines = tag.pecas.length
    ? tag.pecas.map(
        (it) =>
          `• ${it.nome}  (${it.quantidade}x)${
            it.preco != null ? ` = ${brl(it.preco * it.quantidade)}` : ""
          }`
      )
    : ["—"];

  const sizes = [12, 11, 10, 9];
  let chosen = sizes[sizes.length - 1];
  let lineH = baseLineH;

  for (const s of sizes) {
    const lh = Math.max(5.2, baseLineH - (12 - s) * 0.3);
    let yy = top;
    yy += lh * doc.splitTextToSize(`${tag.codigoOS} | BIKE 1`, maxW).length;
    yy += lh * doc.splitTextToSize(tag.cliente, maxW).length;
    yy += lh * doc.splitTextToSize(`Tel: ${tag.telefone}`, maxW).length;
    yy += lh * doc.splitTextToSize(tag.bikeModel, maxW).length;
    if (startService < servicesLines.length) {
      yy += lh;
      for (let i = startService; i < servicesLines.length; i++) {
        yy += lh * doc.splitTextToSize(servicesLines[i], maxW).length;
      }
      yy += 2;
    }
    if (startPart < partsLines.length) {
      yy += lh;
      for (let i = startPart; i < partsLines.length; i++) {
        yy += lh * doc.splitTextToSize(partsLines[i], maxW).length;
      }
    }
    yy += lh + 2;
    if (yy <= bottom) {
      chosen = s;
      lineH = lh;
      break;
    }
  }

  doc.setFontSize(chosen);
  doc.setFont("helvetica", "bold");
  let yy = top;
  const headerChunks = doc.splitTextToSize(`${tag.codigoOS} | BIKE 1`, maxW);
  headerChunks.forEach((t) => {
    doc.text(t, left, yy);
    yy += lineH;
  });
  doc.text(tag.cliente, left, yy);
  yy += lineH;
  doc.setFont("helvetica", "normal");
  doc.text(`Tel: ${tag.telefone}`, left, yy);
  yy += lineH;
  doc.setFont("helvetica", "bold");
  doc.text(tag.bikeModel, left, yy);
  yy += lineH;

  doc.setFont("helvetica", "bold");
  let nextService = startService;
  if (startService < servicesLines.length) {
    doc.text("SERVIÇOS:", left, yy);
    yy += lineH;
    doc.setFont("helvetica", "normal");
    const svc = writeFlow(
      doc,
      servicesLines,
      startService,
      left,
      yy,
      maxW,
      lineH,
      bottom
    );
    yy = svc.y + 2;
    nextService = svc.next;
    if (svc.overflow) {
      return { overflow: true, nextService, nextPart: startPart };
    }
    doc.setFont("helvetica", "bold");
  }

  let nextPart = startPart;
  if (startPart < partsLines.length) {
    doc.text("PEÇAS:", left, yy);
    yy += lineH;
    doc.setFont("helvetica", "normal");
    const part = writeFlow(
      doc,
      partsLines,
      startPart,
      left,
      yy,
      maxW,
      lineH,
      bottom
    );
    yy = part.y + 3;
    nextPart = part.next;
    if (part.overflow) {
      return { overflow: true, nextService, nextPart };
    }
    doc.setFont("helvetica", "bold");
  }

  const subtotal = tag.pecas.reduce(
    (a, b) => a + Number(b.preco ?? 0) * Number(b.quantidade ?? 1),
    0
  );
  const label = `SUBTOTAL: ${brl(subtotal)}`;
  const textW = doc.getTextWidth(label);
  const barH = Math.max(6, lineH);
  if (yy + barH > bottom) {
    return { overflow: true, nextService, nextPart };
  }
  doc.setFillColor(220);
  doc.rect(left, yy, Math.max(textW + 6, 58), barH, "F");
  doc.setTextColor(0);
  doc.text(label, left + 3, yy + barH - 2);
  yy += barH;

  return { overflow: false, nextService, nextPart, height: yy - y + PAD };
}

