import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";

export const listMechanics = async () => {
  const snap = await getDocs(collection(db, "mecanicos"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addMechanic = async (data) => {
  const ref = await addDoc(collection(db, "mecanicos"), data);
  return ref.id;
};

export const updateMechanic = async (id, data) => {
  await updateDoc(doc(db, "mecanicos", id), data);
};

export const deleteMechanic = async (id) => {
  await deleteDoc(doc(db, "mecanicos", id));
};
