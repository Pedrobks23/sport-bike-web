import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

const COLL = "servicosAvulsos";
const asFn = (fn) => (typeof fn === "function" ? fn : () => {});

/** Criação de serviço avulso (usa campo `data` como padrão) */
export async function createServicoAvulso({ mecanicoId, servico, quantidade, valor, observacoes }) {
  const payload = {
    mecanicoId,
    servico: (servico || "").trim(),
    quantidade: Number(quantidade || 1),
    valor: Number(valor || 0),
    observacoes: (observacoes || "").trim(),
    data: serverTimestamp(),
    // dataCriacao: serverTimestamp(), // descomente se precisar retrocompat
  };
  return addDoc(collection(db, COLL), payload);
}

/** Últimos N lançamentos do mecânico (merge `data` e `dataCriacao`) */
export function listenUltimosDoMecanico(mecanicoId, n = 25, onError, cb) {
  const safeErr = asFn(onError), safeCb = asFn(cb);
  try {
    const base = collection(db, COLL);

    const qNew = query(
      base,
      where("mecanicoId", "==", mecanicoId),
      orderBy("data", "desc"),
      limit(n)
    );
    const qOld = query(
      base,
      where("mecanicoId", "==", mecanicoId),
      orderBy("dataCriacao", "desc"),
      limit(n)
    );

    const state = { a: [], b: [] };
    const emit = () => {
      const seen = new Map();
      [...state.a, ...state.b].forEach((d) => seen.set(d.id, d));
      const arr = [...seen.values()].sort((x, y) => {
        const tx = x.data?.toMillis?.() || x.dataCriacao?.toMillis?.() || 0;
        const ty = y.data?.toMillis?.() || y.dataCriacao?.toMillis?.() || 0;
        return ty - tx;
      });
      safeCb(arr.slice(0, n));
    };

    const u1 = onSnapshot(qNew, s => { state.a = s.docs.map(d => ({ id:d.id, ...d.data() })); emit(); }, e => safeErr(e));
    const u2 = onSnapshot(qOld, s => { state.b = s.docs.map(d => ({ id:d.id, ...d.data() })); emit(); }, e => safeErr(e));
    return () => { u1?.(); u2?.(); };
  } catch (e) { safeErr(e); return () => {}; }
}

/** Período por mecânico (merge `data`/`dataCriacao`) — para histórico por mecânico */
export function listenAvulsosByMecanicoAndRange(mecanicoId, startDate, endDate, onError, cb) {
  const safeErr = asFn(onError), safeCb = asFn(cb);
  try {
    const start = Timestamp.fromDate(startDate);
    const end = Timestamp.fromDate(endDate);
    const base = collection(db, COLL);

    const qNew = query(
      base,
      where("mecanicoId", "==", mecanicoId),
      where("data", ">=", start),
      where("data", "<=", end),
      orderBy("data", "desc")
    );
    const qOld = query(
      base,
      where("mecanicoId", "==", mecanicoId),
      where("dataCriacao", ">=", start),
      where("dataCriacao", "<=", end),
      orderBy("dataCriacao", "desc")
    );

    const state = { a: [], b: [] };
    const emit = () => {
      const seen = new Map();
      [...state.a, ...state.b].forEach((d) => seen.set(d.id, d));
      const arr = [...seen.values()].sort((x, y) => {
        const tx = x.data?.toMillis?.() || x.dataCriacao?.toMillis?.() || 0;
        const ty = y.data?.toMillis?.() || y.dataCriacao?.toMillis?.() || 0;
        return ty - tx;
      });
      safeCb(arr);
    };

    const u1 = onSnapshot(qNew, s => { state.a = s.docs.map(d => ({ id:d.id, ...d.data() })); emit(); }, e => safeErr(e));
    const u2 = onSnapshot(qOld, s => { state.b = s.docs.map(d => ({ id:d.id, ...d.data() })); emit(); }, e => safeErr(e));
    return () => { u1?.(); u2?.(); };
  } catch (e) { safeErr(e); return () => {}; }
}

/** Período global (opcionalmente filtra por `mecanicoId`) — para a tela com filtros */
export function listenAvulsosByRange({ startDate, endDate, mecanicoId }, onError, cb) {
  const safeErr = asFn(onError), safeCb = asFn(cb);
  try {
    const start = Timestamp.fromDate(startDate);
    const end = Timestamp.fromDate(endDate);
    const base = collection(db, COLL);

    const qNew = mecanicoId
      ? query(base, where("mecanicoId", "==", mecanicoId), where("data", ">=", start), where("data", "<=", end), orderBy("data", "desc"))
      : query(base, where("data", ">=", start), where("data", "<=", end), orderBy("data", "desc"));

    const qOld = mecanicoId
      ? query(base, where("mecanicoId", "==", mecanicoId), where("dataCriacao", ">=", start), where("dataCriacao", "<=", end), orderBy("dataCriacao", "desc"))
      : query(base, where("dataCriacao", ">=", start), where("dataCriacao", "<=", end), orderBy("dataCriacao", "desc"));

    const state = { a: [], b: [] };
    const emit = () => {
      const seen = new Map();
      [...state.a, ...state.b].forEach((d) => seen.set(d.id, d));
      const arr = [...seen.values()].sort((x, y) => {
        const tx = x.data?.toMillis?.() || x.dataCriacao?.toMillis?.() || 0;
        const ty = y.data?.toMillis?.() || y.dataCriacao?.toMillis?.() || 0;
        return ty - tx;
      });
      safeCb(arr);
    };

    const u1 = onSnapshot(qNew, s => { state.a = s.docs.map(d => ({ id:d.id, ...d.data() })); emit(); }, e => safeErr(e));
    const u2 = onSnapshot(qOld, s => { state.b = s.docs.map(d => ({ id:d.id, ...d.data() })); emit(); }, e => safeErr(e));
    return () => { u1?.(); u2?.(); };
  } catch (e) { safeErr(e); return () => {}; }
}
