import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { ArrowLeft } from "lucide-react";

const NewCustomer = () => {
  const navigate = useNavigate();
  const { addCliente } = useData();
  const [customer, setCustomer] = useState({
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setCustomer({ ...customer, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addCliente({
        id: Date.now().toString(),
        ...customer,
        dataCriacao: new Date().toISOString(),
      });
      navigate("/admin/customers");
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      alert("Erro ao adicionar cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-brand-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <button
          onClick={() => navigate("/admin/customers")}
          className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </button>
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Novo Cliente</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={customer.nome}
              onChange={handleChange("nome")}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={customer.telefone}
              onChange={handleChange("telefone")}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={customer.email}
              onChange={handleChange("email")}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endereço
            </label>
            <input
              type="text"
              value={customer.endereco}
              onChange={handleChange("endereco")}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCustomer;
