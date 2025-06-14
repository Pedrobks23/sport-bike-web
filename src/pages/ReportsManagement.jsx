import React, { useState, useEffect } from "react";
import { ArrowLeft, Download, BarChart3, Calendar, TrendingUp, DollarSign, Package } from "lucide-react";
import { collection, query, getDocs, where, orderBy } from "firebase/firestore";
import { db } from "../config/firebase";
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
  const [services, setServices] = useState([]);
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
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
  const processOrders = (orders, type) => {
    try {
      console.log("Iniciando processamento de ordens:", orders);
      const data = {};
  
      orders.forEach((order) => {
        if (!order.data) return;
  
        const orderDate = order.data;
        let key;
        
        switch (type) {
          case "daily":
            key = orderDate.toLocaleDateString("pt-BR");
            break;
          case "weekly":
            const weekStart = new Date(orderDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            key = `Semana de ${weekStart.toLocaleDateString("pt-BR")}`;
            break;
          case "monthly":
          default:
            key = orderDate.toLocaleString("pt-BR", {
              month: "long",
              year: "numeric",
            });
        }
  
        // Inicializa o período se não existir
        if (!data[key]) {
          data[key] = { total: 0, quantity: 0 };
        }
  
        // Usa os valores diretos da ordem, sem acumular
        if (order.valor > 0) {
          data[key].total += Number(order.valor);
          data[key].quantity = data[key].quantity + Number(order.quantidade);
        }
  
        console.log(`Acumulado para ${key}:`, {
          ordem: order.id,
          valorOriginal: order.valor,
          servicosOriginal: order.quantidade,
          valorAcumulado: data[key].total,
          servicosAcumulados: data[key].quantity
        });
      });
  
      // Remove períodos sem valores
      const result = Object.entries(data)
        .filter(([_, values]) => values.total > 0)
        .map(([period, values]) => ({
          period,
          total: Number(values.total.toFixed(2)),
          quantity: values.quantity
        }))
        .sort((a, b) => new Date(a.period) - new Date(b.period));
  
      console.log("Resultado final processado:", result);
      return result;
    } catch (error) {
      console.error("Erro ao processar ordens:", error);
      return [];
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const ordensRef = collection(db, "ordens");
      let ordersQuery = query(ordensRef, orderBy("dataCriacao", "desc"));
      const querySnapshot = await getDocs(ordersQuery);
      
      const orders = querySnapshot.docs
        .map((doc) => {
          const data = doc.data();
          let totalValor = 0;
          let totalServicos = 0;
          
          console.log("Processando ordem:", doc.id, data);
  
          if (data.bicicletas?.length > 0) {
            data.bicicletas.forEach((bike, index) => {
              console.log(`Processando bicicleta ${index}:`, bike);
              
              // Processa valorServicos (formato antigo)
              if (bike.valorServicos) {
                Object.entries(bike.valorServicos).forEach(([serviceName, valor]) => {
                  if (selectedService === "all" || serviceName === selectedService) {
                    const quantidade = bike.services?.[serviceName] || 1;
                    const servicoTotal = parseFloat(valor) * quantidade;
                    totalValor += servicoTotal;
                    totalServicos += quantidade;
                    
                    console.log(`Processando serviço (valorServicos) ${serviceName}:`, {
                      valor,
                      quantidade,
                      servicoTotal,
                      totalAcumulado: totalValor
                    });
                  }
                });
              }
  
              // Processa serviceValues (formato novo)
              if (bike.serviceValues) {
                Object.entries(bike.serviceValues).forEach(([serviceName, serviceData]) => {
                  if (selectedService === "all" || serviceName === selectedService) {
                    const valor = serviceData.valorFinal || serviceData.valor || 0;
                    const quantidade = bike.services?.[serviceName] || 1;
                    const servicoTotal = valor * quantidade;
                    totalValor += servicoTotal;
                    totalServicos += quantidade;
                    
                    console.log(`Processando serviço (serviceValues) ${serviceName}:`, {
                      valor,
                      quantidade,
                      servicoTotal,
                      totalAcumulado: totalValor
                    });
                  }
                });
              }
            });
          }
  
          console.log("Totais finais para ordem:", doc.id, {
            valor: totalValor,
            servicos: totalServicos
          });
  
          const dataFinalizacao = data.dataAtualizacao
            ? (typeof data.dataAtualizacao === 'string'
                ? new Date(data.dataAtualizacao)
                : data.dataAtualizacao.toDate())
            : (typeof data.dataCriacao === 'string'
                ? new Date(data.dataCriacao)
                : data.dataCriacao.toDate());

          return {
            id: doc.id,
            status: data.status,
            data: dataFinalizacao,
            valor: totalValor,
            quantidade: totalServicos,
          };
        })
        .filter((order) => {
          const startDate = new Date(dateRange.start);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          return (
            order.status?.toLowerCase() === 'pronto' &&
            order.data >= startDate &&
            order.data <= endDate
          );
        });
  
      const processedData = processOrders(orders, reportType);
      console.log("Dados processados:", processedData);
      setReportData(processedData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.text("Relatório de Serviços", 14, 15);
    doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, 14, 25);

    const tableColumn = ["Período", "Quantidade", "Total"];
    const tableRows = reportData.map((item) => [
      item.period,
      item.quantity,
      `R$ ${item.total.toFixed(2)}`,
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`relatorio-${new Date().toISOString()}.pdf`);
  };
  useEffect(() => {
    loadServices();
  }, []);
  useEffect(() => {
    loadReportData();
  }, [reportType, selectedService, dateRange]);
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
        start.setMonth(now.getMonth() - 6);
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
                  <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 p-2 rounded-full">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Relatórios</h1>
                </div>
              </div>
              <button
                onClick={exportPDF}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-full transition-all transform hover:scale-105 shadow-lg inline-flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Exportar PDF</span>
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-8">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Filtros do Relatório</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Resultados</h2>
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
                    <th className="text-center py-3 px-4 font-semibold text-gray-800 dark:text-white">QUANTIDADE</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-800 dark:text-white">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-800 dark:text-white">{item.period}</td>
                      <td className="py-3 px-4 text-center text-gray-800 dark:text-white">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-800 dark:text-white">
                        R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                    <td className="py-3 px-4 font-bold text-gray-800 dark:text-white">TOTAL GERAL</td>
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
