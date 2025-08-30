import { addDoc, collection, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";

const GENERATE_COL = "generate";

const SYSTEM_CONTEXT = `Você é um assistente administrativo especializado em ciclismo e bicicletas da loja Sport Bike.
Responda curto e direto. Se a pergunta for sobre dados internos, peça nome ou telefone do cliente.`;

export async function sendToExtension(text: string, threadId: string, extraContext?: string) {
  const prompt = [SYSTEM_CONTEXT, extraContext ? `Contexto: ${extraContext}` : "", `Usuário: ${text}`]
    .filter(Boolean)
    .join("\n\n");

  const ref = await addDoc(collection(db, GENERATE_COL), {
    prompt,
    threadId,
    createTime: serverTimestamp(),
  });
  return { id: ref.id };
}

export function watchDocOnce(
  docId: string,
  onDone: (payload: { response?: string; status?: any }) => void
) {
  const unsub = onSnapshot(doc(db, GENERATE_COL, docId), (snap) => {
    const d = snap.data();
    if (!d) return;
    if (d.response || d.status?.state === "ERROR") {
      onDone({ response: d.response, status: d.status });
      unsub();
    }
  });
  return unsub;
}
