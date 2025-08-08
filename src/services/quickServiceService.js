// Serviços avulsos garantem dataIndex para relatórios
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

export const listQuickServices = async () => {
  const snap = await getDocs(collection(db, "servicosAvulsos"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    dataCriacao: d.data().dataCriacao?.toDate
      ? d.data().dataCriacao.toDate()
      : d.data().dataIndex?.toDate
        ? d.data().dataIndex.toDate()
        : null,
  }));
};

export const addQuickService = async (data) => {
  const ref = await addDoc(collection(db, "servicosAvulsos"), {
    ...data,
    dataCriacao: serverTimestamp(),
    dataIndex: serverTimestamp(),
  });
  return ref.id;
};

export const updateQuickService = async (id, data) => {
  await updateDoc(doc(db, "servicosAvulsos", id), data);
};

export const deleteQuickService = async (id) => {
  await deleteDoc(doc(db, "servicosAvulsos", id));
};

