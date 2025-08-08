import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Pencil, Trash } from "lucide-react";
import { serverTimestamp } from "firebase/firestore";
import { listMechanics } from "../services/mechanicService";
import {
  listQuickServices,
  addQuickService,
  updateQuickService,
  deleteQuickService,
} from "../services/quickServiceService";

const QuickService = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [services, setServices] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    mecanicoId: "",
    servico: "",
    valor: "",
    quantidade: 1,
    observacoes: "",
  });

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    listMechanics().then(setMechanics).catch(console.error);
    loadServices();
  }, []);

  const loadServices = () => {
    listQuickServices().then(setServices).catch(console.error);
  };

  const getMechanicName = (id) => {
    const mech = mechanics.find((m) => m.id === id);
    return mech ? mech.nome : "";
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mecanicoId || !form.servico || !form.valor) {
      setMessage("Preencha os campos obrigatórios");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        mecanicoId: form.mecanicoId,
        servico: form.servico,
        valor: parseFloat(form.valor),
        quantidade: parseInt(form.quantidade) || 1,
        observacoes: form.observacoes,
      };
      if (editingId) {
        await updateQuickService(editingId, payload);
        setMessage("Serviço atualizado com sucesso");
      } else {
        await addQuickService({ ...payload, dataCriacao: serverTimestamp() });
        setMessage("Serviço salvo com sucesso");
      }
      setForm({ mecanicoId: "", servico: "", valor: "", quantidade: 1, observacoes: "" });
      setEditingId(null);
      loadServices();
    } catch (err) {
      console.error(err);
      setMessage("Erro ao salvar serviço");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      mecanicoId: item.mecanicoId || "",
      servico: item.servico,
      valor: item.valor,
      quantidade: item.quantidade,
      observacoes: item.observacoes || "",
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Excluir serviço?")) {
      await deleteQuickService(id);
      loadServices();
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <header className="bg-white dark:bg-gray-800 p-4 flex items-center space-x-4">
          <button onClick={() => window.history.back()} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Serviço Rápido</h1>
        </header>
        <main className="p-4 max-w-xl mx-auto">
          {message && (
            <p className="mb-4 text-center text-sm text-blue-600 dark:text-blue-400">{message}</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Mecânico</label>
              <select
                name="mecanicoId"
                value={form.mecanicoId}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 dark:border-gray-600"
                required
              >
                <option value="">Selecione</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Serviço</label>
              <input
                name="servico"
                value={form.servico}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  name="valor"
                  value={form.valor}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Quantidade</label>
                <input
                  type="number"
                  name="quantidade"
                  value={form.quantidade}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 dark:border-gray-600"
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Observações</label>
              <textarea
                name="observacoes"
                value={form.observacoes}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? "Salvando..." : editingId ? "Atualizar" : "Salvar"}</span>
              </button>
            </form>
            <div className="mt-8">
              <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Serviços Registrados</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="py-2 px-2 text-left">Data</th>
                      <th className="py-2 px-2 text-left">Mecânico</th>
                      <th className="py-2 px-2 text-left">Serviço</th>
                      <th className="py-2 px-2 text-center">Qtd</th>
                      <th className="py-2 px-2 text-right">Valor</th>
                      <th className="py-2 px-2 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="py-2 px-2">
                          {s.dataCriacao ? new Date(s.dataCriacao).toLocaleDateString("pt-BR") : ""}
                        </td>
                        <td className="py-2 px-2">{getMechanicName(s.mecanicoId)}</td>
                        <td className="py-2 px-2">{s.servico}</td>
                        <td className="py-2 px-2 text-center">{s.quantidade}</td>
                        <td className="py-2 px-2 text-right">
                          R$ {Number(s.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button onClick={() => handleEdit(s)} className="p-1 text-blue-600">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(s.id)} className="p-1 text-red-600">
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export default QuickService;
