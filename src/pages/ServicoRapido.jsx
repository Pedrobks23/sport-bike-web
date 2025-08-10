import React, { useEffect, useState } from "react";
import { listenMecanicos } from "../services/mecanicos";
import { createServicoAvulso, listenUltimosDoMecanico } from "../services/servicosAvulsos";

function fmtBRL(n){ return Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

export default function ServicoRapido(){
  const [mecanicos,setMecanicos]=useState([]);
  const [mecanicoId,setMecanicoId]=useState("");
  const [servico,setServico]=useState(""); const [valor,setValor]=useState("");
  const [quantidade,setQuantidade]=useState(1); const [observacoes,setObs]=useState("");
  const [lista,setLista]=useState([]); const [loading,setLoading]=useState(false);
  const [err,setErr]=useState(""); const [permIssue,setPermIssue]=useState(false);

  useEffect(()=>{ const u=listenMecanicos(setMecanicos,()=>setPermIssue(true)); return ()=>u(); },[]);
  useEffect(()=>{ if(!mecanicoId){ setLista([]); return; }
    const u=listenUltimosDoMecanico(mecanicoId,setLista,()=>setPermIssue(true)); return ()=>u();
  },[mecanicoId]);

  async function onSubmit(e){
    e.preventDefault(); setErr("");
    if(!mecanicoId) return setErr("Selecione o mecânico.");
    if(!servico.trim()) return setErr("Informe o serviço.");
    setLoading(true);
    try{ await createServicoAvulso({ mecanicoId, servico, quantidade, valor, observacoes });
      setServico(""); setValor(""); setQuantidade(1); setObs("");
    }catch(e){ console.error(e); setErr(e?.message||"Erro ao salvar."); } finally{ setLoading(false); }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Serviço Rápido</h1>
      {permIssue && <div className="mb-3 text-amber-600 text-sm">Atenção: as regras do Firestore podem estar bloqueando leitura/escrita.</div>}
      {err && <div className="mb-3 text-red-600 text-sm">{err}</div>}

      <form onSubmit={onSubmit} className="card p-5 mb-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium">Mecânico</label>
            <select className="input" value={mecanicoId} onChange={(e)=>setMecanicoId(e.target.value)}>
              <option value="">Selecione</option>
              {mecanicos.map(m=><option key={m.id} value={m.id}>{m.nome||m.name||m.id}</option>)}
            </select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium">Serviço</label>
            <input className="input" value={servico} onChange={(e)=>setServico(e.target.value)} placeholder="Ex.: Câmara de ar"/>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Valor</label>
            <input className="input" value={valor} onChange={(e)=>setValor(e.target.value)} placeholder="Ex.: 40,00" inputMode="decimal"/>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Quantidade</label>
            <input className="input" type="number" min={1} value={quantidade} onChange={(e)=>setQuantidade(parseInt(e.target.value||1,10))}/>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium">Observações</label>
            <textarea className="input min-h-[90px]" value={observacoes} onChange={(e)=>setObs(e.target.value)}/>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full mt-4">{loading?"Salvando...":"Salvar"}</button>
      </form>

      <h2 className="text-lg font-semibold mb-3">Serviços Registrados</h2>
      {!mecanicoId && <div className="text-neutral-500 text-sm mb-3">Selecione um mecânico para ver os lançamentos.</div>}
      <div className="overflow-x-auto card">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-800">
            <tr><th className="text-left p-3">Data</th><th className="text-left p-3">Serviço</th><th className="text-right p-3">Qtd</th><th className="text-right p-3">Valor</th></tr>
          </thead>
          <tbody>
            {mecanicoId && lista.length===0 && <tr><td colSpan={4} className="p-4 text-center text-neutral-500">Nenhum registro</td></tr>}
            {lista.map(it=>{
              const ts=it.data?.toDate?.()||it.dataCriacao?.toDate?.(); const data=ts?ts.toLocaleString("pt-BR"):"-";
              return (<tr key={it.id} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="p-3">{data}</td><td className="p-3">{it.servico}</td>
                <td className="p-3 text-right">{it.quantidade}</td><td className="p-3 text-right">{fmtBRL(it.valor)}</td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
