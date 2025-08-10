import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench } from "lucide-react";
import { listenMecanicos } from "../services/mecanicos";

export default function Mecanicos() {
  const navigate = useNavigate();
  const [mecanicos, setMecanicos] = useState([]);

  useEffect(() => {
    const u = listenMecanicos(setMecanicos);
    return () => u?.();
  }, []);

  function irParaHistorico(m) {
    try {
      // guarda no sessionStorage para sobreviver a wrappers/redirects
      sessionStorage.setItem(
        "hist_mecanico",
        JSON.stringify({ id: m.id, nome: m.nome || "" })
      );
    } catch {}
    navigate(`/admin/historico-mecanico/${encodeURIComponent(m.id)}`, {
      state: { mecanico: m, mecanicoId: m.id },
      replace: false,
    });
  }

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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wrench size={22} /> Mecânicos
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mecanicos.map((m) => (
          <button
            key={m.id}
            onClick={() => irParaHistorico(m)}
            className="text-left bg-white dark:bg-neutral-900 rounded-2xl shadow p-4 hover:shadow-md transition border border-neutral-200 dark:border-neutral-800"
          >
            <div className="text-lg font-semibold">{m.nome || m.id}</div>
            {m.especialidade && (
              <div className="text-sm text-neutral-500 mt-1">{m.especialidade}</div>
            )}
            <div className="text-xs mt-2 text-amber-600">Ver histórico »</div>
          </button>
        ))}
        {mecanicos.length === 0 && (
          <div className="text-neutral-500">Nenhum mecânico cadastrado.</div>
        )}
      </div>
    </div>
  );
}
