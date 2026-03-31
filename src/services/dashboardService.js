import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../config/firebase";

export const getOrdersTodayCount = async () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, "ordens"),
    where("dataAgendamento", ">=", start.toISOString()),
    where("dataAgendamento", "<=", end.toISOString())
  );
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

export const getInProgressCount = async () => {
  const q = query(collection(db, "ordens"), where("status", "==", "Em Andamento"));
  const snap = await getDocs(q);
  return snap.size;
};

export const getReadyForPickupCount = async () => {
  const q = query(collection(db, "ordens"), where("status", "==", "Pronto"));
  const snap = await getDocs(q);
  return snap.size;
};

export const getMonthlyRevenue = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const q = query(collection(db, "ordens"), where("status", "==", "Pronto"));
  const snap = await getDocs(q);

  let total = 0;
  snap.forEach((doc) => {
    const data = doc.data();
    if (data.dataConclusao) {
      const date = new Date(data.dataConclusao);
      if (date.getFullYear() === year && date.getMonth() === month) {
        total += Number(data.valorTotal) || 0;
      }
    }
  });
  return total;
};

export const getLatestOrders = async (count = 5) => {
  const q = query(
    collection(db, "ordens"),
    orderBy("dataCriacao", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      codigo: data.codigo || data.numeroOS || doc.id,
      clienteNome: data.cliente?.nome || data.clienteNome || "—",
      status: data.status || "—",
      dataCriacao: data.dataCriacao || null,
    };
  });
};
