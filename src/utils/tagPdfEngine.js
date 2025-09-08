
export function cleanSeparators(s = "") {
  return s
    .replace(/,\s*/g, ", ")
    .replace(/;\s*/g, "; ")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function discoverArrays(order, bikeIndex = 0) {
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

function writeFlow(doc, lines, x, y, maxW, lineH, bottom, newPage) {
  let yy = y;
  for (const line of lines) {
    const chunks = doc.splitTextToSize(line, maxW);
    for (const c of chunks) {
      if (yy > bottom) {
        newPage();
        yy = y;
      }
      doc.text(c, x, yy);
      yy += lineH;
    }
  }
  return yy;
}

export function renderSingleTag(doc, tag, rect, options = {}) {
  const { x, y, w, h } = rect;
  const PAD = 8;
  const left = x + PAD;
  const top = y + PAD;
  const bottom = y + h - PAD;
  const maxW = w - PAD * 2;

  const drawFrame = () => {
    if (options.drawFrame) {
      doc.setDrawColor(0);
      doc.setLineDash([3, 3], 0);
      doc.setLineWidth(0.8);
      doc.rect(x, y, w, h);
      doc.setLineDash([]);
    }
  };

  const header = () => {
    let yy = top;
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
    return yy;
  };

  const newPage = () => {
    doc.addPage();
    drawFrame();
    return header();
  };

  drawFrame();
  let yy = header();

  const baseLineH = 6.2;
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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("SERVIÇOS:", left, yy);
  yy += baseLineH;
  doc.setFont("helvetica", "normal");
  yy = writeFlow(doc, servicesLines, left, yy, maxW, baseLineH, bottom, () => {
    yy = newPage();
  });
  yy += 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("PEÇAS:", left, yy);
  yy += baseLineH;
  doc.setFont("helvetica", "normal");
  yy = writeFlow(doc, partsLines, left, yy, maxW, baseLineH, bottom, () => {
    yy = newPage();
  });

  yy += 3;
  const subtotal = tag.pecas.reduce(
    (a, b) => a + Number(b.preco ?? 0) * Number(b.quantidade ?? 1),
    0
  );
  const label = `SUBTOTAL: ${brl(subtotal)}`;
  const textW = doc.getTextWidth(label);
  const barH = 8;
  if (yy + barH > bottom) {
    yy = newPage();
  }
  doc.setFillColor(220);
  doc.rect(left, yy, Math.max(textW + 6, 58), barH, "F");
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(label, left + 3, yy + barH - 2);
}
