import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search } from "lucide-react";

import { getDashboardOverview } from "@/services/smartDashboardService";
import MetricCard from "@/components/dashboard/MetricCard";
import CardDark from "@/components/dashboard/CardDark";
import SparkLine from "@/components/dashboard/charts/SparkLine";
import DonutMix from "@/components/dashboard/charts/DonutMix";
import BarTop from "@/components/dashboard/charts/BarTop";

export default function AdminSmartDashboard() {
  const [isDark] = useState(true); // fixa dark no dashboard
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    load();
    async function load() {
      setLoading(true);
      const res = await getDashboardOverview(period);
      setData(res);
      setLoading(false);
    }
  }, [period]);

  const kpis = useMemo(() => {
    if (!data) return [];
    return [
      { title: "Ordens no período", value: data.kpis.orders },
      { title: "Serviços avulsos", value: data.kpis.avulsos },
      { title: "Faturamento", value: data.kpis.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
      { title: "Ticket médio", value: data.kpis.avgTicket.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
    ];
  }, [data]);

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0B0B0B] text-white" : "bg-gray-50"}`}>
      {/* Topbar simples */}
      <header className="h-16 w-full sticky top-0 z-40 bg-[rgba(10,10,10,.85)] backdrop-blur border-b border-white/10">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-[#FFD600]" />
            <div className="font-semibold">Sport Bike • Admin</div>
            <select
              value={period}
              onChange={(e)=>setPeriod(e.target.value)}
              className="ml-4 rounded-md bg-[#121212] border border-white/10 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD600]"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="today">Hoje</option>
            </select>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                placeholder="Buscar"
                className="w-full rounded-full border border-white/10 bg-[#121212] pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#FFD600] outline-none"
              />
            </div>
            <button className="relative rounded-full p-2 hover:bg-white/5" aria-label="Notificações">
              <Bell size={18} />
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#FFD600] text-[10px] text-black">1</span>
            </button>
            <img src="https://i.pravatar.cc/48?img=5" className="h-8 w-8 rounded-full" alt="avatar" />
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        {/* Banner */}
        <CardDark className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <div className="md:col-span-2">
              <div className="text-sm text-white/80">Parabéns</div>
              <h2 className="mt-1 text-2xl md:text-3xl font-semibold">Equipe Sport Bike!</h2>
              <p className="mt-2 text-white/70 max-w-xl">
                Este é o painel inteligente: estatísticas em tempo real, ranking de mecânicos, serviços mais vendidos e tendência de faturamento.
              </p>
              <button
                className="mt-4 rounded-lg bg-[#FFD600] px-4 py-2 text-sm font-medium text-black shadow-soft hover:opacity-90"
                onClick={() => navigate("/admin/orders")}
              >
                Gerenciar Ordens
              </button>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-28 w-28 rounded-full bg-[#FFD600] opacity-20" />
            </div>
          </div>
        </CardDark>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((k) => <MetricCard key={k.title} title={k.title} value={k.value} />)}
        </div>

        {/* Gráficos principais */}
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
          <CardDark className="p-5 xl:col-span-2">
            <div className="mb-3 text-sm text-white/70">Tendência (R$) — {period}</div>
            {!loading && data && <SparkLine data={data.trend} />}
          </CardDark>

          <CardDark className="p-5">
            <div className="mb-3 text-sm text-white/70">Mix de receita</div>
            {!loading && data && <DonutMix data={data.mix} />}
          </CardDark>
        </div>

        {/* Tabelas e rankings */}
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CardDark className="p-5">
            <div className="mb-3 text-sm text-white/70">Top serviços por faturamento</div>
            {!loading && data && <BarTop data={data.topServices} dataKey="total" />}
          </CardDark>

          <CardDark className="p-5">
            <div className="mb-3 text-sm text-white/70">Ranking de mecânicos</div>
            {!loading && data && <BarTop data={data.topMechanics.map(m=>({ name: m.id, total: m.total }))} dataKey="total" />}
          </CardDark>
        </div>

        {/* Status das ordens */}
        {data && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Object.entries(data.statusCount).map(([k, v]) => (
              <div key={k} className="rounded-xl2 bg-white/5 border border-white/10 p-4">
                <div className="text-sm text-white/70">{k}</div>
                <div className="text-2xl font-semibold mt-1">{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
