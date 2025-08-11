import Card from "@/components/common/Card";
import BadgeStat from "@/components/common/BadgeStat";
import DonutByGender from "@/components/charts/DonutByGender";
import SalesLine from "@/components/charts/SalesLine";
import YearlyBar from "@/components/charts/YearlyBar";
import {
  getBanner,
  getFeaturedProduct,
  getKPIs,
  getSalesLine,
  getDonutByGender,
  getYearSummary,
} from "@/services/metrics";

export default function Dashboard() {
  const banner = getBanner();
  const featured = getFeaturedProduct();
  const kpis = getKPIs();
  const sales = getSalesLine();
  const gender = getDonutByGender();
  const year = getYearSummary();

  return (
    <div className="space-y-6">
      {/* Hero + Produto */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden lg:col-span-2 text-white" dark>
          <div className="absolute inset-0 bg-[var(--bg-dark)]" />
          <div className="relative p-6 md:p-8">
            <div className="text-sm text-white/80">Parabéns</div>
            <h2 className="mt-1 text-2xl md:text-3xl font-semibold">{banner.user}!</h2>
            <p className="mt-2 text-white/70 max-w-lg">{banner.text}</p>
            <button className="mt-4 rounded-lg bg-brand-yellow px-4 py-2 text-sm font-medium text-brand-black shadow-soft hover:opacity-90">
              {banner.cta}
            </button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="relative">
            <img src={featured.image} alt={featured.title} className="h-40 w-full object-cover" />
            <span className="absolute left-3 top-3 rounded-md bg-brand-yellow px-2 py-0.5 text-xs font-medium text-brand-black">
              NOVO
            </span>
          </div>
          <div className="p-4">
            <h3 className="font-semibold">{featured.title}</h3>
            <button className="mt-3 rounded-lg bg-brand-yellow px-3 py-1.5 text-sm text-brand-black hover:opacity-90">
              Comprar
            </button>
          </div>
        </Card>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((k) => (
          <BadgeStat key={k.label} title={k.label} value={k.value} delta={k.delta} trend={k.trend} />
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-5">
          <div className="mb-3 text-sm text-gray-600">Tendência de vendas</div>
          <SalesLine data={sales} />
        </Card>

        <Card className="p-5">
          <div className="mb-3 text-sm text-gray-600">Vendas por gênero</div>
          <DonutByGender data={gender} />
        </Card>

        <Card className="p-5 xl:col-span-1">
          <div className="mb-2 text-sm text-gray-600">Vendas anuais</div>
          <div className="text-sm text-gray-700">
            <div>Total de receitas <span className="font-semibold text-gray-900">${year.income.toLocaleString()}</span></div>
            <div>Total de despesas <span className="font-semibold text-gray-900">${year.expenses.toLocaleString()}</span></div>
          </div>
          <div className="mt-3">
            <YearlyBar summary={year} />
          </div>
        </Card>
      </div>
    </div>
  );
}
