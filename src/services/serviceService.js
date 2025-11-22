import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import { fallbackServices } from "@/constants/fallbackData";

// util: normaliza preço vindo como string "R$ 100,00", "100.00", number, etc.
function toNumber(val) {
  if (typeof val === "number") return val;
  if (val == null) return 0;
  const s = String(val).trim();
  // remove R$, espaços e símbolos; troca vírgula por ponto
  const n = Number(s.replace(/[^\d,.-]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

/**
 * Lê serviços (preferindo `servicosList`) e ordena por nome.
 * Mantém compatibilidade com o Home.jsx que usa:
 *   const data = await getAllServicesOrdered()
 *   setOfficeServices(data.map((s) => s.nome))
 */
export async function getAllServicesOrdered() {
  // 1) Tenta coleção nova `servicosList`
  try {
    const listSnap = await getDocs(collection(db, "servicosList"));
    const itens = [];
    listSnap.forEach((doc) => {
      const d = doc.data() || {};
      if (!d.nome) return;
      itens.push({
        id: doc.id,
        nome: d.nome,
        descricao: d.descricao || "",
        valor: toNumber(d.valor),
      });
    });
    if (itens.length > 0) {
      itens.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      return itens;
    }
  } catch (e) {
    // se a coleção não existir, segue para o fallback
    console.warn("[serviceService] servicosList indisponível, usando fallback.", e?.message || e);
  }

  // 2) Fallback coleção antiga `servicos` (um doc com pares nome->valor)
  try {
    const legacySnap = await getDocs(collection(db, "servicos"));
    const services = [];
    legacySnap.forEach((doc) => {
      const data = doc.data() || {};
      Object.entries(data).forEach(([nome, valor]) => {
        services.push({
          id: `${doc.id}_${nome}`,
          nome,
          descricao: "", // sem descrição no legado
          valor: toNumber(valor),
        });
      });
    });
    services.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return services;
  } catch (e) {
    console.error("[serviceService] Erro ao ler 'servicos':", e?.message || e);
  }

  // 3) Fallback final para visitantes sem acesso ao Firestore
  return fallbackServices;
}

// (opcional, se quiser usar em outras telas com descrição)
export async function getServicesWithDescriptions() {
  return getAllServicesOrdered();
}