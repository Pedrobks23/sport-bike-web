import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function backfill() {
  const snap = await getDocs(collection(db, "ordens"));
  const updates = [];
  snap.forEach((d) => {
    const data = d.data();
    const status = (data.status || "").toLowerCase();
    if (!data.dataConclusao && (status === "pronto" || status === "entregue")) {
      const conclusao =
        data.dataAtualizacao ||
        data.dataCriacao ||
        serverTimestamp();
      updates.push(
        updateDoc(doc(db, "ordens", d.id), {
          dataConclusao: conclusao,
        })
      );
    }
  });
  await Promise.all(updates);
  console.log(`Atualizadas ${updates.length} ordens`);
}

backfill()
  .then(() => process.exit())
  .catch((err) => {
    console.error("Erro no backfill:", err);
    process.exit(1);
  });
