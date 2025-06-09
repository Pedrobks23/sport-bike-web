import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bike,
  Receipt,
  FileText,
  Wrench,
  Users,
  Settings,
  Home as HomeIcon,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import {
  getOrdersTodayCount,
  getCustomersCount,
  getBikesInMaintenanceCount,
} from "../services/dashboardService";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";

export default function Admin() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [ordersToday, setOrdersToday] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [bikesMaintenance, setBikesMaintenance] = useState(0);
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
      try {
        const [o, c, b] = await Promise.all([
          getOrdersTodayCount(),
          getCustomersCount(),
          getBikesInMaintenanceCount(),
        ]);
        setOrdersToday(o);
        setCustomersCount(c);
        setBikesMaintenance(b);
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
      }
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

  const adminModules = [
    {
      icon: <Receipt className="w-8 h-8" />,
      title: "Recibos",
      description: "Emitir e gerenciar recibos",
      color: "from-blue-400 to-blue-600",
      hoverColor: "hover:from-blue-500 hover:to-blue-700",
      path: "/admin/receipts",
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Nova Ordem de Serviço",
      description: "Criar nova ordem de serviço manualmente",
      color: "from-green-400 to-green-600",
      hoverColor: "hover:from-green-500 hover:to-green-700",
      path: "/admin/orders/new",
    },
    {
      icon: <Wrench className="w-8 h-8" />,
      title: "Ordens de Serviço",
      description: "Cadastrar e gerenciar ordens de serviço",
      color: "from-amber-400 to-amber-600",
      hoverColor: "hover:from-amber-500 hover:to-amber-700",
      path: "/admin/orders",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Clientes",
      description: "Gerenciar cadastro de clientes",
      color: "from-purple-400 to-purple-600",
      hoverColor: "hover:from-purple-500 hover:to-purple-700",
      path: "/admin/customers",
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: "Serviços",
      description: "Configurar tipos de serviços",
      color: "from-gray-400 to-gray-600",
      hoverColor: "hover:from-gray-500 hover:to-gray-700",
      path: "/admin/services",
    },
    {
      icon: <HomeIcon className="w-8 h-8" />,
      title: "Home",
      description: "Gerenciar destaques da página inicial",
      color: "from-red-400 to-red-600",
      hoverColor: "hover:from-red-500 hover:to-red-700",
      path: "/admin/home",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Relatórios",
      description: "Visualizar relatórios e estatísticas",
      color: "from-indigo-400 to-indigo-600",
      hoverColor: "hover:from-indigo-500 hover:to-indigo-700",
      path: "/admin/reports",
    },
  ];

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

  const handleModuleClick = (path) => {
    navigate(path);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
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
        <main className="container mx-auto px-4 py-8">
          <div className="mb-12">
            <div className="bg-gradient-to-r from-amber-400 to-amber-600 rounded-2xl p-8 text-white shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Bem-vindo ao Dashboard</h2>
              <p className="text-xl opacity-90 max-w-2xl">Gerencie todos os aspectos da Sport & Bike através desta central administrativa moderna e intuitiva.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ordens Hoje</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{ordersToday}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <Wrench className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Clientes Cadastrados</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{customersCount}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bikes em Manutenção</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{bikesMaintenance}</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                  <Bike className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Módulos do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminModules.map((module, index) => (
                <div key={index} onClick={() => handleModuleClick(module.path)} className="group cursor-pointer">
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                    <div className={`bg-gradient-to-r ${module.color} ${module.hoverColor} p-4 rounded-xl mb-4 text-white group-hover:scale-110 transition-transform duration-300 w-fit`}>
                      {module.icon}
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {module.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{module.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <footer className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-t border-white/20 dark:border-gray-700/20 mt-12">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <Bike className="w-5 h-5 text-amber-500" />
                <span className="text-gray-600 dark:text-gray-400">© 2025 Sport & Bike - Sistema Administrativo</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">Versão 2.0 - Última atualização: Janeiro 2025</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
