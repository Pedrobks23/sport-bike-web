import { format } from "date-fns";

interface TimelineItem {
  id: string;
  cliente: string;
  bike?: string;
  status: string;
  updatedAt: Date;
}

const statusColors: Record<string, string> = {
  Pronto: "bg-emerald-500",
  "Em Andamento": "bg-amber-500",
  Pendente: "bg-sky-500",
  Atrasado: "bg-rose-500",
};

export default function TimelineOS({ items }: { items: TimelineItem[] }) {
  return (
    <div className="h-80 w-full overflow-hidden rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-center justify-between pb-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Atualizações</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Últimas movimentações</h3>
        </div>
      </div>
      <ol className="space-y-4 overflow-y-auto pr-2">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma movimentação recente.</p>
        ) : (
          items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span
                className={`mt-1 h-3 w-3 rounded-full ${statusColors[item.status] || "bg-slate-400"}`}
                aria-hidden
              />
              <div className="flex-1 rounded-xl bg-amber-500/5 p-3 dark:bg-amber-500/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-900 dark:text-white">{item.cliente}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {format(item.updatedAt, "dd/MM HH:mm")}
                  </span>
                </div>
                {item.bike ? (
                  <p className="text-xs text-slate-600 dark:text-slate-400">{item.bike}</p>
                ) : null}
                <p className="mt-1 text-sm font-medium text-amber-600 dark:text-amber-300">{item.status}</p>
              </div>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
