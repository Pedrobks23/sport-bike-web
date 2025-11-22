// src/services/homeService.js
// Fornece:
//  - getFeaturedProducts(): lista produtos em destaque (primeiro tenta `products` com `isFeatured`,
//    senão faz fallback para coleção antiga `featuredProducts`).
//  - getHomeSettings(): lê /home/settings com defaults (showFeaturedProducts, showProductsSection, showServicesSection, whatsappPhone).
//  - updateHomeSettings(): atualiza /home/settings (merge).

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { fallbackFeaturedProducts } from "@/constants/fallbackData";

// ---------- SETTINGS DA HOME ----------
export async function getHomeSettings() {
  const ref = doc(db, "home", "settings");
  const defaults = {
    showFeaturedProducts: true,
    showProductsSection: true,
    showServicesSection: true,
    whatsappPhone: "", // opcional
  };

  try {
    const snap = await getDoc(ref);
    return snap.exists() ? { ...defaults, ...snap.data() } : defaults;
  } catch (e) {
    console.warn("[homeService] Falha ao ler 'home/settings'. Usando defaults.", e?.message || e);
    return defaults;
  }
}

export async function updateHomeSettings(data) {
  const ref = doc(db, "home", "settings");
  await setDoc(ref, data, { merge: true });
  return true;
}

// ---------- PRODUTOS EM DESTAQUE ----------
export async function getFeaturedProducts() {
  // 1) Caminho novo: coleção "products" com flag isFeatured
  try {
    const q = query(
      collection(db, "products"),
      where("isFeatured", "==", true)
      // orderBy opcional, só se você tiver o índice criado:
      // orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    // Home.jsx já filtra visible !== false depois de normalizar, mas filtramos aqui também
    const visibleItems = items.filter((p) => p.visible !== false);

    if (visibleItems.length > 0) {
      // normalização mínima para evitar campos undefined
      return visibleItems.map((p) => ({
        id: p.id,
        name: p.name || "",
        category: p.category || "",
        price: p.price || "",
        description: p.description || "",
        image: p.image || "",
        visible: p.visible !== false,
      }));
    }
  } catch (e) {
    // se a coleção/índice não existir ou der permissão negada, caímos no fallback
    console.warn(
      "[homeService] Falha ao ler 'products' (isFeatured). Fallback para 'featuredProducts'.",
      e?.message || e
    );
  }

  // 2) Fallback legado: coleção "featuredProducts"
  //    (mantém compatibilidade com versões antigas do app)
  try {
    const snap = await getDocs(collection(db, "featuredProducts"));
    const items = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: d.id,
        name: data.name || "",
        category: data.category || "",
        price: data.price || "",
        description: data.description || "",
        image: data.image || "",
        visible: data.visible !== false, // alguns legados podem não ter esse campo
      };
    });

    // alguns projetos armazenavam "featureds" já filtrados
    const visibleItems = items.filter((p) => p.visible !== false);
    if (visibleItems.length > 0) return visibleItems;
  } catch (e) {
    console.error("[homeService] Erro ao ler 'featuredProducts':", e);
  }

  // 3) Fallback final: dados estáticos para visitantes sem permissão
  return fallbackFeaturedProducts;
}
