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
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function BudgetPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [clientType, setClientType] = useState("pf");
  const [serviceType, setServiceType] = useState("manutencao");
  const initialClients = {
    pf: [
      {
        id: 1,
        tipo: "pf",
        nome: "João Silva",
        cpf: "123.456.789-00",
        telefone: "(85) 99999-9999",
        email: "joao@email.com",
        endereco: "Rua das Flores, 123, Centro, Fortaleza-CE",
      },
      {
        id: 2,
        tipo: "pf",
        nome: "Maria Santos",
        cpf: "987.654.321-00",
        telefone: "(85) 88888-8888",
        email: "maria@email.com",
        endereco: "Av. Principal, 456, Aldeota, Fortaleza-CE",
      },
    ],
    pj: [
      {
        id: 1,
        tipo: "pj",
        razaoSocial: "Empresa ABC Ltda",
        cnpj: "12.345.678/0001-90",
        telefone: "(85) 3333-4444",
        email: "contato@empresaabc.com",
        endereco: "Av. Empresarial, 789, Meireles, Fortaleza-CE",
        contato: "Carlos Gerente",
      },
      {
        id: 2,
        tipo: "pj",
        razaoSocial: "Hotel Beira Mar",
        cnpj: "98.765.432/0001-10",
        telefone: "(85) 3222-1111",
        email: "eventos@hotelbeirmar.com",
        endereco: "Av. Beira Mar, 1000, Meireles, Fortaleza-CE",
        contato: "Ana Coordenadora",
      },
    ],
  };
  const [clients, setClients] = useState(initialClients);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientModal, setShowClientModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState({
    tipo: "pf",
    nome: "",
    razaoSocial: "",
    cpf: "",
    cnpj: "",
    telefone: "",
    email: "",
    endereco: "",
    contato: "",
  });
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

  const handleCreateClient = () => {
    const created = { id: Date.now(), ...newClient, tipo: clientType };
    setClients((prev) => ({
      ...prev,
      [clientType]: [...prev[clientType], created],
    }));
    setSelectedClient(created);
    setShowAddClientModal(false);
    setNewClient({
      tipo: "pf",
      nome: "",
      razaoSocial: "",
      cpf: "",
      cnpj: "",
      telefone: "",
      email: "",
      endereco: "",
      contato: "",
    });
  };

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
    const logo = new Image();
    logo.src = "/assets/Logo.png";
    doc.addImage(logo, "PNG", 20, 10, 25, 12);

    doc.setFontSize(16);
    doc.text("SPORT & BIKE", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text("Rua Ana Bilhar, 1680 - Varjota, Fortaleza - CE", 105, 26, { align: "center" });
    doc.text("Tel: (85) 3267-7425 | WhatsApp: (85) 3267-7425", 105, 31, { align: "center" });
    doc.text("@sportbike_fortaleza | comercialsportbike@gmail.com", 105, 36, { align: "center" });

    doc.setFontSize(14);
    doc.text("ORÇAMENTO", 105, 46, { align: "center" });

    const budgetNumber = `ORC-${Date.now().toString().slice(-6)}`;
    const currentDate = new Date().toLocaleDateString("pt-BR");

    doc.setFontSize(10);
    doc.text(`Orçamento: ${budgetNumber}`, 20, 55);
    doc.text(`Data: ${currentDate}`, 150, 55);
    if (budgetData.validUntil) {
      doc.text(`Válido até: ${new Date(budgetData.validUntil).toLocaleDateString("pt-BR")}`, 20, 61);
    }
    doc.text(`Serviço: ${serviceType === "manutencao" ? "Manutenção" : "Eventos"}`, 20, 67);

    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE:", 20, 77);
    doc.setFont("helvetica", "normal");
    if (clientType === "pf") {
      doc.text(`Nome: ${selectedClient.nome}`, 20, 83);
      doc.text(`CPF: ${selectedClient.cpf}`, 20, 89);
      doc.text(`Telefone: ${selectedClient.telefone}`, 20, 95);
      if (selectedClient.email) doc.text(`Email: ${selectedClient.email}`, 20, 101);
      doc.text(`Endereço: ${selectedClient.endereco}`, 20, 107);
      var posY = 113;
    } else {
      doc.text(`Razão Social: ${selectedClient.razaoSocial}`, 20, 83);
      doc.text(`CNPJ: ${selectedClient.cnpj}`, 20, 89);
      if (selectedClient.contato) doc.text(`Contato: ${selectedClient.contato}`, 20, 95);
      doc.text(`Telefone: ${selectedClient.telefone}`, 20, 101);
      if (selectedClient.email) doc.text(`Email: ${selectedClient.email}`, 20, 107);
      doc.text(`Endereço: ${selectedClient.endereco}`, 20, 113);
      var posY = 119;
    }

    if (serviceType === "eventos") {
      doc.setFont("helvetica", "bold");
      doc.text("DETALHES DO EVENTO:", 20, posY);
      posY += 6;
      doc.setFont("helvetica", "normal");
      if (budgetData.eventDate) {
        doc.text(`Data: ${new Date(budgetData.eventDate).toLocaleDateString("pt-BR")}`, 20, posY);
        posY += 6;
      }
      if (budgetData.eventDuration) {
        doc.text(`Duração: ${budgetData.eventDuration} dia(s)`, 20, posY);
        posY += 6;
      }
      if (budgetData.participants) {
        doc.text(`Participantes: ${budgetData.participants}`, 20, posY);
        posY += 6;
      }
      if (budgetData.eventLocation) {
        doc.text(`Local: ${budgetData.eventLocation}`, 20, posY);
        posY += 6;
      }
      if (budgetData.eventType) {
        doc.text(`Tipo: ${budgetData.eventType}`, 20, posY);
        posY += 6;
      }
      if (budgetData.eventObservations) {
        doc.text(`Obs: ${budgetData.eventObservations}`, 20, posY);
        posY += 6;
      }
    }

    const tableData = budgetItems.map((item, index) => [
      (index + 1).toString(),
      item.description,
      item.quantity.toString(),
      item.unit,
      `R$ ${item.price.toFixed(2)}`,
      `R$ ${item.total.toFixed(2)}`,
    ]);

    doc.autoTable({
      startY: posY + 4,
      head: [["#", "DESCRIÇÃO", "QTD", "UNID", "VALOR UNIT.", "SUBTOTAL"]],
      body: tableData,
      theme: "striped",
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [200, 200, 200] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    let y = doc.lastAutoTable.finalY + 8;
    doc.text(`Subtotal: R$ ${calculateSubtotal().toFixed(2)}`, 140, y);
    y += 6;
    if (calculateDiscount() > 0) {
      doc.text(`Desconto: R$ ${calculateDiscount().toFixed(2)}`, 140, y);
      y += 6;
    }
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: R$ ${calculateTotal().toFixed(2)}`, 140, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    if (budgetData.paymentTerms) {
      doc.text(`Condições de Pagamento: ${budgetData.paymentTerms}`, 20, y);
      y += 6;
    }
    if (budgetData.deliveryTime) {
      doc.text(`Prazo de Entrega: ${budgetData.deliveryTime}`, 20, y);
      y += 6;
    }
    if (budgetData.observations) {
      const obs = doc.splitTextToSize(`Observações: ${budgetData.observations}`, 170);
      doc.text(obs, 20, y);
    }

    const fileName = clientType === "pf" ? selectedClient.nome : selectedClient.razaoSocial;
    doc.save(`Orcamento_${budgetNumber}_${fileName.replace(/\s+/g, "_")}.pdf`);
  };

  const filteredClients = clients[clientType].filter((client) => {
    const name = client.tipo === "pf" ? client.nome : client.razaoSocial;
    return (
      name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (client.tipo === "pf" ? client.cpf : client.cnpj).includes(clientSearch) ||
      client.telefone.includes(clientSearch)
    );
  });

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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <User className="w-6 h-6 mr-2 text-blue-500" /> Cliente {clientType === "pf" ? "(Pessoa Física)" : "(Pessoa Jurídica)"}
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClientModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 inline-flex items-center space-x-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Buscar Cliente</span>
                  </button>
                  <button
                    onClick={() => setShowAddClientModal(true)}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 inline-flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Cliente</span>
                  </button>
                </div>
              </div>
              {selectedClient ? (
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                        {clientType === "pf" ? selectedClient.nome : selectedClient.razaoSocial}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm text-gray-600 dark:text-gray-400">
                        {clientType === "pf" ? (
                          <p>{selectedClient.cpf}</p>
                        ) : (
                          <>
                            <p>{selectedClient.cnpj}</p>
                            {selectedClient.contato && <p>Contato: {selectedClient.contato}</p>}
                          </>
                        )}
                        <p>{selectedClient.telefone}</p>
                        {selectedClient.email && <p>{selectedClient.email}</p>}
                        <p className="md:col-span-2">{selectedClient.endereco}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedClient(null)} className="text-red-500 hover:text-red-600 p-2">
                      <Trash2 className="w-5 h-5" />
                    </button>
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
                  {filteredClients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedClient(c);
                        setClientType(c.tipo);
                        setShowClientModal(false);
                      }}
                      className="p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-600"
                    >
                      <h4 className="font-semibold text-gray-800 dark:text-white">
                        {c.tipo === "pf" ? c.nome : c.razaoSocial}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{c.telefone}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddClientModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md space-y-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Novo Cliente</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder={clientType === 'pf' ? 'Nome' : 'Razão Social'}
                  value={clientType === 'pf' ? newClient.nome : newClient.razaoSocial}
                  onChange={(e) =>
                    setNewClient(
                      clientType === 'pf'
                        ? { ...newClient, nome: e.target.value }
                        : { ...newClient, razaoSocial: e.target.value }
                    )
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                />
                {clientType === 'pf' ? (
                  <input
                    type="text"
                    placeholder="CPF"
                    value={newClient.cpf}
                    onChange={(e) => setNewClient({ ...newClient, cpf: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                  />
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="CNPJ"
                      value={newClient.cnpj}
                      onChange={(e) => setNewClient({ ...newClient, cnpj: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Nome do Contato"
                      value={newClient.contato}
                      onChange={(e) => setNewClient({ ...newClient, contato: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                    />
                  </>
                )}
                <input
                  type="tel"
                  placeholder="Telefone"
                  value={newClient.telefone}
                  onChange={(e) => setNewClient({ ...newClient, telefone: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                />
                <input
                  type="text"
                  placeholder="Endereço"
                  value={newClient.endereco}
                  onChange={(e) => setNewClient({ ...newClient, endereco: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateClient}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
