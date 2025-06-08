import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../config/firebase";

export const createReceipt = async (data) => {
  const receiptsRef = collection(db, "receipts");
  const docRef = await addDoc(receiptsRef, { ...data, createdAt: serverTimestamp() });
  return docRef.id;
};

export const getReceipts = async () => {
  const receiptsRef = collection(db, "receipts");
  const snapshot = await getDocs(receiptsRef);
  const receipts = [];
  snapshot.forEach((docSnap) => {
    receipts.push({ id: docSnap.id, ...docSnap.data() });
  });
  return receipts;
};

export const updateReceipt = async (id, data) => {
  const receiptRef = doc(db, "receipts", id);
  await updateDoc(receiptRef, { ...data, updatedAt: serverTimestamp() });
  return true;
};

export const deleteReceipt = async (id) => {
  const receiptRef = doc(db, "receipts", id);
  await deleteDoc(receiptRef);
  return true;
};
