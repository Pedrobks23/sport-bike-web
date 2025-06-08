import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const orderRef = doc(db, "ordens", orderId);
    await updateDoc(orderRef, {
      status: newStatus,
      dataAtualizacao: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    throw error;
  }
};

export const updateOrdemURL = async (osCode, customURL) => {
  try {
    const ordensRef = collection(db, "ordens");
    const q = query(ordensRef, where("codigo", "==", osCode));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docRef = doc(db, "ordens", querySnapshot.docs[0].id);
      const baseURL = window.location.origin;
      const newURL =
        customURL || `${baseURL}/consulta?os=${osCode}`;

      await updateDoc(docRef, {
        urlOS: newURL,
      });
    }
  } catch (error) {
    console.error("Erro ao atualizar URL:", error);
  }
};

// Função para escutar mudanças em tempo real
export const listenToOrders = (q, setOrdens) => {
  return onSnapshot(q, (snapshot) => {
    const ordensAtualizadas = [];
    snapshot.forEach((doc) => {
      ordensAtualizadas.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    setOrdens(ordensAtualizadas);
  });
};

export const consultarOS = async (tipo, valor) => {
  try {
    const osRef = collection(db, "ordens");
    let q;
    const ordens = [];

    if (tipo === "telefone") {
      if (!valor) {
        return [];
      }

      const telefoneNumerico = valor.replace(/\D/g, "");
      console.log("Buscando pelo telefone:", telefoneNumerico);

      // Filtra por telefone
      q = query(
        osRef,
        where("cliente.telefone", "==", telefoneNumerico),
        orderBy("dataCriacao", "desc"),
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        ordens.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Limita a 3 para consulta normal
      return ordens.slice(0, 3);
    } else if (tipo === "historico") {
      if (!valor) {
        return [];
      }

      const telefoneNumerico = valor.replace(/\D/g, "");
      q = query(
        osRef,
        where("cliente.telefone", "==", telefoneNumerico),
        orderBy("dataCriacao", "desc"),
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        ordens.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      if (ordens.length === 0) {
        return [];
      }

      return ordens;
    } else {
      if (!valor) {
        return [];
      }

      q = query(osRef, where("codigo", "==", valor));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        ordens.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return ordens;
    }
  } catch (error) {
    console.error("Erro ao consultar OS:", error);
    return [];
  }
};

export { db, auth };
