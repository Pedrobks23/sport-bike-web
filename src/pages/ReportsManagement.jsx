import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
const ReportsManagement = () => {
const navigate = useNavigate();
const [loading, setLoading] = useState(true);
const [reportType, setReportType] = useState('monthly');
const [selectedService, setSelectedService] = useState('all');
const [services, setServices] = useState([]);
const getDefaultDateRange = () => {
const end = new Date();
const start = new Date();
start.setDate(start.getDate() - 30);
 return {
  start: start.toISOString().split('T')[0],
  end: end.toISOString().split('T')[0]
};
};
const [dateRange, setDateRange] = useState(getDefaultDateRange());
const [reportData, setReportData] = useState([]);

const loadServices = async () => {
    try {
      const servicosRef = collection(db, 'servicos');
      const querySnapshot = await getDocs(servicosRef);
      const servicosData = [];
      
      querySnapshot.forEach((doc) => {
        // Cada campo no documento é um serviço
        const data = doc.data();
        Object.keys(data).forEach(serviceName => {
          servicosData.push({
            id: serviceName, // Usando o nome como ID
            nome: serviceName,
            valor: data[serviceName]
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
      const data = {};
      
      orders.forEach(order => {
        if (!order.data || !order.valor) return;
        
        const orderDate = order.data.toDate();
        let key;
        
        switch(type) {
          case 'daily':
            key = orderDate.toLocaleDateString('pt-BR');
            break;
          case 'weekly':
            const weekStart = new Date(orderDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            key = `Semana de ${weekStart.toLocaleDateString('pt-BR')}`;
            break;
          case 'monthly':
          default:
            key = orderDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        }
  
        if (!data[key]) {
          data[key] = { total: 0, quantity: 0 };
        }
        data[key].total += Number(order.valor);
        data[key].quantity += 1;
      });
  
      const result = Object.entries(data)
        .map(([period, values]) => ({
          period,
          total: values.total,
          quantity: values.quantity
        }))
        .sort((a, b) => new Date(a.period) - new Date(b.period));
  
      return result;
    } catch (error) {
      console.error('Erro ao processar ordens:', error);
      return [];
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const ordensRef = collection(db, 'ordens');
      let ordersQuery = query(ordensRef, orderBy('data', 'desc'));
  
      if (selectedService !== 'all') {
        ordersQuery = query(ordensRef, 
          where('servicoNome', '==', selectedService), 
          orderBy('data', 'desc')
        );
      }
  
      const querySnapshot = await getDocs(ordersQuery);
      const orders = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            data: data.data,
            valor: Number(data.valor || 0),
            servicoNome: data.servicoNome
          };
        })
        .filter(order => {
          try {
            const orderDate = order.data?.toDate();
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end);
            return orderDate && orderDate >= startDate && orderDate <= endDate;
          } catch (error) {
            console.error('Erro ao processar data:', error);
            return false;
          }
        });
  
      const processedData = processOrders(orders, reportType);
      console.log('Dados processados:', processedData);
      setReportData(processedData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };
  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.text('Relatório de Serviços', 14, 15);
    doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, 14, 25);
  
    const tableColumn = ["Período", "Quantidade", "Total"];
    const tableRows = reportData.map(item => [
      item.period,
      item.quantity,
      `R$ ${item.total.toFixed(2)}`
    ]);
  
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }
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
let start = new Date();
switch(reportType) {
  case 'daily':
    start.setDate(now.getDate() - 7);
    break;
  case 'weekly':
    start.setDate(now.getDate() - 28);
    break;
  case 'monthly':
    start.setMonth(now.getMonth() - 6);
    break;
}

setDateRange({
  start: start.toISOString().split('T')[0],
  end: now.toISOString().split('T')[0]
});
}, [reportType]);
return (
<div className="min-h-screen bg-gray-100">
<header className="bg-white shadow">
<div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
<div className="flex items-center justify-between">
<div className="flex items-center">
<button
onClick={() => navigate('/admin')}
className="mr-4 text-gray-600 hover:text-gray-900 flex items-center"
>
<ArrowLeft className="w-5 h-5 mr-2" />
Voltar
</button>
<h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
</div>
<button
           onClick={exportPDF}
           className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
         >
<Download className="w-5 h-5 mr-2" />
Exportar PDF
</button>
</div>
</div>
</header>
 <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de Relatório</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Serviço</label>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="all">Todos os serviços</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Data Inicial</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Data Final</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>
    </div>

    {loading ? (
      <div>Carregando...</div>
    ) : (
      <>
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Resultados</h2>
          <div className="h-96">
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

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Detalhamento</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                    Período
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      R$ {item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}
  </main>
</div>
);
};
export default ReportsManagement;