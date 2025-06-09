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
<<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual


export default function ServiceOrdersPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
<<<<<<ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

<<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
  const orders = {
    pending: [
      {
        id: "OS-202505020",
        date: "24/05/2025",
        appointment: "26/05/2025",
        total: "R$ 100.00",
        description: "OGGI BIG WHEEL 70 ()",
        phone: "85985265390",
        status: "Pendente",
      },
    ],
    inProgress: [
      {
        id: "OS-202505019",
        date: "23/05/2025",
        appointment: "23/05/2025",
        total: "R$ 100.00",
        description: "Caloi Explorer (azul)",
        phone: "85982136179",
        status: "Em Andamento",
      },
      {
        id: "OS-202505018",
        date: "17/05/2025",
        appointment: "19/05/2025",
        total: "R$ 1.986,00",
        description:
          "aro 20 branca com rosa (), pneu atacama aro 29 (), caloi ceci aro 24 (), over aro 26 preto (), caloi andes aro26 (), cannondale laranja ()",
        phone: "85981910132",
        status: "Em Andamento",
      },
    ],
    completed: [
      {
        id: "OS-202505017",
        date: "17/05/2025",
        appointment: "19/05/2025",
        total: "R$ 100.00",
        description: "ABSOLUTE HERA ()",
        phone: "85999925245",
        status: "Pronto",
      },
      {
        id: "OS-202505008",
        date: "12/05/2025",
        appointment: "12/05/2025",
        total: "R$ 200.00",
        description: "Caloi Elite Carbon 29 (preta)",
        phone: "85999999943",
        status: "Pronto",
      },
      {
        id: "OS-202505007",
        date: "12/05/2025",
        appointment: "13/05/2025",
        total: "R$ 385.00",
        description:
          "Caloi Elite (Prata Com Vermelho), Caloi Explorer (amarela), Caloi T-Type (Prata)",
        phone: "85982136179",
        status: "Pronto",
      },
    ],
  };


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

<<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual

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
<<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual

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
<<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
                {orders.pending.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderClick(order.id)}

                    className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
<<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
                        {order.id}
       </h4>
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
<<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
                        <span>Data: {order.date}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Agendamento: {order.appointment}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Total: {order.total}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{order.phone}</span>

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
<<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
                {orders.inProgress.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderClick(order.id)}

                    className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
<<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
                        {order.id}

                      </h4>
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
<<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
                        <span>Data: {order.date}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Agendamento: {order.appointment}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Total: {order.total}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{order.phone}</span>

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
<<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
                {orders.completed.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderClick(order.id)}

                    className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
<<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
                        {order.id}

                      </h4>
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
<<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
                        <span>Data: {order.date}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Agendamento: {order.appointment}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Total: {order.total}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{order.phone}</span>

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

