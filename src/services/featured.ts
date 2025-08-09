import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, onSnapshot, orderBy, query, where
} from "firebase/firestore";
import { db } from "../config/firebase";

const COLL = "featured";

export function listenFeatured(onChange: (items: any[]) => void, onlyVisible = false) {
  const base = collection(db, COLL);
  const q = onlyVisible
    ? query(base, where("visible", "==", true), orderBy("createdAt", "desc"))
    : query(base, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createFeatured(payload: any) {
  await addDoc(collection(db, COLL), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateFeatured(id: string, partial: any) {
  await updateDoc(doc(db, COLL, id), { ...partial, updatedAt: serverTimestamp() });
}

export async function deleteFeatured(id: string) {
  await deleteDoc(doc(db, COLL, id));
}
