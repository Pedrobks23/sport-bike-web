import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartMonthlyProps {
  data: Array<{ date: string; value: number }>;
}

const tooltipFormatter = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export default function ChartMonthly({ data }: ChartMonthlyProps) {
  return (
    <div className="h-80 w-full rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-center justify-between pb-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Receitas</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Performance do Mês</h3>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="fillColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4" stroke="#e2e8f0" opacity={0.6} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} padding={{ left: 4, right: 4 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$${Number(value).toLocaleString("pt-BR")}`}
            width={80}
          />
          <Tooltip formatter={(value) => tooltipFormatter(Number(value))} cursor={{ stroke: "#f59e0b", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#f59e0b"
            strokeWidth={2.5}
            fill="url(#fillColor)"
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
