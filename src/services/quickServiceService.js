import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";

export const listQuickServices = async ({ mecanicoId, start, end } = {}) => {
  let q = collection(db, "servicosAvulsos");
  const filters = [];
  if (mecanicoId) filters.push(where("mecanicoId", "==", mecanicoId));
  if (start) filters.push(where("data", ">=", start));
  if (end) filters.push(where("data", "<=", end));
  if (filters.length) q = query(q, ...filters, orderBy("data", "desc"));
  else q = query(q, orderBy("data", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addQuickService = async (data) => {
  const ref = await addDoc(collection(db, "servicosAvulsos"), data);
  return ref.id;
};

export const updateQuickService = async (id, data) => {
  await updateDoc(doc(db, "servicosAvulsos", id), data);
};

export const deleteQuickService = async (id) => {
  await deleteDoc(doc(db, "servicosAvulsos", id));
};

