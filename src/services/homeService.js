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
import { uploadImage } from "./uploadImage";

export const getFeaturedProducts = async () => {
  const ref = collection(db, "featuredProducts");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};


export const createFeaturedProduct = async ({ imageFile, ...data }) => {
  const refCollection = collection(db, "featuredProducts");
  let imageUrl = data.image || "";
  if (imageFile) {
    imageUrl = await uploadImage(imageFile);
  }
  const docRef = await addDoc(refCollection, {
    ...data,
    image: imageUrl,
    createdAt: serverTimestamp(),
  });
  const snap = await getDoc(docRef);
  return { id: docRef.id, ...snap.data() };
};

export const updateFeaturedProduct = async (id, { imageFile, ...data }) => {
  const refDoc = doc(db, "featuredProducts", id);
  let updates = { ...data, updatedAt: serverTimestamp() };
  if (imageFile) {
    const url = await uploadImage(imageFile);
    updates.image = url;
  }
  await updateDoc(refDoc, updates);
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
