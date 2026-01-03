// src/services/productsService.js
import { db } from "@/config/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { destroyFromCloudinary } from "@/utils/cloudinary";
import { deriveFeaturesPayload } from "@/utils/productFeatures";

// ajuste se sua collection tiver outro nome
const COL = "products";

/**
 * Lista todos os produtos (ordem mais recente primeiro).
 * Mantém compatibilidade com produtos antigos (image como string).
 */
export async function listAllProducts() {
  const q = query(collection(db, COL), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
    };
  });
}

/**
 * Lista apenas produtos públicos (visíveis) para a vitrine.
 */
export async function listPublicProducts() {
  try {
    const queries = [
      query(collection(db, COL), where("visible", "==", true), orderBy("updatedAt", "desc")),
      query(collection(db, COL), where("visivelLoja", "==", true), orderBy("updatedAt", "desc")),
    ];
    const results = await Promise.all(
      queries.map(async (q) => {
        try {
          const snap = await getDocs(q);
          return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch (err) {
          return [];
        }
      })
    );
    const merged = new Map();
    results.flat().forEach((item) => merged.set(item.id, item));
    return Array.from(merged.values());
  } catch (err) {
    console.warn(
      "[productsService] Falha ao listar produtos públicos:",
      err?.message || err
    );
    return [];
  }
}

/**
 * Cria produto. Espera objeto já com `image` (Cloudinary) ou null.
 * Retorna o doc salvo (com id).
 */
export async function createProduct(data) {
  const now = serverTimestamp();
  const coverImage = data.images?.[0] || data.image || null;
  const { features, featuresText } = deriveFeaturesPayload(
    data.features,
    data.featuresText
  );
  const visible = data.visible !== false;
  const payload = {
    name: data.name ?? "",
    category: data.category ?? "",
    price: data.price ?? "",
    description: data.description ?? "",
    features,
    featuresText,
    isFeatured: !!data.isFeatured,
    visible,
    visivelLoja: data.visivelLoja ?? visible,
    visivelMontagem: !!data.visivelMontagem,
    etapasMontagem: Array.isArray(data.etapasMontagem) ? data.etapasMontagem : [],
    compatibilidade: {
      aro: Array.isArray(data.compatibilidade?.aro) ? data.compatibilidade.aro : [],
      tipoBike: Array.isArray(data.compatibilidade?.tipoBike) ? data.compatibilidade.tipoBike : [],
      quadroSuportaDisco:
        typeof data.compatibilidade?.quadroSuportaDisco === "boolean"
          ? data.compatibilidade.quadroSuportaDisco
          : null,
    },
    quadroTamanhosDisponiveis: Array.isArray(data.quadroTamanhosDisponiveis)
      ? data.quadroTamanhosDisponiveis
      : [],
    tipoTamanhoQuadro: data.tipoTamanhoQuadro || null,
    // image: { url, publicId, width, height } | null
    image: coverImage,
    images: Array.isArray(data.images) ? data.images : coverImage ? [coverImage] : [],
    createdAt: now,
    updatedAt: now,
  };

  const ref = await addDoc(collection(db, COL), payload);
  return { id: ref.id, ...payload };
}

/**
 * Atualiza produto pelo id. `partial` pode conter qualquer campo acima.
 */
export async function updateProduct(id, partial) {
  const ref = doc(db, COL, id);
  const coverImage = partial.images?.[0] || partial.image || null;
  const { features, featuresText } = deriveFeaturesPayload(
    partial.features,
    partial.featuresText
  );
  const nextVisible =
    typeof partial.visible === "boolean"
      ? partial.visible
      : typeof partial.visivelLoja === "boolean"
        ? partial.visivelLoja
        : undefined;
  const compatibilidade =
    partial.compatibilidade || partial.compatibilidade === null
      ? {
          aro: Array.isArray(partial.compatibilidade?.aro) ? partial.compatibilidade.aro : [],
          tipoBike: Array.isArray(partial.compatibilidade?.tipoBike)
            ? partial.compatibilidade.tipoBike
            : [],
          quadroSuportaDisco:
            typeof partial.compatibilidade?.quadroSuportaDisco === "boolean"
              ? partial.compatibilidade.quadroSuportaDisco
              : null,
        }
      : undefined;
  await updateDoc(ref, {
    ...partial,
    features,
    featuresText,
    ...(typeof nextVisible === "boolean"
      ? {
          visible: nextVisible,
          visivelLoja: nextVisible,
        }
      : {}),
    ...(compatibilidade ? { compatibilidade } : {}),
    ...(Array.isArray(partial.etapasMontagem)
      ? { etapasMontagem: partial.etapasMontagem }
      : {}),
    ...(Array.isArray(partial.quadroTamanhosDisponiveis)
      ? { quadroTamanhosDisponiveis: partial.quadroTamanhosDisponiveis }
      : {}),
    image: coverImage ?? null,
    images: Array.isArray(partial.images)
      ? partial.images
      : coverImage
        ? [coverImage]
        : [],
    updatedAt: serverTimestamp(),
  });
}

/**
 * Alterna visibilidade do card na home.
 */
export async function toggleVisibility(id, visible) {
  const ref = doc(db, COL, id);
  await updateDoc(ref, {
    visible: !!visible,
    visivelLoja: !!visible,
    updatedAt: new Date(),
  });
}

/**
 * Lista produtos disponíveis para montagem.
 */
export async function listBuildProducts() {
  try {
    const q = query(
      collection(db, COL),
      where("visivelMontagem", "==", true),
      orderBy("updatedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn(
      "[productsService] Falha ao listar produtos para montagem:",
      err?.message || err
    );
    return [];
  }
}

/**
 * Deleta produto e, SE tiver image.publicId, remove do Cloudinary antes.
 */
export async function deleteProduct(id) {
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    const publicId = data?.image?.publicId;

    if (publicId) {
      // tenta remover do Cloudinary, mas não falhe a exclusão do Firestore se der erro
      try {
        await destroyFromCloudinary(publicId);
      } catch (err) {
        // loga e continua
        console.warn("[productsService] Falha ao remover no Cloudinary:", err?.message || err);
      }
    }
  }

  await deleteDoc(ref);
}
