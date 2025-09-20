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
} from "firebase/firestore";
import { destroyFromCloudinary } from "@/utils/cloudinary";
import { resolveProductImageUrl } from "@/utils/cloudinaryUrl";

// ajuste se sua collection tiver outro nome
const COL = "products";

/**
 * Lista todos os produtos (ordem mais recente primeiro).
 * Mantém compatibilidade com produtos antigos (image como string).
 */
export async function listAllProducts() {
  try {
    const q = query(collection(db, COL), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => {
      const data = d.data() || {};
      const product = { id: d.id, ...data };
      const imageUrl = resolveProductImageUrl(product, { w: 800, h: 600 });
      return { ...product, imageUrl };
    });

    return items.filter((p) => p?.visible !== false);
  } catch (err) {
    console.warn("[listAllProducts] falha:", err?.code || err?.message || err);
    return [];
  }
}

/**
 * Cria produto. Espera objeto já com `image` (Cloudinary) ou null.
 * Retorna o doc salvo (com id).
 */
export async function createProduct(data) {
  const now = new Date();
  const payload = {
    name: data.name ?? "",
    category: data.category ?? "",
    price: data.price ?? "",
    description: data.description ?? "",
    isFeatured: !!data.isFeatured,
    visible: data.visible !== false,
    // image: { url, publicId, width, height } | null
    image: data.image || null,
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
  await updateDoc(ref, {
    ...partial,
    updatedAt: new Date(),
  });
}

/**
 * Alterna visibilidade do card na home.
 */
export async function toggleVisibility(id, visible) {
  const ref = doc(db, COL, id);
  await updateDoc(ref, {
    visible: !!visible,
    updatedAt: new Date(),
  });
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
