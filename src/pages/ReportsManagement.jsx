import React, { useState, useEffect } from "react";
import { ArrowLeft, Download, BarChart3, Calendar, TrendingUp, DollarSign, Package } from "lucide-react";
import {
  collection,
  query,
  getDocs,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { listMechanics } from "../services/mechanicService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ReportsManagement = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("monthly");
  const [selectedService, setSelectedService] = useState("all");
  const [selectedMechanic, setSelectedMechanic] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [itemType, setItemType] = useState("all");
  const [mechanics, setMechanics] = useState([]);
  const [services, setServices] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [reportData, setReportData] = useState([]);

  const totalRevenue = reportData.reduce((sum, item) => sum + item.total, 0);
  const totalServices = reportData.reduce((sum, item) => sum + item.quantity, 0);
  const averageTicket = totalServices ? totalRevenue / totalServices : 0;

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const loadServices = async () => {
    try {
      const servicosRef = collection(db, "servicos");
      const querySnapshot = await getDocs(servicosRef);
      const servicosData = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        Object.keys(data).forEach((serviceName) => {
          servicosData.push({
            id: serviceName, // Usando o nome como ID
            nome: serviceName,
            valor: data[serviceName],
          });
        });
      });

      setServices(servicosData);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    }
  };

  const loadMechanics = async () => {
    try {
      const data = await listMechanics();
      setMechanics(data);
    } catch (err) {
      console.error('Erro ao carregar mecânicos:', err);
    }
  };
  // função de processamento legacy removida – cálculos feitos diretamente em loadReportData

  const loadReportData = async () => {
    setLoading(true);
    const ordensRef = collection(db, 'ordens');
    const startDate = new Date(`${dateRange.start}T00:00`);
    const endDate = new Date(`${dateRange.end}T23:59`);
    const start = Timestamp.fromDate(startDate);
    const end = Timestamp.fromDate(endDate);
    const q = query(ordensRef, where('status', '==', 'Pronto'));
    try {
      const snap = await getDocs(q);
      const agg = {};

      const addRow = (periodKey, mechId, nome, qtd, valor, fonte, tipo, ref) => {
        if (itemType !== 'all' && itemType !== tipo) return;
        if (!agg[periodKey]) agg[periodKey] = { total: 0, qtd: 0, lines: [] };
        agg[periodKey].total += valor * qtd;
        agg[periodKey].qtd += qtd;
        agg[periodKey].lines.push({ fonte, mechId, nome, qtd, valor, tipo, ref });
      };

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        let dataFinal = data.dataConclusao || data.dataAtualizacao || data.dataCriacao;
        if (dataFinal?.toDate) dataFinal = dataFinal.toDate();
        else if (typeof dataFinal === 'string') dataFinal = new Date(dataFinal);
        if (!dataFinal) return;
        if (dataFinal < startDate || dataFinal > endDate) return;

        const getPeriod = () => {
          switch (reportType) {
            case 'daily':
              return dataFinal.toLocaleDateString('pt-BR');
            case 'weekly': {
              const ws = new Date(dataFinal);
              ws.setDate(ws.getDate() - ws.getDay());
              return `Semana de ${ws.toLocaleDateString('pt-BR')}`;
            }
            case 'monthly':
            default:
              return dataFinal.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
          }
        };

        const osRef = data.codigo || docSnap.id;
        (data.bicicletas || []).forEach((bike) => {
          const mechId = bike.mecanicoId || data.mecanicoId || '';
          const mechCond =
            selectedMechanic === 'all'
              ? true
              : selectedMechanic === 'none'
              ? !mechId
              : mechId === selectedMechanic;
          if (!mechCond) return;
          const periodKey = getPeriod();

          if (sourceFilter === 'all' || sourceFilter === 'os') {
            const addService = (nome, qtd, valor) => {
              if (selectedService !== 'all' && nome !== selectedService) return;
              addRow(periodKey, mechId, nome, qtd, valor, 'os', 'service', osRef);
            };
            if (Array.isArray(bike.servicosInclusos)) {
              bike.servicosInclusos.forEach((s) => addService(s.nome || s.servico || s.id, s.quantidade, s.valorFinal ?? s.valor));
            } else if (bike.serviceValues) {
              Object.entries(bike.serviceValues).forEach(([nome, s]) => {
                addService(nome, bike.services?.[nome] || s.quantidade, s.valorFinal ?? s.valor);
              });
            } else if (bike.valorServicos) {
              Object.entries(bike.valorServicos).forEach(([nome, val]) => {
                addService(nome, bike.services?.[nome], val);
              });
            }

            (bike.pecas || []).forEach((p) => {
              if (itemType !== 'all' && itemType !== 'part') return;
              const qty = parseInt(p.quantidade) || 1;
              const val = parseFloat(p.valor) || 0;
              addRow(periodKey, mechId, p.nome, qty, val, 'os', 'part', osRef);
            });
          }
        });
      });

      if (sourceFilter === 'all' || sourceFilter === 'avulso') {
  // 1) documentos com campo `data`
  const snapData = await getDocs(
    query(
      collection(db, 'servicosAvulsos'),
      where('data', '>=', start),
      where('data', '<=', end),
      orderBy('data')
    )
  );

  // 2) fallback para documentos antigos com `dataCriacao`
  const snapCriacao = await getDocs(
    query(
      collection(db, 'servicosAvulsos'),
      where('dataCriacao', '>=', start),
      where('dataCriacao', '<=', end),
      orderBy('dataCriacao')
    )
  );

  let avulsoIndex = 1;
  const handleDoc = (d, useCriacao = false) => {
    const { data, dataCriacao, servico, quantidade, valor, mecanicoId, pecas = [] } = d.data();
    const ts = useCriacao ? dataCriacao?.toDate?.() : data?.toDate?.();
    if (!ts) return;

    let periodKey;
    switch (reportType) {
      case 'daily':
        periodKey = ts.toLocaleDateString('pt-BR');
        break;
      case 'weekly': {
        const ws = new Date(ts);
        ws.setDate(ws.getDate() - ws.getDay());
        periodKey = `Semana de ${ws.toLocaleDateString('pt-BR')}`;
        break;
      }
      case 'monthly':
      default:
        periodKey = ts.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    }

    const mechCond =
      selectedMechanic === 'all'
        ? true
        : selectedMechanic === 'none'
        ? !mecanicoId
        : mecanicoId === selectedMechanic;

    if (!mechCond) return;

    const ref = `AV-${avulsoIndex++}`;

    // Serviço avulso
    if (selectedService === 'all' || servico === selectedService) {
      addRow(periodKey, mecanicoId || '', servico, parseInt(quantidade) || 1, parseFloat(valor) || 0, 'avulso', 'service', ref);
    }

    // Peças avulsas (se houver)
    (pecas || []).forEach((p) => {
      if (selectedService !== 'all' && p.nome !== selectedService) return;
      const qt = parseInt(p.quantidade) || 1;
      const vl = parseFloat(p.valor) || 0;
      addRow(periodKey, mecanicoId || '', p.nome, qt, vl, 'avulso', 'part', ref);
    });
  };

  snapData.forEach((d) => handleDoc(d, false));
  snapCriacao.forEach((d) => handleDoc(d, true));
}


      const result = Object.entries(agg)
        .map(([period, info]) => ({
          period,
          total: Number(info.total.toFixed(2)),
          quantity: info.qtd,
          lines: info.lines,
        }))
        .sort((a, b) => new Date(a.period) - new Date(b.period));

      setReportData(result);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (error?.message?.includes('create_composite')) {
        console.log('Crie o índice em:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async (opts = {}) => {
    const doc = new jsPDF();
    const startStr = dateRange.start;
    const endStr = dateRange.end;
    const format = reportType === 'daily' ? 'Diário' : reportType === 'weekly' ? 'Semanal' : 'Mensal';
    const mechValue = opts.reset ? 'all' : selectedMechanic;
    const mechName =
      mechValue === 'all'
        ? 'Todos'
        : mechValue === 'none'
        ? 'Sem mecânico'
        : mechanics.find((m) => m.id === mechValue)?.nome || mechValue;

    doc.text(`Relatório • ${format}`, 14, 15);
    doc.text(`Período: ${startStr} – ${endStr}`, 14, 22);
    doc.text(`Serviço: ${selectedService === 'all' ? 'Todos' : selectedService}`, 14, 29);
    doc.text(`Mecânico: ${mechName}`, 14, 36);

    const dataSet = reportData;
    const headResumo = [['Período', 'Quantidade', 'Total']];
    const bodyResumo = dataSet.map((r) => [r.period, r.quantity, r.total.toFixed(2)]);
    doc.autoTable({ head: headResumo, body: bodyResumo, startY: 40, headStyles: { fillColor: [250, 204, 21] } });

    const lines = dataSet.flatMap((r) =>
      r.lines.map((l) => [
        r.period,
        l.fonte === 'avulso' ? 'Avulso' : 'OS',
        l.ref || '',
        mechanics.find((m) => m.id === l.mechId)?.nome || (l.mechId ? l.mechId : '—'),
        l.tipo === 'part' ? 'Peça' : 'Serviço',
        l.nome,
        l.qtd,
        (l.valor * l.qtd).toFixed(2),
      ])
    );

    if (lines.length) {
      doc.autoTable({
        head: [['Período', 'Fonte', 'OS/Nº', 'Mecânico', 'Tipo', 'Item', 'Qtd', 'Total']],
        body: lines,
        startY: doc.lastAutoTable.finalY + 10,
        headStyles: { fillColor: [250, 204, 21] },
      });
    }

    doc.save('relatorio.pdf');
  };
  useEffect(() => {
    loadServices();
    loadMechanics();
  }, []);

  useEffect(() => {
    loadReportData();
  }, [reportType, selectedService, selectedMechanic, dateRange, sourceFilter, itemType]);
  useEffect(() => {
    const now = new Date();
    let start = new Date(now);
    switch (reportType) {
      case "daily":
        // daily reports should default to the current day only
        break;
      case "weekly":
        start.setDate(now.getDate() - 7);
        break;
      case "monthly":
        start.setMonth(now.getMonth() - 1);
        break;
    }

    setDateRange({
      start: start.toISOString().split("T")[0],
      end: now.toISOString().split("T")[0],
    });
  }, [reportType]);
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-amber-400 to-black p-2 rounded-full">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Relatórios</h1>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu((s) => !s)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2 rounded-full transition-all transform hover:scale-105 shadow-lg inline-flex items-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Exportar PDF ▼</span>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 bg-white shadow rounded text-sm z-10">
                    <button
                      onClick={() => { setShowExportMenu(false); exportPDF(); }}
                      className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                    >
                      Atual (com filtros)
                    </button>
                    <button
                      onClick={() => { setShowExportMenu(false); exportPDF({ reset: true }); }}
                      className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
                    >
                      Todos os dados
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-8">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Filtros do Relatório</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fonte das entradas</label>
                <select
                  value={sourceFilter}
                  onChange={e => setSourceFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">Todas as fontes</option>
                  <option value="os">Ordens de Serviço</option>
                  <option value="avulso">Serviços Avulsos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de item</label>
                <select
                  value={itemType}
                  onChange={e => setItemType(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">Peças + Serviços</option>
                  <option value="service">Somente Serviços</option>
                  <option value="part">Somente Peças</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Relatório
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Serviço</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">Todos os serviços</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mecânico</label>
                <select
                  value={selectedMechanic}
                  onChange={(e) => setSelectedMechanic(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">Todos os mecânicos</option>
                  <option value="none">Sem mecânico</option>
                  {mechanics.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Inicial</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Final</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receita Total</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Serviços</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalServices}</p>
                </div>
                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                  <Package className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ticket Médio</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Período</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {Math.ceil((new Date(dateRange.end) - new Date(dateRange.start)) / (1000 * 60 * 60 * 24 * 30))} meses
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                  <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
              Resultados
              {selectedService !== 'all' && ` — ${selectedService}`}
              {selectedMechanic !== 'all' && ` — ${mechanics.find(m=>m.id===selectedMechanic)?.nome || ''}`}
            </h2>
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#2563eb" name="Valor Total (R$)" />
                  <Line type="monotone" dataKey="quantity" stroke="#059669" name="Quantidade de Serviços" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Detalhamento</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">PERÍODO</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">FONTE</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">OS/Nº</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">MECÂNICO</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">TIPO</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">ITEM</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-800 dark:text-white">QTD</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-800 dark:text-white">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.flatMap(({ period, lines }) =>
                    lines.map((l, i) => (
                      <tr
                        key={period + i}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-3 px-4">{period}</td>
                        <td className="py-3 px-4">{l.fonte === 'avulso' ? 'Avulso' : 'OS'}</td>
                        <td className="py-3 px-4">{l.ref || '—'}</td>
                        <td className="py-3 px-4">{mechanics.find(m => m.id === l.mechId)?.nome || (l.mechId ? l.mechId : '—')}</td>
                        <td className="py-3 px-4">{l.tipo === 'part' ? 'Peça' : 'Serviço'}</td>
                        <td className="py-3 px-4">{l.nome}</td>
                        <td className="py-3 px-4 text-center">{l.qtd}</td>
                        <td className="py-3 px-4 text-right">R$ {(l.valor * l.qtd).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                    <td colSpan="5" className="py-3 px-4 font-bold text-gray-800 dark:text-white">TOTAL GERAL</td>
                    <td className="py-3 px-4 text-center font-bold text-gray-800 dark:text-white">{totalServices}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400 text-lg">
                      R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportsManagement;
