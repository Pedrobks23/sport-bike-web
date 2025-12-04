import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface RecentOrderItem {
  id: string;
  osName: string;
  cliente: string;
  bike?: string;
  status: string;
  total?: number;
  updatedAt: Date;
}

const statusStyles: Record<string, string> = {
  Pronto: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  "Em Andamento": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
  Pendente: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200",
  Atrasado: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
};

export default function RecentOrdersTable({ items }: { items: RecentOrderItem[] }) {
  const navigate = useNavigate();

  const handleOpenOrder = (orderId: string) => {
    navigate(`/workshop?orderId=${orderId}`);
  };

  return (
    <div className="w-full rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-center justify-between pb-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ordens</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Ordens Recentes</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2">OS</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Bike</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">Atualizado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-slate-500 dark:text-slate-400">
                  Nenhuma ordem encontrada.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => handleOpenOrder(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenOrder(item.id);
                    }
                  }}
                  className="cursor-pointer hover:bg-amber-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:bg-amber-500/10"
                >
                  <td className="px-3 py-3 font-semibold text-slate-900 dark:text-white">{item.osName}</td>
                  <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">{item.cliente}</td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{item.bike || "-"}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[item.status] || "bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-200"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-900 dark:text-white">
                    {item.total != null
                      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.total)
                      : "-"}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-400">
                    {formatDistanceToNow(item.updatedAt, { addSuffix: true, locale: ptBR })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
