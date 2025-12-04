import { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
}

export default function KpiCard({ title, value, helper, icon }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
          {helper ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
