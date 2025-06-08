import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";

const Admin = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/admin/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/assets/Logo.png" alt="Sport & Bike" className="h-10" />
            <h1 className="ml-4 text-xl font-bold text-[#333]">
              Área Administrativa
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-[#FFC107] transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card Oficina */}
          <div
            onClick={() => navigate("/admin/receipts")}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <h2 className="text-xl font-bold text-[#333] mb-2">Recibos</h2>
            <p className="text-gray-600">Emitir e gerenciar recibos</p>
          </div>

          {/* Card Nova Ordem de Serviço */}
          <div
            onClick={() => navigate("/admin/orders/new")}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <h2 className="text-xl font-bold text-[#333] mb-2">
              Nova Ordem de Serviço
            </h2>
            <p className="text-gray-600">
              Criar nova ordem de serviço manualmente
            </p>
          </div>

          {/* Card Ordens de Serviço */}
          <div
            onClick={() => navigate("/admin/orders")}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <h2 className="text-xl font-bold text-[#333] mb-2">
              Ordens de Serviço
            </h2>
            <p className="text-gray-600">
              Cadastrar e gerenciar ordens de serviço
            </p>
          </div>

          {/* Card Clientes */}
          <div
            onClick={() => navigate("/admin/customers")}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <h2 className="text-xl font-bold text-[#333] mb-2">Clientes</h2>
            <p className="text-gray-600">Gerenciar cadastro de clientes</p>
          </div>

          {/* Card Serviços */}
          <div
            onClick={() => navigate("/admin/services")}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <h2 className="text-xl font-bold text-[#333] mb-2">Serviços</h2>
            <p className="text-gray-600">Configurar tipos de serviços</p>
          </div>

          {/* Card Home */}
          <div
            onClick={() => navigate("/admin/home")}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <h2 className="text-xl font-bold text-[#333] mb-2">Home</h2>
            <p className="text-gray-600">Gerenciar destaques da página inicial</p>
          </div>

          {/* Card Relatórios */}
          <div
            onClick={() => navigate("/admin/reports")}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <h2 className="text-xl font-bold text-[#333] mb-2">Relatórios</h2>
            <p className="text-gray-600">
              Visualizar relatórios e estatísticas
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;