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
  addDoc,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
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
const storage = getStorage(app);

// ============ FUNÇÕES EXISTENTES (mantidas) ============
export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const orderRef = doc(db, "ordens", orderId);
    const updateData = {
      status: newStatus,
      dataAtualizacao: serverTimestamp(),
    };
    if (newStatus === "Pronto") {
      updateData.dataConclusao = serverTimestamp();
    }
    await updateDoc(orderRef, updateData);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    throw error;
  }
};

export const updateOrdemURL = async (osCode, customURL) => {
  try {
    const ordensRef = collection(db, "ordens");
    const qRef = query(ordensRef, where("codigo", "==", osCode));
    const querySnapshot = await getDocs(qRef);

    if (!querySnapshot.empty) {
      const docRef = doc(db, "ordens", querySnapshot.docs[0].id);
      const baseURL = window.location.origin;
      const newURL = customURL || `${baseURL}/consulta?os=${osCode}`;
      await updateDoc(docRef, { urlOS: newURL });
    }
  } catch (error) {
    console.error("Erro ao atualizar URL:", error);
  }
};

export const listenToOrders = (qRef, setOrdens) => {
  return onSnapshot(qRef, (snapshot) => {
    const ordensAtualizadas = [];
    snapshot.forEach((docSnap) => {
      ordensAtualizadas.push({ id: docSnap.id, ...docSnap.data() });
    });
    setOrdens(ordensAtualizadas);
  });
};

export const consultarOS = async (tipo, valor) => {
  try {
    const osRef = collection(db, "ordens");
    let qRef;
    const ordens = [];

    if (tipo === "telefone") {
      if (!valor) return [];
      const telefoneNumerico = valor.replace(/\D/g, "");
      console.log("Buscando pelo telefone:", telefoneNumerico);

      qRef =
        telefoneNumerico.length === 9
          ? query(
              osRef,
              where("cliente.telefoneSemDDD", "==", telefoneNumerico),
              orderBy("dataCriacao", "desc")
            )
          : query(
              osRef,
              where("cliente.telefone", "==", telefoneNumerico),
              orderBy("dataCriacao", "desc")
            );

      const querySnapshot = await getDocs(qRef);
      querySnapshot.forEach((docSnap) => {
        ordens.push({ id: docSnap.id, ...docSnap.data() });
      });
      return ordens.slice(0, 3);
    } else if (tipo === "historico") {
      if (!valor) return [];
      const telefoneNumerico = valor.replace(/\D/g, "");
      qRef =
        telefoneNumerico.length === 9
          ? query(
              osRef,
              where("cliente.telefoneSemDDD", "==", telefoneNumerico),
              orderBy("dataCriacao", "desc")
            )
          : query(
              osRef,
              where("cliente.telefone", "==", telefoneNumerico),
              orderBy("dataCriacao", "desc")
            );

      const querySnapshot = await getDocs(qRef);
      querySnapshot.forEach((docSnap) => {
        ordens.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (ordens.length === 0) return [];
      return ordens;
    } else {
      if (!valor) return [];
      qRef = query(osRef, where("codigo", "==", valor));
      const querySnapshot = await getDocs(qRef);
      querySnapshot.forEach((docSnap) => {
        ordens.push({ id: docSnap.id, ...docSnap.data() });
      });
      return ordens;
    }
  } catch (error) {
    console.error("Erro ao consultar OS:", error);
    return [];
  }
};

// ============ NOVO: helpers da EXTENSÃO (coleção "generate") ============
const GENERATE_COL = "generate";
const SYSTEM_CONTEXT =
  "Você é um assistente administrativo especializado em ciclismo e bicicletas da loja Sport Bike. Responda curto e direto.";

export const extSendPrompt = async (text, threadId, extraContext) => {
  const prompt = [
    SYSTEM_CONTEXT,
    extraContext ? `Contexto: ${extraContext}` : "",
    `Usuário: ${text}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const ref = await addDoc(collection(db, GENERATE_COL), {
    prompt,
    threadId,
    createTime: serverTimestamp(),
  });
  return { id: ref.id };
};

export const extWatchGenerateOnce = (docId, onDone) => {
  const unsub = onSnapshot(doc(db, GENERATE_COL, docId), (snap) => {
    const d = snap.data();
    if (!d) return;
    if (d.response || d?.status?.state === "ERROR") {
      onDone({ response: d.response, status: d.status });
      unsub();
    }
  });
  return unsub;
};

export { db, auth, storage };
