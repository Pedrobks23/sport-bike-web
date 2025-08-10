import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { listenMecanicos } from "../services/mecanicos";
import { listenAvulsosByMecanicoAndRange } from "../services/servicosAvulsos";
import { listenOrdensByMecanicoAndRange } from "../services/ordens";

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtBRL = (n) =>
  Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ---- datas do input (YYYY-MM-DD | DD/MM/YYYY) ---- */
function parseDateInput(str) {
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split("-");
    return new Date(`${y}-${m}-${d}T00:00:00`);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split("/");
    return new Date(`${y}-${m}-${d}T00:00:00`);
  }
  const d = new Date(str);
  return isNaN(d) ? null : d;
}

/* ---- datas vindas do Firestore (Timestamp, ISO string, pt-BR string) ---- */
const MESES = {
  janeiro: 0, fevereiro: 1, março: 2, marco: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
};
function toDateAny(val) {
  if (!val) return null;
  if (val?.toDate) return val.toDate();          // Firestore Timestamp
  if (typeof val === "number") return new Date(val);
  if (typeof val === "string") {
    // tenta ISO primeiro
    const iso = new Date(val);
    if (!isNaN(iso)) return iso;
    // tenta pt-BR "9 de agosto de 2025 às 20:47:03 ..."
    const m = val
      .toLowerCase()
      .match(
        /^(\d{1,2})\s+de\s+([a-zçãáéíóúõ]+)\s+de\s+(\d{4}).*?(\d{2}):(\d{2})(?::(\d{2}))?/i
      );
    if (m) {
      const [, d, mes, y, hh, mm, ss] = m;
      const mi =
        MESES[mes.normalize("NFD").replace(/[\u0300-\u036f]/g, "")] ?? 0;
      return new Date(Number(y), mi, Number(d), Number(hh), Number(mm), Number(ss || 0));
    }
  }
  return null;
}
function bestDate(obj) {
  // prioridade para a “data de pronto” se existir
  return (
    toDateAny(obj?.dataConclusao) ||
    toDateAny(obj?.dataAtualizacao) ||
    toDateAny(obj?.dataCriacao) ||
    toDateAny(obj?.data) ||
    null
  );
}

export default function HistoricoMecanico() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [selected, setSelected] = useState(null);

  const [inicio, setInicio] = useState(toISO(new Date(Date.now() - 30 * 86400000)));
  const [fim, setFim] = useState(toISO(new Date()));
  const [loading, setLoading] = useState(false);

  const [avulsos, setAvulsos] = useState([]);
  const [ordens, setOrdens] = useState([]);

  // Resolve mecânico: state → param → sessionStorage
  useEffect(() => {
    const unsub = listenMecanicos(
      (list) => {
        let cand = location.state?.mecanico || null;
        const routeKeyRaw = params.mecanicoId || params.id || params.mecId || "";
        const routeKey = routeKeyRaw ? decodeURIComponent(routeKeyRaw) : "";
        if (!cand && routeKey) {
          cand =
            list.find((m) => m.id === routeKey) ||
            list.find(
              (m) => (m.nome || "").trim().toLowerCase() === routeKey.trim().toLowerCase()
            ) ||
            null;
        }
        if (!cand) {
          try {
            const saved = JSON.parse(sessionStorage.getItem("hist_mecanico") || "null");
            if (saved?.id) {
              cand =
                list.find((m) => m.id === saved.id) ||
                list.find(
                  (m) =>
                    (m.nome || "").trim().toLowerCase() ===
                    (saved.nome || "").trim().toLowerCase()
                ) ||
                null;
            }
          } catch {}
        }
        setSelected(cand || null);
      },
      (e) => console.warn("[listenMecanicos] erro:", e)
    );
    return () => unsub?.();
  }, [location.state, params]);

  const datasValidas = useMemo(() => {
    const s = parseDateInput(inicio);
    const e = parseDateInput(fim);
    return s && e && s <= e;
  }, [inicio, fim]);

  useEffect(() => {
    if (!selected || !datasValidas) return;
    const s = parseDateInput(inicio);
    const e = parseDateInput(fim);
    setLoading(true);

    const u1 = listenAvulsosByMecanicoAndRange(
      selected.id,
      s,
      e,
      (e) => console.warn("[listenAvulsosByMecanicoAndRange] erro:", e),
      (arr) => setAvulsos(Array.isArray(arr) ? arr : [])
    );
    const u2 = listenOrdensByMecanicoAndRange(
      { id: selected.id, nome: selected.nome || "" },
      s,
      e,
      (e) => console.warn("[listenOrdensByMecanicoAndRange] erro:", e),
      (arr) => setOrdens(Array.isArray(arr) ? arr : []),
      { debug: false }
    );

    setLoading(false);
    return () => {
      u1?.();
      u2?.();
    };
  }, [selected, inicio, fim, datasValidas]);

  const linhas = useMemo(() => {
    const av = (avulsos || []).map((a) => ({
      id: `AV_${a.id}`,
      data: bestDate(a), // pega Timestamp ou string do avulso
      fonte: "Avulso",
      os: `SA-${(a.id || "").slice(0, 4)}`,
      item: a.servico || "-",
      qtd: a.quantidade || 1,
      valor: Number(a.valor || 0),
    }));

    const os = (ordens || []).map((o) => {
      const numero = o.codigo ?? o.numero ?? `OS-${o.id?.slice?.(0, 8)}`;
      const total = Number(o.total ?? o.valorTotal ?? o.precoTotal ?? 0);
      return {
        id: `OS_${o.id}`,
        data: bestDate(o), // agora funciona para string ISO/pt-BR e Timestamp
        fonte: "OS",
        os: numero,
        item: o.descricao || (o.status ? `OS ${numero} (${o.status})` : numero),
        qtd: 1,
        valor: total,
      };
    });

    return [...av, ...os].sort(
      (a, b) => (b.data?.getTime?.() || 0) - (a.data?.getTime?.() || 0)
    );
  }, [avulsos, ordens]);

  const total = useMemo(
    () => (linhas || []).reduce((acc, i) => acc + Number(i.valor || 0), 0),
    [linhas]
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </button>
        <h1 className="text-2xl font-bold">Histórico do Mecânico</h1>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Início</label>
          <input
            type="date"
            value={/^\d{2}\/\d{2}\/\d{4}$/.test(inicio) ? toISO(parseDateInput(inicio)) : inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fim</label>
          <input
            type="date"
            value={/^\d{2}\/\d{2}\/\d{4}$/.test(fim) ? toISO(parseDateInput(fim)) : fim}
            onChange={(e) => setFim(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-950"
          />
        </div>
        <div className="flex items-end">
          {!datasValidas && (
            <div className="text-sm text-red-600">Período inválido (início maior que fim).</div>
          )}
          {loading && datasValidas && (
            <div className="text-sm text-neutral-500">Carregando…</div>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-neutral-200 dark:border-neutral-800">
              <th className="p-3">Data</th>
              <th className="p-3">Fonte</th>
              <th className="p-3">OS</th>
              <th className="p-3">Serviço / Peça</th>
              <th className="p-3 text-right">Qtd</th>
              <th className="p-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {(!selected || (linhas || []).length === 0) && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-neutral-500">
                  {!selected ? "Selecione um mecânico" : "Nenhum registro no período."}
                </td>
              </tr>
            )}
            {(linhas || []).map((l) => {
              const data = l.data ? l.data.toLocaleDateString("pt-BR") : "-";
              return (
                <tr key={l.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="p-3">{data}</td>
                  <td className="p-3">{l.fonte}</td>
                  <td className="p-3">{l.os}</td>
                  <td className="p-3">{l.item}</td>
                  <td className="p-3 text-right">{l.qtd}</td>
                  <td className="p-3 text-right">{fmtBRL(l.valor)}</td>
                </tr>
              );
            })}
          </tbody>
          {selected && (linhas || []).length > 0 && (
            <tfoot>
              <tr className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="p-3 font-medium" colSpan={5}>
                  TOTAL
                </td>
                <td className="p-3 text-right font-semibold">{fmtBRL(total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
