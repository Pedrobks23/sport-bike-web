import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { formatDate } from '../utils/formatDate';
import { listQuickServices } from '../services/quickServiceService';
import { listOrdersByMechanic } from '../services/orderService';

export default function MechanicHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mechId = id;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({
    start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [quick, os] = await Promise.all([
        listQuickServices({
          mecanicoId: mechId,
          start: new Date(`${range.start}T00:00`),
          end: new Date(`${range.end}T23:59`),
        }),
        listOrdersByMechanic(mechId, {
          start: new Date(`${range.start}T00:00`),
          end: new Date(`${range.end}T23:59`),
        }),
      ]);
      const toJsDate = (v) => (v?.toDate ? v.toDate() : v);
      quick.sort((a, b) => toJsDate(b.data) - toJsDate(a.data));
      quick.forEach((r, i) => {
        r.os = `SA-${i + 1}`;
      });

      const tmp = [...quick, ...os];
      tmp.sort((a, b) => toJsDate(b.data) - toJsDate(a.data));
      setRows(tmp);
      setLoading(false);
    })();
  }, [mechId, range.start, range.end]);

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-gray-400 to-gray-600 p-2 rounded-full">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Histórico do Mecânico</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex gap-4 mb-4 flex-wrap">
            <input
              type="date"
              value={range.start}
              onChange={e => setRange(r => ({ ...r, start: e.target.value }))}
              className="border rounded px-3 py-2"
            />
            <input
              type="date"
              value={range.end}
              onChange={e => setRange(r => ({ ...r, end: e.target.value }))}
              className="border rounded px-3 py-2"
            />
          </div>
          {!loading && (
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
              {rows.length} serviços encontrados
            </p>
          )}
          <div className="overflow-x-auto rounded-xl shadow">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-100 sticky top-0">
                <tr className="text-left">
                  <th className="py-2 px-3 whitespace-nowrap text-xs md:text-sm">Data</th>
                  <th className="py-2 px-3 whitespace-nowrap text-xs md:text-sm">Fonte</th>
                  <th className="py-2 px-3 whitespace-nowrap text-xs md:text-sm">OS</th>
                  <th className="py-2 px-3 text-xs md:text-sm">Serviço / Peça</th>
                  <th className="py-2 px-3 text-center text-xs md:text-sm">Qtd</th>
                  <th className="py-2 px-3 text-right text-xs md:text-sm">Valor</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">Carregando…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">Nenhum registro</td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className={i % 2 ? 'bg-slate-50' : ''}>
                      <td className="px-3 py-1 whitespace-nowrap text-xs md:text-sm">{formatDate(r.data?.toDate ? r.data.toDate() : r.data, { date: true })}</td>
                      <td className="px-3 py-1 text-xs md:text-sm">{r.fonte}</td>
                      <td className="px-3 py-1 text-xs md:text-sm">{r.os}</td>
                      <td className="px-3 py-1 text-xs md:text-sm">{r.servico}</td>
                      <td className="px-3 py-1 text-center text-xs md:text-sm">{r.qtd}</td>
                      <td className="px-3 py-1 text-right text-xs md:text-sm">{`R$ ${(r.valor * r.qtd).toFixed(2)}`}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {rows.length > 0 && !loading && (
                <tfoot className="font-semibold bg-amber-50">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-xs md:text-sm">TOTAL</td>
                    <td className="text-center px-3 py-2 text-xs md:text-sm">
                      {rows.reduce((s, r) => s + r.qtd, 0)}
                    </td>
                    <td className="text-right px-3 py-2 text-xs md:text-sm">
                      R$ {rows.reduce((s, r) => s + r.valor * r.qtd, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
