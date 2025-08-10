import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

const COLL = "ordens";
const asFn = (fn) => (typeof fn === "function" ? fn : () => {});

// Normaliza qualquer campo de data: Timestamp, string ISO, number (ms)
function toDate(val) {
  if (!val) return null;
  if (val?.toDate) return val.toDate();             // Firestore Timestamp
  if (typeof val === "number") return new Date(val);
  if (typeof val === "string") {
    // ISO: 2025-07-12T12:44:07.437Z (ok para Date)
    const d = new Date(val);
    return isNaN(d) ? null : d;
  }
  return null;
}

// Calcula a "melhor" data da OS (ordem de preferência)
function bestDate(os) {
  return (
    toDate(os.dataConclusao) ||
    toDate(os.dataAtualizacao) ||
    toDate(os.dataCriacao) ||
    null
  );
}

/**
 * OS do mecânico no período COM status "Pronto".
 * Não usa range no Firestore (por causa do tipo string), filtra no cliente.
 *
 * Chamada:
 *   listenOrdensByMecanicoAndRange({ id, nome? }, startDate: Date, endDate: Date, onError, cb)
 */
export function listenOrdensByMecanicoAndRange(
  mecanico,
  startDate,
  endDate,
  onError,
  cb,
  { debug = false } = {}
) {
  const safeErr = asFn(onError);
  const safeCb = asFn(cb);

  try {
    const base = collection(db, COLL);
    const mecId = mecanico?.id;

    // Consulta 1: por id do mecânico (campo simples)
    const qById = query(
      base,
      where("status", "==", "Pronto"),
      where("mecanicoId", "==", mecId),
      // não aplicamos where de data aqui; ordenamos por dataCriacao para ter algo estável
      orderBy("dataCriacao", "desc")
    );

    // Se você também grava arrays de ids, descomente este bloco:
    // const qByArray = query(
    //   base,
    //   where("status", "==", "Pronto"),
    //   where("mecanicosIds", "array-contains", mecId),
    //   orderBy("dataCriacao", "desc")
    // );

    const parts = [
      { label: "byId", q: qById, data: [] },
      // { label: "byArray", q: qByArray, data: [] },
    ];

    const emit = () => {
      const seen = new Map();
      parts.forEach((p) => (p.data || []).forEach((d) => seen.set(d.id, d)));
      let arr = [...seen.values()];

      // filtra por período no cliente (aceitando string ISO ou Timestamp)
      const ini = startDate instanceof Date ? startDate : new Date(startDate);
      const fim = endDate instanceof Date ? endDate : new Date(endDate);
      arr = arr.filter((o) => {
        const d = bestDate(o);
        return d && d >= ini && d <= fim;
      });

      // ordena por melhor data desc
      arr.sort((a, b) => (bestDate(b)?.getTime() || 0) - (bestDate(a)?.getTime() || 0));

      if (debug) {
        const counts = parts.map((p) => `${p.label}:${p.data?.length || 0}`).join(" | ");
        // eslint-disable-next-line no-console
        console.log(`[OS][merge] ${counts} => total:${arr.length}`);
      }

      safeCb(arr);
    };

    const unsubs = parts.map((p) =>
      onSnapshot(
        p.q,
        (s) => {
          p.data = s.docs.map((d) => ({ id: d.id, ...d.data() }));
          emit();
        },
        (e) => safeErr(e)
      )
    );

    return () => unsubs.forEach((u) => u?.());
  } catch (e) {
    safeErr(e);
    return () => {};
  }
}
