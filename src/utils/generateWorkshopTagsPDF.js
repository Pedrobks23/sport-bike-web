import jsPDF from "jspdf";
import { discoverFromOrder, renderSingleTag } from "./tagPdfEngine";

// Medidas base da tag (largura fixa, altura auto)
const PAGE_MARGIN = 10;     // margem da página
const TAG_W = 160;          // largura da tag (economiza papel)
const TAG_MIN_H = 110;      // altura mínima
const TAG_MAX_H = 210;      // altura máxima (não ocupa a página inteira)

/**
 * Imprime UMA TAG no topo/esquerda, usando apenas o espaço necessário.
 */
export default function generateWorkshopTagsPDF(order, opts = {}) {
  const { bikeIndex = 0 } = opts;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });

  // Monta dados
  const tag = discoverFromOrder(order, bikeIndex);

  // Para estimar a altura, usamos um retângulo alto, renderizamos “a seco” em uma página
  // oculta e medimos o último Y. Como jsPDF não tem “medir sem pintar”, fazemos um
  // truque simples: renderizamos uma vez, calculamos altura (delta), limpamos, e
  // renderizamos de verdade.
  // (Para manter simples e robusto, usamos uma aproximação com limites min/max.)
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // tentativa 1: altura média
  let tagH = 150;

  // 1ª passagem (medição)
  renderSingleTag(
    doc,
    tag,
    {
      x: PAGE_MARGIN,
      y: PAGE_MARGIN,
      w: TAG_W,
      h: TAG_MAX_H, // grande o suficiente para caber
    },
    { drawFrame: false }
  );
  // NÃO temos delta Y diretamente, então usamos TAG_MAX_H como teto e
  // aplicamos um fator conservador: se subtotal coube bem acima do bottom,
  // a altura real é menor; vamos usar uma altura “segura” = 150 (ajustável).
  // Para evitar “página suja”, criamos nova página e desenhamos valendo.
  doc.addPage();

  // clamp final
  tagH = Math.max(TAG_MIN_H, Math.min(TAG_MAX_H, tagH));

  // Posição TOP-LEFT (economiza papel)
  const rect = {
    x: PAGE_MARGIN,
    y: PAGE_MARGIN,
    w: TAG_W,
    h: tagH,
  };

  renderSingleTag(doc, tag, rect, { drawFrame: true });

  doc.save(`${tag.codigoOS}_tag.pdf`);
}

