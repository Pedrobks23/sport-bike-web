import { useEffect, useState } from "react";
import Card from "@/components/common/Card";
import BadgeStat from "@/components/common/BadgeStat";
import DonutByGender from "@/components/charts/DonutByGender";
import SalesLine from "@/components/charts/SalesLine";
import YearlyBar from "@/components/charts/YearlyBar";
import AdminLayout from "@/layout/AdminLayout";
import {
  getBanner,
  getFeaturedProduct,
  getKPIs,
  getSalesLine,
  getDonutByGender,
  getYearSummary,
} from "@/services/metrics";
import { KPI } from "@/types/analytics";

export default function Dashboard() {
  const banner = getBanner();
  const featured = getFeaturedProduct();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const sales = getSalesLine();
  const gender = getDonutByGender();
  const year = getYearSummary();

  useEffect(() => {
    getKPIs().then(setKpis);
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden lg:col-span-2 bg-gradient-to-r from-brand-darkBg to-brand-card text-white">
            <div className="p-6 md:p-8">
              <div className="text-sm text-white/80">Congratulations</div>
              <h2 className="mt-1 text-2xl md:text-3xl font-semibold">{banner.user}!</h2>
              <p className="mt-2 text-white/70 max-w-lg">{banner.text}</p>
              <button className="mt-4 rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white shadow-soft hover:opacity-90">
                {banner.cta}
              </button>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-b from-transparent to-white/5" />
          </Card>

          <Card className="overflow-hidden">
            <div className="relative">
              <img src={featured.image} alt={featured.title} className="h-40 w-full object-cover" />
              <span className="absolute left-3 top-3 rounded-md bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">
                {featured.badge}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{featured.title}</h3>
              <button className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-500/20">
                {featured.cta}
              </button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((k) => (
            <BadgeStat key={k.label} title={k.label} value={k.value} delta={k.delta} trend={k.trend} />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="p-5">
            <div className="mb-3 text-sm text-gray-500">Sales trend</div>
            <SalesLine data={sales} />
          </Card>

          <Card className="p-5">
            <div className="mb-3 text-sm text-gray-500">Sale by gender</div>
            <DonutByGender data={gender} />
          </Card>

          <Card className="p-5 xl:col-span-1">
            <div className="mb-2 text-sm text-gray-500">Yearly sales</div>
            <div className="text-sm text-gray-600">
              <div>Total income <span className="font-semibold text-gray-900">${year.income.toLocaleString()}</span></div>
              <div>Total expenses <span className="font-semibold text-gray-900">${year.expenses.toLocaleString()}</span></div>
            </div>
            <div className="mt-3">
              <YearlyBar summary={year} />
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
