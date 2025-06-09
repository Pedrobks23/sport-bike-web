import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

export const getOrdersTodayCount = async () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const q = query(collection(db, "ordens"), where("dataCriacao", ">=", start));
  const snap = await getDocs(q);
  return snap.size;
};

export const getCustomersCount = async () => {
  const snap = await getDocs(collection(db, "clientes"));
  return snap.size;
};

export const getBikesInMaintenanceCount = async () => {
  const q = query(
    collection(db, "ordens"),
    where("status", "in", ["Pendente", "Em Andamento"])
  );
  const snap = await getDocs(q);
  let total = 0;
  snap.forEach((doc) => {
    const data = doc.data();
    if (Array.isArray(data.bicicletas)) {
      total += data.bicicletas.length;
    } else if (data.bicicleta) {
      total += 1;
    }
  });
  return total;
};
