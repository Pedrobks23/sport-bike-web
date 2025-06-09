import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { uploadImage, deleteImageByUrl } from "./uploadImage";

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
  const updates = { ...data, updatedAt: serverTimestamp() };
  if (imageFile) {
    const snap = await getDoc(refDoc);
    const oldUrl = snap.data()?.image;
    if (oldUrl) await deleteImageByUrl(oldUrl);
    const url = await uploadImage(imageFile);
    updates.image = url;
  }
  await updateDoc(refDoc, updates);
};

export const deleteFeaturedProduct = async (id) => {
  const ref = doc(db, "featuredProducts", id);
  const snap = await getDoc(ref);
  const url = snap.data()?.image;
  if (url) await deleteImageByUrl(url);
  await deleteDoc(ref);
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
