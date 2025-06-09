"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Wrench,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  User,
  Phone,
  Calendar,
  DollarSign,
} from "lucide-react";
import { getOrders } from "../services/orderService";

export default function ServiceOrdersPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState({ pending: [], inProgress: [], completed: [] });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);


  useEffect(() => {
    const load = async () => {
      try {
        const data = await getOrders();
        setOrders({
          pending: data.pending,
          inProgress: data.inProgress,
          completed: data.done,
        });
      } catch (err) {
        console.error("Erro ao carregar ordens:", err);
      }
    };
    load();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Pendente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Em Andamento":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Pronto":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const handleOrderClick = (orderId) => {
    alert(`Abrindo ordem de serviço: ${orderId}`);
  };

  const filteredOrders = {
    pending: orders.pending.filter(
      (o) =>
        o.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.cliente?.telefone?.includes(searchTerm)
    ),
    inProgress: orders.inProgress.filter(
      (o) =>
        o.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.cliente?.telefone?.includes(searchTerm)
    ),
    completed: orders.completed.filter(
      (o) =>
        o.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.cliente?.telefone?.includes(searchTerm)
    ),
  };

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
                  <div className="bg-gradient-to-r from-amber-400 to-amber-600 p-2 rounded-full">
                    <Wrench className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ordens de Serviço</h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar OS ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent w-64"
                  />
                </div>
                <button className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-800 dark:text-yellow-400 font-medium">Pendente</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">({orders.pending.length})</p>
                </div>
                <div className="bg-yellow-200 dark:bg-yellow-800 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-700 dark:text-yellow-300" />
                </div>
              </div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-800 dark:text-blue-400 font-medium">Em Andamento</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">({orders.inProgress.length})</p>
                </div>
                <div className="bg-blue-200 dark:bg-blue-800 p-3 rounded-full">
                  <Wrench className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 dark:text-green-400 font-medium">Pronto</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-300">({orders.completed.length})</p>
                </div>
                <div className="bg-green-200 dark:bg-green-800 p-3 rounded-full">
                  <User className="w-6 h-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-400">🟡 Pendente ({orders.pending.length})</h3>
              </div>
              <div className="space-y-4">
                {filteredOrders.pending.map((order) => (
                  <div
                    key={order.id || order.codigo}
                    onClick={() => handleOrderClick(order.id || order.codigo)}
                    className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {order.codigo}
                      </h4>
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Data: {order.dataCriacao?.slice(0,10)}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Agendamento: {order.dataAgendamento?.slice(0,10)}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Total: R$ {order.valorTotal}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{order.cliente?.telefone}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-3 line-clamp-2">{order.description}</p>
                    <div className="mt-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400">🔵 Em Andamento ({orders.inProgress.length})</h3>
              </div>
              <div className="space-y-4">
                {filteredOrders.inProgress.map((order) => (
                  <div
                    key={order.id || order.codigo}
                    onClick={() => handleOrderClick(order.id || order.codigo)}
                    className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {order.codigo}
                      </h4>
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Data: {order.dataCriacao?.slice(0,10)}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Agendamento: {order.dataAgendamento?.slice(0,10)}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Total: R$ {order.valorTotal}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{order.cliente?.telefone}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-3 line-clamp-2">{order.description}</p>
                    <div className="mt-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-green-700 dark:text-green-400">🟢 Pronto ({orders.completed.length})</h3>
                <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">Mostrar menos</button>
              </div>
              <div className="space-y-4">
                {filteredOrders.completed.slice(0, 4).map((order) => (
                  <div
                    key={order.id || order.codigo}
                    onClick={() => handleOrderClick(order.id || order.codigo)}
                    className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {order.codigo}
                      </h4>
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Data: {order.dataCriacao?.slice(0,10)}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Agendamento: {order.dataAgendamento?.slice(0,10)}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Total: R$ {order.valorTotal}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{order.cliente?.telefone}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-3 line-clamp-2">{order.description}</p>
                    <div className="mt-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

