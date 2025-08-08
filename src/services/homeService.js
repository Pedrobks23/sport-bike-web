import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

export const getFeaturedProducts = async () => {
  const ref = collection(db, "featured");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, visible: data.visible ?? true };
  });
};

export const getHomeSettings = async () => {
  const ref = doc(db, "home", "settings");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : { showFeaturedProducts: true };
};

export const updateHomeSettings = async (data) => {
  const ref = doc(db, "home", "settings");
  await setDoc(ref, data, { merge: true });
};
