import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export const getFeaturedProducts = async () => {
  const ref = collection(db, "featuredProducts");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createFeaturedProduct = async (data) => {
  const ref = collection(db, "featuredProducts");
  const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() });
  const snap = await getDoc(docRef);
  return { id: docRef.id, ...snap.data() };
};

export const updateFeaturedProduct = async (id, data) => {
  const ref = doc(db, "featuredProducts", id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const deleteFeaturedProduct = async (id) => {
  const ref = doc(db, "featuredProducts", id);
  await deleteDoc(ref);
};

export const getHomeSettings = async () => {
  const ref = doc(db, "home", "settings");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : { showFeaturedProducts: true };
};

export const updateHomeSettings = async (data) => {
  const ref = doc(db, "home", "settings");
  await updateDoc(ref, data);
};
