// src/services/uiConfigService.js
import { db } from "@/config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const PRODUCTS_UI_DOC = ["ui_configs", "produtos"];

const defaultProductsUIConfig = {
  showMonteSuaBikeBanner: true,
  monteSuaBikeBanner: {
    titulo: "Monte sua Bike",
    subtitulo: "Monte uma bike personalizada escolhendo aro, quadro e configuração",
    imagemUrl: "",
    botaoTexto: "Montar agora",
  },
  monteSuaBikeArosDisponiveis: [20, 24, 26, 29],
};

export async function getProductsUIConfig() {
  const ref = doc(db, ...PRODUCTS_UI_DOC);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return defaultProductsUIConfig;
    const data = snap.data() || {};
    return {
      ...defaultProductsUIConfig,
      ...data,
      monteSuaBikeBanner: {
        ...defaultProductsUIConfig.monteSuaBikeBanner,
        ...(data.monteSuaBikeBanner || {}),
      },
      monteSuaBikeArosDisponiveis: Array.isArray(data.monteSuaBikeArosDisponiveis)
        ? data.monteSuaBikeArosDisponiveis
        : defaultProductsUIConfig.monteSuaBikeArosDisponiveis,
    };
  } catch (err) {
    console.warn(
      "[uiConfigService] Falha ao ler ui_configs/produtos, usando defaults:",
      err?.message || err
    );
    return defaultProductsUIConfig;
  }
}

export async function updateProductsUIConfig(partial) {
  const ref = doc(db, ...PRODUCTS_UI_DOC);
  await setDoc(ref, partial, { merge: true });
  return true;
}
