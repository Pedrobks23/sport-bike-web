import { db } from "@/config/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { cldFill } from "@/utils/cloudinaryUrl";

const COLL = "products";

export async function fetchFeaturedPublic() {
  try {
    const q = query(collection(db, COLL), where("isFeatured", "==", true), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p: any) => p?.visible !== false)
      .map((p: any) => ({ ...p, imageUrl: cldFill(p.image || p.images?.[0]) }));
  } catch (e) {
    console.warn("[homeService] featured fallback:", (e as any)?.code || e);
    return []; // nunca trava a UI
  }
}

export async function fetchAllPublic() {
  try {
    const q = query(collection(db, COLL), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p: any) => p?.visible !== false)
      .map((p: any) => ({ ...p, imageUrl: cldFill(p.image || p.images?.[0]) }));
  } catch (e) {
    console.warn("[productsService] public list failed:", (e as any)?.code || e);
    return [];
  }
}
