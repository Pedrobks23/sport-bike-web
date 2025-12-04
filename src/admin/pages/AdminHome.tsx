import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Bike, ClipboardList, Rocket, Users } from "lucide-react";
import KpiCard from "../components/KpiCard";
import ChartMonthly from "../components/ChartMonthly";
import TimelineOS from "../components/TimelineOS";
import RecentOrdersTable from "../components/RecentOrdersTable";
import { useAdminMetrics } from "../hooks/useAdminMetrics";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function AdminHome() {
  const { metrics } = useAdminMetrics();
  const navigate = useNavigate();

  const recentOrdersTable = useMemo(() => metrics.recentOrders.slice(0, 5), [metrics.recentOrders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Visão geral</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Painel Analítico</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhe os indicadores principais e acesse os módulos rapidamente.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            aria-label="Criar nova ordem de serviço"
            onClick={() => navigate("/admin/ordens/nova")}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ClipboardList className="h-4 w-4" />
            Nova Ordem de Serviço
          </button>
          <Link
            to="/admin/orders"
            aria-label="Ir para oficina"
            className="inline-flex items-center gap-2 rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:text-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:hover:border-amber-400 dark:hover:text-amber-200"
          >
            <Rocket className="h-4 w-4" />
            Ir para Oficina
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard title="Ordens Hoje" value={metrics.todayOrders.toLocaleString("pt-BR") || "0"} icon={<Bike className="h-5 w-5" />} />
        <KpiCard title="Clientes Cadastrados" value={metrics.totalClients.toLocaleString("pt-BR") || "0"} icon={<Users className="h-5 w-5" />} />
        <KpiCard title="Bikes em Manutenção" value={metrics.inMaintenance.toLocaleString("pt-BR") || "0"} icon={<WrenchIcon />} />
        <KpiCard title="OS Atrasadas" value={metrics.overdue.toLocaleString("pt-BR") || "0"} icon={<BarChart3 className="h-5 w-5" />} />
        <KpiCard
          title="Receita do Mês"
          value={currencyFormatter.format(metrics.monthRevenue || 0)}
          helper={`${metrics.monthTickets} OS finalizadas`}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <KpiCard title="Ticket Médio" value={currencyFormatter.format(metrics.avgTicket || 0)} helper="Receita / OS finalizadas" icon={<ClipboardList className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartMonthly data={metrics.series} />
        </div>
        <div className="lg:col-span-1">
          <TimelineOS items={metrics.recentOrders} />
        </div>
      </div>

      <RecentOrdersTable items={recentOrdersTable} />
    </div>
  );
}

function WrenchIcon() {
  return <Bike className="h-5 w-5 rotate-45" />;
}
