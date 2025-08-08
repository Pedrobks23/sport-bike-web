import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const asTs = (v) =>
  v instanceof Timestamp
    ? v
    : v?.toDate
    ? Timestamp.fromDate(v.toDate())
    : v instanceof Date
    ? Timestamp.fromDate(v)
    : null;

async function backfillOrdens() {
  const snap = await db.collection("ordens").get();
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const s = String(d.status || "").toLowerCase();
    if (s !== "pronto" && s !== "entregue") continue;

    const concl = asTs(d.dataConclusao);
    const atu = asTs(d.dataAtualizacao);
    const cri = asTs(d.dataCriacao);
    let idx = asTs(d.dataIndex) || concl || atu || cri || Timestamp.now();

    const patch = {};
    if (!d.dataIndex) patch.dataIndex = idx;
    if (!concl) patch.dataConclusao = idx;

    if (Object.keys(patch).length) await docSnap.ref.update(patch);
  }
}

async function backfillAvulsos() {
  const snap = await db.collection("servicosAvulsos").get();
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const cri = asTs(d.dataCriacao) || Timestamp.now();
    if (!d.dataIndex) await docSnap.ref.update({ dataIndex: cri });
  }
}

await backfillOrdens();
await backfillAvulsos();
console.log("Backfill concluído.");
