import {
  addDoc, collection, onSnapshot, orderBy, query, where,
  serverTimestamp, Timestamp, getDocs
} from "firebase/firestore";
import { db } from "../config/firebase";

const COLL = "servicosAvulsos";

/** Normaliza números: "120,50" -> 120.5 */
export function parseNumber(val) {
  if (typeof val === "number") return val;
  const n = Number(String(val || "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** Cria lançamento em servicosAvulsos, gravando 'data' e 'dataCriacao' (compat) */
export async function createServicoAvulso({ mecanicoId, servico, quantidade, valor, observacoes }) {
  const data = serverTimestamp();
  const payload = {
    mecanicoId,
    servico: String(servico || "").trim(),
    quantidade: parseInt(quantidade || 1, 10) || 1,
    valor: parseNumber(valor),
    observacoes: String(observacoes || "").trim(),
    data,          // novo padrão
    dataCriacao: data // compat antigo
  };
  await addDoc(collection(db, COLL), payload);
}

/**
 * Escuta lançamentos por mecânico + intervalo (inclusive).
 * Suporta docs antigos com campo 'dataCriacao' — faz 2 consultas e mescla.
 * start/end: Date (00:00:00 e 23:59:59 serão ajustados aqui)
 */
export function listenByMecanicoAndRange(mecanicoId, startDate, endDate, cb) {
  const start = Timestamp.fromDate(new Date(startDate.setHours(0,0,0,0)));
  const end   = Timestamp.fromDate(new Date(endDate.setHours(23,59,59,999)));

  // Consulta no campo novo 'data'
  const qNew = query(
    collection(db, COLL),
    where("mecanicoId", "==", mecanicoId),
    where("data", ">=", start),
    where("data", "<=", end),
    orderBy("data", "desc")
  );

  // Consulta de compat no campo antigo 'dataCriacao'
  const qOld = query(
    collection(db, COLL),
    where("mecanicoId", "==", mecanicoId),
    where("dataCriacao", ">=", start),
    where("dataCriacao", "<=", end),
    orderBy("dataCriacao", "desc")
  );

  let unsubNew = () => {};
  let unsubOld = () => {};

  unsubNew = onSnapshot(qNew, async (snapNew) => {
    // também buscamos uma vez os antigos para mesclar
    const olds = await getDocs(qOld);
    const map = new Map();

    snapNew.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data(), _ts: d.get("data") || d.get("dataCriacao") }));
    olds.docs.forEach(d => {
      if (!map.has(d.id)) map.set(d.id, { id: d.id, ...d.data(), _ts: d.get("data") || d.get("dataCriacao") });
    });

    const merged = Array.from(map.values()).sort((a,b) => (b._ts?.toMillis?.() || 0) - (a._ts?.toMillis?.() || 0));
    cb(merged);
  });

  // Listener “fake” para qOld — já coberto pelo getDocs acima.
  unsubOld = () => {};

  return () => { unsubNew(); unsubOld(); };
}

/** Lista últimos N lançamentos (geral ou por mecânico) */
export function listenUltimos({ limit = 20, mecanicoId = null }, cb) {
  let q;
  if (mecanicoId) {
    q = query(
      collection(db, COLL),
      where("mecanicoId", "==", mecanicoId),
      orderBy("data", "desc")
    );
  } else {
    q = query(collection(db, COLL), orderBy("data", "desc"));
  }
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
