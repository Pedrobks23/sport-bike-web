import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

export const getAllServicesOrdered = async () => {
  const snapshot = await getDocs(collection(db, "servicos"));
  const services = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    Object.entries(data).forEach(([nome, valor]) => {
      const priceStr = String(valor).replace(/['"R$\s]/g, "").replace(",", ".");
      services.push({ id: `${doc.id}_${nome}`, nome, valor: parseFloat(priceStr) });
    });
  });
  services.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return services;
};
