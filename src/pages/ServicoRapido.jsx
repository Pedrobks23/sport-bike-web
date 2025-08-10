import React, { useEffect, useState } from "react";
import { listenMecanicos } from "../services/mecanicos";
import { createServicoAvulso, listenUltimos } from "../services/servicosAvulsos";

function fmtBRL(n) { return Number(n || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

export default function ServicoRapido() {
  const [mecanicos, setMecanicos] = useState([]);
  const [mecanicoId, setMecanicoId] = useState("");
  const [servico, setServico] = useState("");
  const [valor, setValor] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObs] = useState("");
  const [loading, setLoading] = useState(false);
  const [lista, setLista] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    const unsub = listenMecanicos((arr) => {
      setMecanicos(arr);
      if (!mecanicoId && arr.length) setMecanicoId(arr[0].id);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!mecanicoId) return;
    const unsub = listenUltimos({ mecanicoId, limit: 20 }, setLista);
    return () => unsub();
  }, [mecanicoId]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!mecanicoId) { setErr("Selecione o mecânico."); return; }
    if (!servico.trim()) { setErr("Informe o serviço."); return; }

    setLoading(true);
    try {
      await createServicoAvulso({
        mecanicoId,
        servico,
        quantidade,
        valor,
        observacoes
      });
      setServico("");
      setValor("");
      setQuantidade(1);
      setObs("");
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Serviço Rápido</h1>
      {err && <div className="mb-3 text-red-600 text-sm">{err}</div>}

      <form onSubmit={onSubmit} className="card p-5 mb-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium">Mecânico</label>
            <select value={mecanicoId} onChange={(e) => setMecanicoId(e.target.value)} className="input">
              <option value="">Selecione</option>
              {mecanicos.map(m => <option key={m.id} value={m.id}>{m.nome || m.name || m.id}</option>)}
            </select>
          </div>

          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium">Serviço</label>
            <input className="input" value={servico} onChange={(e) => setServico(e.target.value)} placeholder="Ex.: Câmara de ar" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Valor</label>
            <input className="input" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ex.: 40,00" inputMode="decimal" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Quantidade</label>
            <input className="input" type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(parseInt(e.target.value || 1, 10))} />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-medium">Observações</label>
            <textarea className="textarea" value={observacoes} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full mt-4">
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </form>

      <h2 className="text-lg font-semibold mb-3">Serviços Registrados</h2>
      <div className="overflow-x-auto card">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-800">
            <tr>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Serviço</th>
              <th className="text-right p-3">Qtd</th>
              <th className="text-right p-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-neutral-500">Nenhum registro</td></tr>
            )}
            {lista.map((it) => {
              const ts = it.data?.toDate?.() || it.dataCriacao?.toDate?.();
              const data = ts ? ts.toLocaleString("pt-BR") : "-";
              return (
                <tr key={it.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="p-3">{data}</td>
                  <td className="p-3">{it.servico}</td>
                  <td className="p-3 text-right">{it.quantidade}</td>
                  <td className="p-3 text-right">{fmtBRL(it.valor)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
