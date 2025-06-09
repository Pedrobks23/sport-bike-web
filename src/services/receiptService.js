import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  orderBy,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../config/firebase";

export const createReceipt = async (data) => {
  const ref = collection(db, "recibos");
  const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() });
  const snapshot = await getDoc(docRef);
  return { id: docRef.id, ...snapshot.data() };
};

export const getReceipts = async () => {
  const ref = collection(db, "recibos");
  const q = query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateReceipt = async (id, data) => {
  const ref = doc(db, "recibos", id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const deleteReceipt = async (id) => {
  const ref = doc(db, "recibos", id);
  await deleteDoc(ref);
};

export const getNextReceiptNumber = async () => {
  const year = new Date().getFullYear();
  const coll = collection(db, "recibos");
  const q = query(
    coll,
    where("numero", ">=", `${year}-`),
    where("numero", "<=", `${year}-\uf8ff`),
    orderBy("numero", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  const last = snap.docs[0]?.data();
  const seq = (
    parseInt(last?.numero?.split("-")[0] || 0, 10) + 1
  )
    .toString()
    .padStart(3, "0");
  return `${seq}-${year}`;
};
