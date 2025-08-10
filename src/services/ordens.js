import { collection, onSnapshot, orderBy, query, where, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";

export function listenOrdensByMecanicoAndRange(mecanicoId, startDate, endDate, cb, onError){
  if(!mecanicoId){ cb([]); return ()=>{}; }
  const s=new Date(startDate); s.setHours(0,0,0,0);
  const e=new Date(endDate);  e.setHours(23,59,59,999);
  const start=Timestamp.fromDate(s), end=Timestamp.fromDate(e);

  const qs=[
    query(collection(db,"ordens"), where("mecanicoId","==",mecanicoId), where("dataCriacao",">=",start), where("dataCriacao","<=",end), orderBy("dataCriacao","desc")),
    query(collection(db,"ordens"), where("mecanicoId","==",mecanicoId), where("dataConclusao",">=",start), where("dataConclusao","<=",end), orderBy("dataConclusao","desc")),
    query(collection(db,"ordens"), where("mecanicosIds","array-contains",mecanicoId), where("dataCriacao",">=",start), where("dataCriacao","<=",end), orderBy("dataCriacao","desc")),
    query(collection(db,"ordens"), where("mecanicosIds","array-contains",mecanicoId), where("dataConclusao",">=",start), where("dataConclusao","<=",end), orderBy("dataConclusao","desc")),
  ];

  const unsubs=qs.map((q,idx)=>onSnapshot(q,(snap)=>{
    cb(prev=>{
      const map=new Map(prev.map(x=>[x._k,x]));
      snap.docs.forEach(d=>{
        const doc=d.data(); const ts=doc.dataConclusao||doc.dataCriacao;
        map.set(`os:${d.id}:${idx}`, {_k:`os:${d.id}:${idx}`, id:d.id, tipo:"os",
          descricao: doc.titulo||doc.servico||doc.descricao||"OS",
          quantidade:1, valor:Number(doc.valor||doc.total||0), ts});
      });
      return Array.from(map.values());
    });
  }, onError));
  return ()=>unsubs.forEach(u=>u&&u());
}
