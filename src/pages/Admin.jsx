import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bike,
  Receipt,
  FileText,
  Wrench,
  Hammer,
  Users,
  UserCog,
  Settings,
  Home as HomeIcon,
  BarChart3,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Calendar,
  CheckCircle,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import {
  getOrdersTodayCount,
  getCustomersCount,
  getBikesInMaintenanceCount,
  getInProgressCount,
  getReadyForPickupCount,
  getMonthlyRevenue,
  getLatestOrders,
} from "../services/dashboardService";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

const getFormattedDate = () =>
  new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "—";
  return `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
};

const STATUS_COLORS = {
  Pendente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Em Andamento": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Pronto: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Cancelado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const MetricSkeleton = () => (
  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-5 shadow-lg animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>
    <div className="h-7 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
  </div>
);

export default function Admin() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    ordersToday: null,
    inProgress: null,
    readyForPickup: null,
    customersCount: null,
    bikesMaintenance: null,
    monthlyRevenue: null,
  });
  const [latestOrders, setLatestOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      const [r0, r1, r2, r3, r4, r5, r6] = await Promise.allSettled([
        getOrdersTodayCount(),
        getInProgressCount(),
        getReadyForPickupCount(),
        getCustomersCount(),
        getBikesInMaintenanceCount(),
        getMonthlyRevenue(),
        getLatestOrders(5),
      ]);
      setMetrics({
        ordersToday: r0.status === "fulfilled" ? r0.value : null,
        inProgress: r1.status === "fulfilled" ? r1.value : null,
        readyForPickup: r2.status === "fulfilled" ? r2.value : null,
        customersCount: r3.status === "fulfilled" ? r3.value : null,
        bikesMaintenance: r4.status === "fulfilled" ? r4.value : null,
        monthlyRevenue: r5.status === "fulfilled" ? r5.value : null,
      });
      if (r6.status === "fulfilled") setLatestOrders(r6.value);
      setIsLoading(false);
    };
    loadStats();
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = async () => {
    if (confirm("Tem certeza que deseja sair?")) {
      try {
        await signOut(auth);
        navigate("/admin/login");
      } catch (err) {
        console.error("Erro ao fazer logout:", err);
      }
    }
  };

  const adminModules = [
    {
      icon: <Receipt className="w-5 h-5" />,
      title: "Recibos",
      description: "Emitir e gerenciar recibos",
      color: "from-blue-400 to-blue-600",
      path: "/admin/receipts",
    },
    {
      icon: <ClipboardList className="w-5 h-5" />,
      title: "Orçamentos",
      description: "Criar orçamentos rapidamente",
      color: "from-cyan-400 to-cyan-600",
      path: "/admin/budgets/new",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Nova Ordem de Serviço",
      description: "Criar nova ordem de serviço manualmente",
      color: "from-green-400 to-green-600",
      path: "/admin/orders/new",
    },
    {
      icon: <Wrench className="w-5 h-5" />,
      title: "Ordens de Serviço",
      description: "Cadastrar e gerenciar ordens de serviço",
      color: "from-amber-400 to-amber-600",
      path: "/admin/orders",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Clientes",
      description: "Gerenciar cadastro de clientes",
      color: "from-purple-400 to-purple-600",
      path: "/admin/customers",
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: "Serviços",
      description: "Configurar tipos de serviços",
      color: "from-gray-400 to-gray-600",
      path: "/admin/services",
    },
    {
      icon: <Hammer className="w-5 h-5" />,
      title: "Serviço Rápido",
      description: "Registrar serviço avulso",
      color: "from-teal-400 to-teal-600",
      path: "/admin/servico-rapido",
    },
    {
      icon: <UserCog className="w-5 h-5" />,
      title: "Mecânicos",
      description: "Gerenciar mecânicos da oficina",
      color: "from-yellow-400 to-yellow-600",
      path: "/admin/mecanicos",
    },
    {
      icon: <HomeIcon className="w-5 h-5" />,
      title: "Home",
      description: "Gerenciar destaques da página inicial",
      color: "from-red-400 to-red-600",
      path: "/admin/home",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Relatórios",
      description: "Visualizar relatórios e estatísticas",
      color: "from-indigo-400 to-indigo-600",
      path: "/admin/reports",
    },
  ];

  const metricCards = [
    {
      label: "Ordens Hoje",
      value: metrics.ordersToday,
      icon: <Calendar className="w-5 h-5" />,
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Em Andamento",
      value: metrics.inProgress,
      icon: <Wrench className="w-5 h-5" />,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Prontas p/ Retirada",
      value: metrics.readyForPickup,
      icon: <CheckCircle className="w-5 h-5" />,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Clientes Cadastrados",
      value: metrics.customersCount,
      icon: <Users className="w-5 h-5" />,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Bikes na Oficina",
      value: metrics.bikesMaintenance,
      icon: <Bike className="w-5 h-5" />,
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "Faturamento do Mês",
      value: metrics.monthlyRevenue,
      icon: <DollarSign className="w-5 h-5" />,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      format: formatCurrency,
    },
  ];

  const quickActions = [
    {
      label: "Nova OS",
      icon: <FileText className="w-5 h-5" />,
      color: "bg-green-500 hover:bg-green-600",
      path: "/admin/orders/new",
      external: false,
    },
    {
      label: "Novo Orçamento",
      icon: <ClipboardList className="w-5 h-5" />,
      color: "bg-cyan-500 hover:bg-cyan-600",
      path: "/admin/budgets/new",
      external: false,
    },
    {
      label: "Consultar OS",
      icon: <ExternalLink className="w-5 h-5" />,
      color: "bg-amber-500 hover:bg-amber-600",
      path: "/consulta",
      external: true,
    },
    {
      label: "Novo Recibo",
      icon: <Receipt className="w-5 h-5" />,
      color: "bg-blue-500 hover:bg-blue-600",
      path: "/admin/receipts",
      external: false,
    },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src="/assets/Logo.png" alt="Sport & Bike" className="w-10 h-10" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Área Administrativa</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sport & Bike - Dashboard</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  title="Alternar tema"
                >
                  {isDarkMode ? "🌞" : "🌙"}
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition-colors font-medium inline-flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
              <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? (
                  <X className="w-6 h-6 text-gray-800 dark:text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-800 dark:text-white" />
                )}
              </button>
            </div>
            {isMenuOpen && (
              <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col space-y-4 pt-4">
                  <button onClick={toggleDarkMode} className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <span>{isDarkMode ? "🌞" : "🌙"}</span>
                    <span>Alternar tema</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition-colors font-medium inline-flex items-center space-x-2 w-fit"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Section 1 — Greeting */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
              {getGreeting()}, Sport &amp; Bike
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 capitalize">{getFormattedDate()}</p>
            {!isLoading && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {metrics.ordersToday ?? "—"}
                </span>{" "}
                ordens agendadas hoje{" • "}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {metrics.bikesMaintenance ?? "—"}
                </span>{" "}
                bikes na oficina{" • "}
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {metrics.readyForPickup ?? "—"}
                </span>{" "}
                prontas para retirada
              </p>
            )}
          </div>

          {/* Section 2 — Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <MetricSkeleton key={i} />)
              : metricCards.map((card, i) => (
                  <div
                    key={i}
                    className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-5 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{card.label}</p>
                      <div className={`${card.iconBg} p-2 rounded-full ${card.iconColor}`}>
                        {card.icon}
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                      {card.value === null
                        ? "—"
                        : card.format
                        ? card.format(card.value)
                        : card.value}
                    </p>
                  </div>
                ))}
          </div>

          {/* Section 3 — Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Atalhos Rápidos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() =>
                    action.external ? window.open(action.path, "_blank") : navigate(action.path)
                  }
                  className={`${action.color} text-white rounded-2xl p-5 flex items-center space-x-3 shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 w-full`}
                >
                  {action.icon}
                  <span className="font-semibold text-sm md:text-base">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4 — System Modules */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Módulos do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminModules.map((module, index) => (
                <div key={index} onClick={() => navigate(module.path)} className="group cursor-pointer">
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-4">
                    <div
                      className={`bg-gradient-to-br ${module.color} p-2.5 rounded-full text-white flex-shrink-0`}
                    >
                      {module.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-sm">
                        {module.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{module.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5 — Latest Orders */}
          {latestOrders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Últimas Ordens</h3>
                <button
                  onClick={() => navigate("/admin/orders")}
                  className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Ver todas →
                </button>
              </div>
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {latestOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-amber-50/50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                          {order.codigo}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {order.clienteNome}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            STATUS_COLORS[order.status] ||
                            "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {order.status}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                          {formatDate(order.dataCriacao)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-t border-white/20 dark:border-gray-700/20 mt-8">
          <div className="container mx-auto px-4 py-5">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-2 md:mb-0">
                <Bike className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  © 2025 Sport & Bike - Sistema Administrativo
                </span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">Versão 2.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
