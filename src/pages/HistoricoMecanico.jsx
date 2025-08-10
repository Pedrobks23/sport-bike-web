import React, { useEffect, useMemo, useState } from "react";
import { listenMecanicos } from "../services/mecanicos";
import { listenAvulsosByMecanicoAndRange } from "../services/servicosAvulsos";
import { listenOrdensByMecanicoAndRange } from "../services/ordens";

function toDateInputValue(d){ const pad=n=>String(n).padStart(2,"0"); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function fmtBRL(n){ return Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

export default function HistoricoMecanico(){
  const [mecanicos,setMecanicos]=useState([]); const [selected,setSelected]=useState(null);
  const [inicio,setInicio]=useState(toDateInputValue(new Date(Date.now()-30*86400000)));
  const [fim,setFim]=useState(toDateInputValue(new Date()));
  const [avulsos,setAvulsos]=useState([]); const [ordens,setOrdens]=useState([]); const [loading,setLoading]=useState(false);
  const [permIssue,setPermIssue]=useState(false);

  useEffect(()=>{ const u=listenMecanicos(setMecanicos,()=>setPermIssue(true)); return ()=>u(); },[]);
  useEffect(()=>{ if(!selected){ setAvulsos([]); setOrdens([]); return; } setLoading(true);
    const s=new Date(inicio), e=new Date(fim);
    const u1=listenAvulsosByMecanicoAndRange(selected.id,s,e,setAvulsos);
    const u2=listenOrdensByMecanicoAndRange(selected.id,s,e,setOrdens);
    return ()=>{ u1&&u1(); u2&&u2(); setLoading(false); };
  },[selected,inicio,fim]);

  const linhas=useMemo(()=>{
    const A=avulsos.map(x=>({ id:`avulso:${x.id}`, data:(x.data?.toDate?.()||x.dataCriacao?.toDate?.()||null), descricao:x.servico, quantidade:x.quantidade||1, valor:Number(x.valor||0) }));
    const O=ordens.map(x=>({ id:x._k, data:x.ts?.toDate?.()||x.ts||null, descricao:x.descricao||"OS", quantidade:1, valor:Number(x.valor||0) }));
    return [...A,...O].sort((a,b)=>(b.data?.getTime?.()||0)-(a.data?.getTime?.()||0));
  },[avulsos,ordens]);
  const total=useMemo(()=>linhas.reduce((acc,i)=>acc+Number(i.valor||0),0),[linhas]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Histórico do Mecânico</h1>
      {permIssue && <div className="mb-3 text-amber-600 text-sm">Atenção: as regras do Firestore podem estar bloqueando leitura/escrita.</div>}

      {/* Cards de mecânicos */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        {mecanicos.map(m=>(
          <button key={m.id} onClick={()=>setSelected(m)}
            className={`card p-4 text-left hover:shadow ${selected?.id===m.id?"ring-2 ring-amber-500":""}`}>
            <div className="font-semibold">{m.nome||m.name||"Sem nome"}</div>
            {m.telefone && <div className="text-xs text-neutral-500 mt-1">{m.telefone}</div>}
          </button>
        ))}
      </div>

      {/* Filtros de data */}
      <div className="card p-4 mb-6 grid gap-3 md:grid-cols-2">
        <div className="grid gap-2"><label className="text-sm font-medium">Início</label>
          <input className="input" type="date" value={inicio} onChange={(e)=>setInicio(e.target.value)} /></div>
        <div className="grid gap-2"><label className="text-sm font-medium">Fim</label>
          <input className="input" type="date" value={fim} onChange={(e)=>setFim(e.target.value)} /></div>
      </div>

      <div className="overflow-x-auto card">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-800"><tr>
            <th className="text-left p-3">Data</th><th className="text-left p-3">Serviço / Peça / OS</th>
            <th className="text-right p-3">Qtd</th><th className="text-right p-3">Valor</th></tr></thead>
          <tbody>
            {!selected && <tr><td colSpan={4} className="p-4 text-center text-neutral-500">Selecione um mecânico.</td></tr>}
            {selected && loading && <tr><td colSpan={4} className="p-4 text-center text-neutral-500">Carregando…</td></tr>}
            {selected && !loading && linhas.length===0 && <tr><td colSpan={4} className="p-4 text-center text-neutral-500">Nenhum registro</td></tr>}
            {linhas.map(it=>{ const data=it.data?it.data.toLocaleString("pt-BR"):"-";
              return (<tr key={it.id} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="p-3">{data}</td><td className="p-3">{it.descricao}</td>
                <td className="p-3 text-right">{it.quantidade}</td><td className="p-3 text-right">{fmtBRL(it.valor)}</td>
              </tr>); })}
          </tbody>
          {selected && (<tfoot><tr className="border-t border-neutral-200 dark:border-neutral-800">
            <td className="p-3 font-medium" colSpan={3}>Total</td><td className="p-3 text-right font-semibold">{fmtBRL(total)}</td>
          </tr></tfoot>)}
        </table>
      </div>
    </div>
  );
}
