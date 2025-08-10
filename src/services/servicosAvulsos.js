import {
  addDoc, collection, onSnapshot, orderBy, query, where,
  serverTimestamp, Timestamp, getDocs
} from "firebase/firestore";
import { db } from "../config/firebase";

const COLL = "servicosAvulsos";

export function parseNumber(val){ if(typeof val==="number") return val;
  const n = Number(String(val||"").replace(/\./g,"").replace(",","."));
  return Number.isFinite(n) ? n : 0; }

export async function createServicoAvulso({ mecanicoId, servico, quantidade, valor, observacoes }) {
  const data = serverTimestamp();
  const payload = {
    mecanicoId,
    servico: String(servico||"").trim(),
    quantidade: Number.parseInt(quantidade||1,10)||1,
    valor: parseNumber(valor),
    observacoes: String(observacoes||"").trim(),
    data,           // padrão novo
    dataCriacao: data // compat legado
  };
  await addDoc(collection(db, COLL), payload);
}

export function listenAvulsosByMecanicoAndRange(mecanicoId, startDate, endDate, cb, onError){
  if(!mecanicoId){ cb([]); return () => {}; }
  const s=new Date(startDate); s.setHours(0,0,0,0);
  const e=new Date(endDate);  e.setHours(23,59,59,999);
  const start=Timestamp.fromDate(s), end=Timestamp.fromDate(e);

  const qNew=query(collection(db,COLL),
    where("mecanicoId","==",mecanicoId), where("data",">=",start), where("data","<=",end), orderBy("data","desc"));
  const qOld=query(collection(db,COLL),
    where("mecanicoId","==",mecanicoId), where("dataCriacao",">=",start), where("dataCriacao","<=",end), orderBy("dataCriacao","desc"));

  let unsub=()=>{};
  try{
    unsub=onSnapshot(qNew, async (snapNew)=>{
      const olds=await getDocs(qOld).catch(()=>({docs:[]}));
      const map=new Map();
      snapNew.docs.forEach(d=>map.set(d.id,{id:d.id,...d.data(),_ts:d.get("data")||d.get("dataCriacao")}));
      olds.docs.forEach(d=>{ if(!map.has(d.id)) map.set(d.id,{id:d.id,...d.data(),_ts:d.get("data")||d.get("dataCriacao")}); });
      cb(Array.from(map.values()).sort((a,b)=>(b._ts?.toMillis?.()||0)-(a._ts?.toMillis?.()||0)));
    }, onError);
  }catch(e){ onError?.(e); }
  return ()=>unsub();
}

export function listenUltimosDoMecanico(mecanicoId, cb, onError){
  if(!mecanicoId){ cb([]); return ()=>{}; }
  try{
    const q=query(collection(db,COLL), where("mecanicoId","==",mecanicoId), orderBy("data","desc"));
    return onSnapshot(q, (snap)=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))), onError);
  }catch(e){ onError?.(e); return ()=>{}; }
}
