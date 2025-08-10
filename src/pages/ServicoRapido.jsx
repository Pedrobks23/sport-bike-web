import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { listenMecanicos } from "../services/mecanicos";
import { createServicoAvulso, listenAvulsosByRange } from "../services/servicosAvulsos";

function fmt(d) { return d.toLocaleDateString("pt-BR"); }
function toInput(d){ const p=n=>String(n).padStart(2,"0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
function fmtBRL(n){ return Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

export default function ServicoRapido(){
  const nav = useNavigate();
  const [mecanicos,setMecanicos]=useState([]);
  const [mecanicoId,setMecanicoId]=useState("all");
  const [inicio,setInicio]=useState(toInput(new Date(Date.now()-30*86400000)));
  const [fim,setFim]=useState(toInput(new Date()));
  const [itens,setItens]=useState([]);
  const [permWarn,setPermWarn]=useState(false);
  const [openModal,setOpenModal]=useState(false);

  useEffect(()=>{ return listenMecanicos(setMecanicos, ()=>setPermWarn(true)); }, []);

  useEffect(()=>{
    const s = new Date(`${inicio}T00:00:00`);
    const e = new Date(`${fim}T23:59:59`);
    const unsub = listenAvulsosByRange({
      startDate:s, endDate:e, mecanicoId: mecanicoId==="all" ? undefined : mecanicoId
    }, ()=>setPermWarn(true), arr => setItens(Array.isArray(arr)?arr:[]));
    return () => unsub?.();
  }, [inicio,fim,mecanicoId]);

  const rows = useMemo(()=>{
    return (itens||[]).map((d,i)=>{
      const ts = d?.data?.toDate?.() || d?.dataCriacao?.toDate?.();
      const nome = mecanicos.find(m=>m.id===d.mecanicoId)?.nome || d.mecanicoId || "-";
      return {
        idx: i+1,
        id: d.id,
        data: ts? fmt(ts) : "-",
        mecanico: nome,
        servico: d.servico || "-",
        qtd: d.quantidade || 1,
        valor: d.valor || 0
      };
    });
  },[itens,mecanicos]);

  // modal state
  const [form,setForm]=useState({ mecanicoId:"", servico:"", quantidade:1, valor:"", observacoes:"" });
  function resetForm(){ setForm({ mecanicoId:"", servico:"", quantidade:1, valor:"", observacoes:"" }); }

  async function salvar(e){
    e?.preventDefault?.();
    const v = String(form.valor||"").replace(/\./g,"").replace(",",".");
    await createServicoAvulso({
      mecanicoId: form.mecanicoId,
      servico: form.servico,
      quantidade: Number(form.quantidade||1),
      valor: Number(v||0),
      observacoes: form.observacoes
    });
    setOpenModal(false);
    resetForm();
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={()=>nav(-1)} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800">
          <ArrowLeft size={18}/><span>Voltar</span>
        </button>
        <h1 className="text-2xl font-bold">Serviço Rápido</h1>
      </div>

      {permWarn && <div className="mb-3 text-amber-600 text-sm">Atenção: as regras do Firestore podem estar bloqueando leitura/escrita. Verifique as rules.</div>}

      {/* filtros */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Data inicial</label>
            <input type="date" className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950" value={inicio} onChange={e=>setInicio(e.target.value)}/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data final</label>
            <input type="date" className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950" value={fim} onChange={e=>setFim(e.target.value)}/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mecânico</label>
            <select className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950" value={mecanicoId} onChange={e=>setMecanicoId(e.target.value)}>
              <option value="all">Todos</option>
              {mecanicos.map(m => <option key={m.id} value={m.id}>{m.nome || m.id}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full rounded-xl px-4 py-2 bg-amber-500 text-white font-medium hover:brightness-95">
              Filtrar
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-3">
        <button onClick={()=>{ resetForm(); setOpenModal(true); }} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-amber-500 text-white shadow">
          <Plus size={16}/> Novo Serviço
        </button>
      </div>

      {/* tabela */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-neutral-200 dark:border-neutral-800">
              <th className="p-3">#</th>
              <th className="p-3">Data</th>
              <th className="p-3">Mecânico</th>
              <th className="p-3">Serviço</th>
              <th className="p-3 text-right">Qtd</th>
              <th className="p-3 text-right">Valor</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length===0 && (
              <tr><td colSpan={7} className="p-4 text-center text-neutral-500">Sem registros no período.</td></tr>
            )}
            {rows.map(r=>(
              <tr key={r.id} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="p-3">{r.idx}</td>
                <td className="p-3">{r.data}</td>
                <td className="p-3">{r.mecanico}</td>
                <td className="p-3">{r.servico}</td>
                <td className="p-3 text-right">{r.qtd}</td>
                <td className="p-3 text-right">{fmtBRL(r.valor)}</td>
                <td className="p-3">
                  <div className="flex gap-2 text-neutral-600">
                    <button title="Editar"><Edit size={16}/></button>
                    <button title="Excluir" className="text-red-600"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* modal novo serviço */}
      {openModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=>setOpenModal(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow max-w-lg w-full p-5" onClick={(e)=>e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-3">Novo Serviço Avulso</h2>
            <form onSubmit={salvar} className="grid gap-3">
              <div>
                <label className="block text-sm mb-1">Mecânico</label>
                <select required className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950"
                  value={form.mecanicoId} onChange={e=>setForm(f=>({ ...f, mecanicoId:e.target.value }))}>
                  <option value="">Selecione...</option>
                  {mecanicos.map(m => <option key={m.id} value={m.id}>{m.nome || m.id}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Serviço</label>
                <input required className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950"
                  value={form.servico} onChange={e=>setForm(f=>({ ...f, servico:e.target.value }))}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Qtd</label>
                  <input type="number" min={1} className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950"
                    value={form.quantidade} onChange={e=>setForm(f=>({ ...f, quantidade:e.target.value }))}/>
                </div>
                <div>
                  <label className="block text-sm mb-1">Valor (R$)</label>
                  <input className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950"
                    value={form.valor} onChange={e=>setForm(f=>({ ...f, valor:e.target.value }))}/>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Observações</label>
                <textarea rows={3} className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950"
                  value={form.observacoes} onChange={e=>setForm(f=>({ ...f, observacoes:e.target.value }))}/>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={()=>setOpenModal(false)} className="rounded-xl border px-4 py-2">Cancelar</button>
                <button type="submit" className="rounded-xl px-4 py-2 bg-amber-500 text-white">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
