import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Save,
  FileText,
  Phone,
  Mail,
  MapPin,
  Bike,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

const bikeOptions = [
  { id: 1, name: "Bike Urbana", price: 25 },
  { id: 2, name: "Bike Speed", price: 40 },
  { id: 3, name: "Bike MTB", price: 35 },
  { id: 4, name: "Bike Infantil", price: 20 },
];

function NewRental() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const [items, setItems] = useState([
    { id: 1, description: "", quantity: 1, days: 1, price: 0, total: 0 },
  ]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const loadClients = async () => {
      const snap = await getDocs(collection(db, "clientes"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClients(list);
    };
    loadClients();
  }, []);

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setShowClientModal(false);
    setClientSearch("");
  };

  const addItem = () => {
    const newId = Math.max(...items.map((i) => i.id)) + 1;
    setItems([
      ...items,
      { id: newId, description: "", quantity: 1, days: 1, price: 0, total: 0 },
    ]);
  };

  const removeItem = (id) => {
    if (items.length > 1) setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          updated.total = updated.quantity * updated.days * updated.price;
          return updated;
        }
        return item;
      })
    );
  };

  const selectBike = (item, bikeId) => {
    const bike = bikeOptions.find((b) => b.id === bikeId);
    if (bike) {
      updateItem(item.id, "description", bike.name);
      updateItem(item.id, "price", bike.price);
    }
  };

  const calculateSubtotal = () => items.reduce((s, i) => s + i.total, 0);

  const handleSave = async () => {
    if (!selectedClient) {
      alert("Selecione um cliente");
      return;
    }
    if (items.some((i) => !i.description)) {
      alert("Preencha todos os itens");
      return;
    }
    const rental = {
      cliente: selectedClient,
      itens: items,
      subtotal: calculateSubtotal(),
      dataCriacao: new Date().toISOString(),
    };
    try {
      await addDoc(collection(db, "alugueis"), rental);
      alert("Aluguel salvo com sucesso!");
      navigate("/admin");
    } catch (err) {
      console.error("Erro ao salvar aluguel:", err);
      alert("Erro ao salvar aluguel");
    }
  };

  const handleGeneratePDF = () => {
    if (!selectedClient) {
      alert("Selecione um cliente primeiro");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Comprovante de Aluguel", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Cliente: ${selectedClient.nome}`, 20, 40);
    doc.text(`Telefone: ${selectedClient.telefone}`, 20, 48);
    let y = 60;
    const tableData = items.map((item, index) => [
      (index + 1).toString(),
      item.description,
      item.quantity.toString(),
      item.days.toString(),
      `R$ ${item.price.toFixed(2)}`,
      `R$ ${item.total.toFixed(2)}`,
    ]);
    doc.autoTable({
      startY: y,
      head: [["#", "Bicicleta", "Qtd", "Dias", "Valor", "Subtotal"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
    });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(`TOTAL: R$ ${calculateSubtotal().toFixed(2)}`, 140, finalY);
    doc.save(`Aluguel_${selectedClient.nome.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={() => navigate('/admin')} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Novo Aluguel</h1>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={handleGeneratePDF} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all inline-flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button onClick={handleSave} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg transition-all inline-flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Salvar</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <Bike className="w-6 h-6 mr-2 text-green-500" /> Cliente
                </h2>
                <button onClick={() => setShowClientModal(true)} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all inline-flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Buscar Cliente</span>
                </button>
              </div>
              {selectedClient ? (
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white text-lg">{selectedClient.nome}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4 mr-2" />
                          {selectedClient.telefone}
                        </div>
                        {selectedClient.email && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4 mr-2" />
                            {selectedClient.email}
                          </div>
                        )}
                        {selectedClient.endereco && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400 md:col-span-2">
                            <MapPin className="w-4 h-4 mr-2" />
                            {selectedClient.endereco}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setSelectedClient(null)} className="text-red-500 hover:text-red-600 p-2">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Bike className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum cliente selecionado</p>
                  <p className="text-sm">Clique em "Buscar Cliente" para selecionar</p>
                </div>
              )}
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <Bike className="w-6 h-6 mr-2 text-green-500" /> Itens
                </h2>
                <button onClick={addItem} className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all inline-flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </div>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bicicleta</label>
                        <select value={bikeOptions.find((b) => b.name === item.description)?.id || ""} onChange={(e) => selectBike(item, Number(e.target.value))} className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                          <option value="">Selecionar...</option>
                          {bikeOptions.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} - R$ {b.price.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Qtd.</label>
                        <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dias</label>
                        <input type="number" min="1" value={item.days} onChange={(e) => updateItem(item.id, 'days', Number(e.target.value))} className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preço/Dia</label>
                        <input type="number" step="0.01" min="0" value={item.price} onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))} className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total</label>
                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-800 dark:text-white font-semibold">
                          R$ {item.total.toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        {items.length > 1 && (
                          <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Resumo</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">R$ {calculateSubtotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {showClientModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Selecionar Cliente</h3>
                <button onClick={() => setShowClientModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" placeholder="Buscar por nome ou telefone..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="pl-10 w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
                <div className="space-y-3">
                  {clients
                    .filter(
                      (c) =>
                        c.nome?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                        c.telefone?.includes(clientSearch)
                    )
                    .map((client) => (
                      <div key={client.id} onClick={() => handleSelectClient(client)} className="p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer border border-gray-200 dark:border-gray-600">
                        <h4 className="font-semibold text-gray-800 dark:text-white">{client.nome}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <p>{client.telefone}</p>
                          {client.email && <p>{client.email}</p>}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewRental;
