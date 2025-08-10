import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench } from "lucide-react";
import { listenMecanicos } from "../services/mecanicos";
import { listenByMecanicoAndRange } from "../services/servicosAvulsos";

function toDateInputValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function fmtBRL(n) { return Number(n || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

export default function HistoricoMecanico() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mecanicos, setMecanicos] = useState([]);
  const [mecanicoId, setMecanicoId] = useState("");
  const [inicio, setInicio] = useState(toDateInputValue(new Date(Date.now() - 30*86400000)));
  const [fim, setFim] = useState(toDateInputValue(new Date()));
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    const unsub = listenMecanicos((arr) => {
      setMecanicos(arr);
      if (!mecanicoId && arr.length) setMecanicoId(arr[0].id);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!mecanicoId) return;
    setLoading(true);
    const start = new Date(inicio);
    const end = new Date(fim);
    const unsub = listenByMecanicoAndRange(mecanicoId, start, end, (arr) => {
      setLista(arr);
      setLoading(false);
    });
    return () => unsub();
  }, [mecanicoId, inicio, fim]);

  const total = useMemo(() => lista.reduce((acc, it) => acc + Number(it.valor || 0), 0), [lista]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-gray-400 to-gray-600 p-2 rounded-full">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Histórico do Mecânico</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-4 mb-6 grid gap-3 md:grid-cols-4">
        <div className="grid gap-2 md:col-span-2">
          <label className="text-sm font-medium">Mecânico</label>
          <select className="input" value={mecanicoId} onChange={(e) => setMecanicoId(e.target.value)}>
            {mecanicos.map(m => <option key={m.id} value={m.id}>{m.nome || m.name || m.id}</option>)}
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Início</label>
          <input className="input" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Fim</label>
          <input className="input" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-800">
            <tr>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Serviço / Peça</th>
              <th className="text-right p-3">Qtd</th>
              <th className="text-right p-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="p-4 text-center text-neutral-500">Carregando…</td></tr>}
            {!loading && lista.length === 0 && (
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
          <tfoot>
            <tr className="border-t border-neutral-200 dark:border-neutral-800">
              <td className="p-3 font-medium" colSpan={3}>Total</td>
              <td className="p-3 text-right font-semibold">{fmtBRL(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
        </main>
      </div>
    </div>
  );
}
