// Configura Firebase e centraliza consultas por clienteId e statusKey
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { normalizePhone } from "@/utils/normalizePhone";

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
const storage = getStorage(app);

export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const ref = doc(db, "ordens", orderId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Ordem não encontrada");
    const data = snap.data();
    const statusKey = String(newStatus || "").toLowerCase().trim();

    const patch = {
      status: newStatus,
      statusKey,
      dataAtualizacao: serverTimestamp(),
    };

    if (statusKey === "pronto" || statusKey === "entregue") {
      if (!data.dataConclusao) patch.dataConclusao = serverTimestamp();
      const concl = patch.dataConclusao || data.dataConclusao;
      patch.dataIndex = concl || data.dataAtualizacao || data.dataCriacao || serverTimestamp();
    } else if (!data.dataIndex) {
      patch.dataIndex = data.dataAtualizacao || data.dataCriacao || serverTimestamp();
    }

    await updateDoc(ref, patch);
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
      if (!valor) return [];
      const telefoneNumerico = normalizePhone(valor);
      const clientesRef = collection(db, "clientes");
      const cSnap = await getDocs(
        query(clientesRef, where("telefoneNormalizado", "==", telefoneNumerico))
      );
      if (cSnap.empty) return [];
      const clienteId = cSnap.docs[0].id;
      q = query(osRef, where("clienteId", "==", clienteId), orderBy("dataCriacao", "desc"));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => ordens.push({ id: doc.id, ...doc.data() }));
      return ordens.slice(0, 3);
    } else if (tipo === "historico") {
      if (!valor) return [];
      const telefoneNumerico = normalizePhone(valor);
      const clientesRef = collection(db, "clientes");
      const cSnap = await getDocs(
        query(clientesRef, where("telefoneNormalizado", "==", telefoneNumerico))
      );
      if (cSnap.empty) return [];
      const clienteId = cSnap.docs[0].id;
      q = query(osRef, where("clienteId", "==", clienteId), orderBy("dataCriacao", "desc"));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => ordens.push({ id: doc.id, ...doc.data() }));
      if (ordens.length === 0) return [];
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

export { db, auth, storage };
