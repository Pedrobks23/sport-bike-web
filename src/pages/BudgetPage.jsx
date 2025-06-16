"use client";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calculator,
  User,
  Building,
  Wrench,
  Calendar,
  Plus,
  Trash2,
  Save,
  FileText,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Users,
  Edit,
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function BudgetPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [clientType, setClientType] = useState("pf");
  const [serviceType, setServiceType] = useState("manutencao");
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientModal, setShowClientModal] = useState(false);
  const [budgetItems, setBudgetItems] = useState([
    { id: 1, description: "", quantity: 1, unit: "un", price: 0, total: 0 },
  ]);
  const [budgetData, setBudgetData] = useState({
    validUntil: "",
    observations: "",
    discount: 0,
    discountType: "percentage",
    paymentTerms: "",
    deliveryTime: "",
    eventDate: "",
    eventDuration: 1,
    participants: "",
    eventLocation: "",
    eventType: "",
    eventObservations: "",
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    async function loadClients() {
      const snap = await getDocs(collection(db, "clientes"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClients(list);
    }
    loadClients();
  }, []);

  const maintenanceServices = [
    { id: 1, name: "Regulagem Geral", price: 50, unit: "un" },
    { id: 2, name: "Câmara de ar 29", price: 35, unit: "un" },
    { id: 3, name: "Lavagem Completa", price: 30, unit: "un" },
    { id: 4, name: "Revisão de Suspensão", price: 150, unit: "un" },
    { id: 5, name: "Troca de Pneu", price: 80, unit: "un" },
    { id: 6, name: "Regulagem de Freios", price: 25, unit: "un" },
    { id: 7, name: "Lubrificação da Corrente", price: 15, unit: "un" },
    { id: 8, name: "Centramento de Roda", price: 40, unit: "un" },
  ];

  const eventServices = [
    { id: 1, name: "Aluguel Bike Urbana", price: 25, unit: "diária" },
    { id: 2, name: "Aluguel Bike Speed", price: 40, unit: "diária" },
    { id: 3, name: "Aluguel Bike MTB", price: 35, unit: "diária" },
    { id: 4, name: "Aluguel Bike Infantil", price: 20, unit: "diária" },
    { id: 5, name: "Carro de Apoio com Motorista", price: 300, unit: "diária" },
    { id: 6, name: "Carro de Apoio (só veículo)", price: 200, unit: "diária" },
    { id: 7, name: "Transporte de Bikes (ida e volta)", price: 150, unit: "evento" },
    { id: 8, name: "Kit Segurança (capacete + joelheira)", price: 10, unit: "diária" },
    { id: 9, name: "Suporte Técnico no Local", price: 200, unit: "diária" },
    { id: 10, name: "Coordenação de Evento", price: 400, unit: "evento" },
    { id: 11, name: "Seguro Adicional por Bike", price: 15, unit: "diária" },
    { id: 12, name: "Entrega e Retirada no Local", price: 100, unit: "evento" },
  ];

  const addBudgetItem = () => {
    const newId = Math.max(...budgetItems.map((i) => i.id)) + 1;
    setBudgetItems([...budgetItems, { id: newId, description: "", quantity: 1, unit: "un", price: 0, total: 0 }]);
  };

  const removeBudgetItem = (id) => {
    if (budgetItems.length > 1) setBudgetItems(budgetItems.filter((i) => i.id !== id));
  };

  const updateBudgetItem = (id, field, value) => {
    setBudgetItems(
      budgetItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          updated.total = updated.quantity * updated.price;
          return updated;
        }
        return item;
      })
    );
  };

  const selectService = (item, serviceId) => {
    const service = (serviceType === "manutencao" ? maintenanceServices : eventServices).find((s) => s.id === serviceId);
    if (service) {
      updateBudgetItem(item.id, "description", service.name);
      updateBudgetItem(item.id, "price", service.price);
      updateBudgetItem(item.id, "unit", service.unit);
    }
  };

  const calculateSubtotal = () => budgetItems.reduce((s, i) => s + i.total, 0);
  const calculateDiscount = () => (budgetData.discountType === "percentage" ? (calculateSubtotal() * budgetData.discount) / 100 : budgetData.discount);
  const calculateTotal = () => calculateSubtotal() - calculateDiscount();

  const handleSaveBudget = () => {
    if (!selectedClient) return alert("Selecione um cliente");
    if (budgetItems.some((i) => !i.description)) return alert("Preencha todos os itens");
    const data = {
      cliente: selectedClient,
      itens: budgetItems,
      subtotal: calculateSubtotal(),
      desconto: calculateDiscount(),
      total: calculateTotal(),
    };
    console.log("Orçamento:", data);
    alert("Orçamento salvo!");
  };

  const handleGeneratePDF = () => {
    if (!selectedClient) return alert("Selecione um cliente primeiro");
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("ORÇAMENTO", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Cliente: ${selectedClient.nome}`, 20, 40);
    let y = 55;
    const tableData = budgetItems.map((i, idx) => [
      idx + 1,
      i.description,
      i.quantity,
      i.unit,
      `R$ ${i.price.toFixed(2)}`,
      `R$ ${i.total.toFixed(2)}`,
    ]);
    doc.autoTable({ startY: y, head: [["#", "Descrição", "Qtd", "Unid", "Valor", "Subtotal"]], body: tableData });
    const fY = doc.lastAutoTable.finalY + 10;
    doc.text(`TOTAL: R$ ${calculateTotal().toFixed(2)}`, 140, fY);
    doc.save(`orcamento_${selectedClient.nome.replace(/\s+/g, "_")}.pdf`);
  };

  const filteredClients = clients.filter(
    (c) => c.nome.toLowerCase().includes(clientSearch.toLowerCase()) || c.telefone.includes(clientSearch)
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}> 
      <div className="bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={() => window.history.back()} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 p-2 rounded-full">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Novo Orçamento</h1>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={handleGeneratePDF} className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 inline-flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button onClick={handleSaveBudget} className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 inline-flex items-center space-x-2">
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
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Tipo de Orçamento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tipo de Cliente</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setClientType('pf')} className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-all ${clientType==='pf'?'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400':'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'}`}>
                      <User className="w-5 h-5" />
                      <span className="font-medium">Pessoa Física</span>
                    </button>
                    <button onClick={() => setClientType('pj')} className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-all ${clientType==='pj'?'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400':'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'}`}>
                      <Building className="w-5 h-5" />
                      <span className="font-medium">Pessoa Jurídica</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tipo de Serviço</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setServiceType('manutencao')} className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-all ${serviceType==='manutencao'?'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400':'border-gray-300 dark:border-gray-600 hover:border-amber-300 dark:hover:border-amber-600'}`}>
                      <Wrench className="w-5 h-5" />
                      <span className="font-medium">Manutenção</span>
                    </button>
                    <button onClick={() => setServiceType('eventos')} className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-all ${serviceType==='eventos'?'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400':'border-gray-300 dark:border-gray-600 hover:border-amber-300 dark:hover:border-amber-600'}`}>
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">Eventos</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {serviceType === 'eventos' && (
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-purple-500" />
                  Detalhes do Evento
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data do Evento</label>
                    <input type="date" value={budgetData.eventDate} onChange={(e)=>setBudgetData({...budgetData,eventDate:e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duração (dias)</label>
                    <input type="number" min="1" value={budgetData.eventDuration} onChange={(e)=>setBudgetData({...budgetData,eventDuration:Number(e.target.value)})} className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Participantes</label>
                    <input type="number" min="1" value={budgetData.participants} onChange={(e)=>setBudgetData({...budgetData,participants:e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Local do Evento</label>
                    <input type="text" value={budgetData.eventLocation} onChange={(e)=>setBudgetData({...budgetData,eventLocation:e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <User className="w-6 h-6 mr-2 text-blue-500" /> Cliente
                </h2>
                <button onClick={()=>setShowClientModal(true)} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 inline-flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Buscar Cliente</span>
                </button>
              </div>
              {selectedClient ? (
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white text-lg">{selectedClient.nome}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <p>{selectedClient.telefone}</p>
                        {selectedClient.email && <p>{selectedClient.email}</p>}
                        {selectedClient.endereco && <p className="md:col-span-2">{selectedClient.endereco}</p>}
                      </div>
                    </div>
                    <button onClick={()=>setSelectedClient(null)} className="text-red-500 hover:text-red-600 p-2"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhum cliente selecionado</p>
                </div>
              )}
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  {serviceType==='manutencao'?<Wrench className="w-6 h-6 mr-2 text-amber-500" />:<Calendar className="w-6 h-6 mr-2 text-amber-500" />} Itens
                </h2>
                <button onClick={addBudgetItem} className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 inline-flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </div>
              <div className="space-y-4">
                {budgetItems.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-12 md:col-span-5">
                        <input type="text" value={item.description} onChange={(e)=>updateBudgetItem(item.id,'description',e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg" />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <input type="number" min="1" value={item.quantity} onChange={(e)=>updateBudgetItem(item.id,'quantity',Number(e.target.value))} className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg" />
                      </div>
                      <div className="col-span-6 md:col-span-1">
                        <input type="text" value={item.unit} onChange={(e)=>updateBudgetItem(item.id,'unit',e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg" />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <input type="number" step="0.01" min="0" value={item.price} onChange={(e)=>updateBudgetItem(item.id,'price',Number(e.target.value))} className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg" />
                      </div>
                      <div className="col-span-5 md:col-span-1 text-gray-800 dark:text-white">R$ {item.total.toFixed(2)}</div>
                      <div className="col-span-1">
                        {budgetItems.length>1 && (
                          <button onClick={()=>removeBudgetItem(item.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Informações Adicionais</h3>
                <input type="date" value={budgetData.validUntil} onChange={(e)=>setBudgetData({...budgetData,validUntil:e.target.value})} className="w-full px-4 py-2 mb-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" />
                <textarea value={budgetData.observations} onChange={(e)=>setBudgetData({...budgetData,observations:e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" rows={3} placeholder="Observações" />
              </div>
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center"><DollarSign className="w-6 h-6 mr-2 text-green-500" />Resumo</h3>
                <p className="mb-2">Subtotal: R$ {calculateSubtotal().toFixed(2)}</p>
                <p className="mb-2">Desconto: R$ {calculateDiscount().toFixed(2)}</p>
                <p className="font-bold">Total: R$ {calculateTotal().toFixed(2)}</p>
              </div>
            </div>
          </div>
        </main>

        {showClientModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Selecionar Cliente</h3>
                <button onClick={()=>setShowClientModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><Trash2 className="w-6 h-6" /></button>
              </div>
              <div className="p-6">
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" placeholder="Buscar por nome ou telefone..." value={clientSearch} onChange={(e)=>setClientSearch(e.target.value)} className="pl-10 w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" />
                </div>
                <div className="space-y-3">
                  {filteredClients.map(c => (
                    <div key={c.id} onClick={()=>{setSelectedClient(c);setShowClientModal(false);}} className="p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-600">
                      <h4 className="font-semibold text-gray-800 dark:text-white">{c.nome}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{c.telefone}</p>
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
