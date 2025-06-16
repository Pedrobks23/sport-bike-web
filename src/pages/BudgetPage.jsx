"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"

export default function BudgetPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [clientType, setClientType] = useState("pf")
  const [serviceType, setServiceType] = useState("manutencao")
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientSearch, setClientSearch] = useState("")
  const [showClientModal, setShowClientModal] = useState(false)
  const [budgetItems, setBudgetItems] = useState([
    { id: 1, type: "service", description: "", quantity: 1, unit: "un", price: 0, total: 0 },
  ])
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
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const mockClients = {
    pf: [
      {
        id: 1,
        name: "João Silva",
        cpf: "123.456.789-00",
        phone: "(85) 99999-9999",
        email: "joao@email.com",
        address: "Rua das Flores, 123, Centro, Fortaleza-CE",
      },
      {
        id: 2,
        name: "Maria Santos",
        cpf: "987.654.321-00",
        phone: "(85) 88888-8888",
        email: "maria@email.com",
        address: "Av. Principal, 456, Aldeota, Fortaleza-CE",
      },
    ],
    pj: [
      {
        id: 1,
        name: "Empresa ABC Ltda",
        cnpj: "12.345.678/0001-90",
        phone: "(85) 3333-4444",
        email: "contato@empresaabc.com",
        address: "Av. Empresarial, 789, Meireles, Fortaleza-CE",
        contact: "Carlos Gerente",
      },
      {
        id: 2,
        name: "Hotel Beira Mar",
        cnpj: "98.765.432/0001-10",
        phone: "(85) 3222-1111",
        email: "eventos@hotelbeirmar.com",
        address: "Av. Beira Mar, 1000, Meireles, Fortaleza-CE",
        contact: "Ana Coordenadora",
      },
    ],
  }

  const maintenanceServices = [
    { id: 1, name: "Regulagem Geral", price: 50.0, unit: "un" },
    { id: 2, name: "Câmara de ar 29", price: 35.0, unit: "un" },
    { id: 3, name: "Lavagem Completa", price: 30.0, unit: "un" },
    { id: 4, name: "Revisão de Suspensão", price: 150.0, unit: "un" },
    { id: 5, name: "Troca de Pneu", price: 80.0, unit: "un" },
    { id: 6, name: "Regulagem de Freios", price: 25.0, unit: "un" },
    { id: 7, name: "Lubrificação da Corrente", price: 15.0, unit: "un" },
    { id: 8, name: "Centramento de Roda", price: 40.0, unit: "un" },
  ]

  const eventServices = [
    { id: 1, name: "Aluguel Bike Urbana", price: 25.0, unit: "diária" },
    { id: 2, name: "Aluguel Bike Speed", price: 40.0, unit: "diária" },
    { id: 3, name: "Aluguel Bike MTB", price: 35.0, unit: "diária" },
    { id: 4, name: "Aluguel Bike Infantil", price: 20.0, unit: "diária" },
    { id: 5, name: "Carro de Apoio com Motorista", price: 300.0, unit: "diária" },
    { id: 6, name: "Carro de Apoio (só veículo)", price: 200.0, unit: "diária" },
    { id: 7, name: "Transporte de Bikes (ida e volta)", price: 150.0, unit: "evento" },
    { id: 8, name: "Kit Segurança (capacete + joelheira)", price: 10.0, unit: "diária" },
    { id: 9, name: "Suporte Técnico no Local", price: 200.0, unit: "diária" },
    { id: 10, name: "Coordenação de Evento", price: 400.0, unit: "evento" },
    { id: 11, name: "Seguro Adicional por Bike", price: 15.0, unit: "diária" },
    { id: 12, name: "Entrega e Retirada no Local", price: 100.0, unit: "evento" },
  ]

  const handleClientSelect = (client) => {
    setSelectedClient(client)
    setShowClientModal(false)
    setClientSearch("")
  }

  const addBudgetItem = () => {
    const newId = Math.max(...budgetItems.map((item) => item.id)) + 1
    setBudgetItems([
      ...budgetItems,
      { id: newId, type: "service", description: "", quantity: 1, unit: "un", price: 0, total: 0 },
    ])
  }

  const removeBudgetItem = (id) => {
    if (budgetItems.length > 1) {
      setBudgetItems(budgetItems.filter((item) => item.id !== id))
    }
  }

  const updateBudgetItem = (id, field, value) => {
    setBudgetItems(
      budgetItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          updatedItem.total = updatedItem.quantity * updatedItem.price
          return updatedItem
        }
        return item
      }),
    )
  }

  const selectService = (item, serviceId) => {
    const services = serviceType === "manutencao" ? maintenanceServices : eventServices
    const service = services.find((s) => s.id === serviceId)
    if (service) {
      updateBudgetItem(item.id, "description", service.name)
      updateBudgetItem(item.id, "price", service.price)
      updateBudgetItem(item.id, "unit", service.unit)
    }
  }

  const calculateSubtotal = () => {
    return budgetItems.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal()
    if (budgetData.discountType === "percentage") {
      return (subtotal * budgetData.discount) / 100
    }
    return budgetData.discount
  }

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount()
  }

  const handleSaveBudget = () => {
    if (!selectedClient) {
      alert("Selecione um cliente")
      return
    }
    if (budgetItems.some((item) => !item.description)) {
      alert("Preencha todos os itens do orçamento")
      return
    }

    const budget = {
      client: selectedClient,
      clientType,
      serviceType,
      items: budgetItems,
      data: budgetData,
      subtotal: calculateSubtotal(),
      discount: calculateDiscount(),
      total: calculateTotal(),
      createdAt: new Date().toISOString(),
    }

    console.log("Orçamento salvo:", budget)
    alert("Orçamento salvo com sucesso!")
  }

  const handleGeneratePDF = () => {
    if (!selectedClient) {
      alert("Selecione um cliente primeiro")
      return
    }

    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("ORÇAMENTO", 105, 20, { align: "center" })

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text("Sport & Bike", 20, 35)
    doc.text("Rua Ana Bilhar, 1680 - Varjota, Fortaleza - CE", 20, 42)
    doc.text("Tel: (85) 3267-7425 | WhatsApp: (85) 3267-7425", 20, 49)
    doc.text("@sportbike_fortaleza | comercialsportbike@gmail.com", 20, 56)

    const budgetNumber = `ORC-${Date.now().toString().slice(-6)}`
    const currentDate = new Date().toLocaleDateString("pt-BR")

    doc.text(`Orçamento: ${budgetNumber}`, 20, 70)
    doc.text(`Data: ${currentDate}`, 20, 77)
    if (budgetData.validUntil) {
      doc.text(`Válido até: ${new Date(budgetData.validUntil).toLocaleDateString("pt-BR")}`, 20, 84)
    }

    doc.setFont("helvetica", "bold")
    doc.text("CLIENTE:", 20, 98)
    doc.setFont("helvetica", "normal")
    doc.text(`${selectedClient.name}`, 20, 105)
    doc.text(
      `${clientType === "pf" ? "CPF" : "CNPJ"}: ${clientType === "pf" ? selectedClient.cpf : selectedClient.cnpj}`,
      20,
      112,
    )
    doc.text(`Tel: ${selectedClient.phone}`, 20, 119)
    if (selectedClient.email) {
      doc.text(`Email: ${selectedClient.email}`, 20, 126)
    }

    let yPosition = 140
    if (serviceType === "eventos") {
      doc.setFont("helvetica", "bold")
      doc.text("DETALHES DO EVENTO:", 20, yPosition)
      yPosition += 7
      doc.setFont("helvetica", "normal")

      if (budgetData.eventDate) {
        doc.text(`Data: ${new Date(budgetData.eventDate).toLocaleDateString("pt-BR")}`, 20, yPosition)
        yPosition += 7
      }
      if (budgetData.eventDuration) {
        doc.text(`Duração: ${budgetData.eventDuration} dia(s)`, 20, yPosition)
        yPosition += 7
      }
      if (budgetData.participants) {
        doc.text(`Participantes: ${budgetData.participants}`, 20, yPosition)
        yPosition += 7
      }
      if (budgetData.eventLocation) {
        doc.text(`Local: ${budgetData.eventLocation}`, 20, yPosition)
        yPosition += 7
      }
      if (budgetData.eventType) {
        doc.text(`Tipo: ${budgetData.eventType}`, 20, yPosition)
        yPosition += 7
      }
      yPosition += 5
    }

    const tableData = budgetItems.map((item, index) => [
      (index + 1).toString(),
      item.description,
      item.quantity.toString(),
      item.unit,
      `R$ ${item.price.toFixed(2)}`,
      `R$ ${item.total.toFixed(2)}`,
    ])

    doc.autoTable({
      startY: yPosition,
      head: [["#", "DESCRIÇÃO", "QTD", "UNID", "VALOR UNIT.", "SUBTOTAL"]],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [245, 158, 11],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        1: { cellWidth: 80 },
        2: { halign: "center", cellWidth: 20 },
        3: { halign: "center", cellWidth: 20 },
        4: { halign: "right", cellWidth: 30 },
        5: { halign: "right", cellWidth: 30 },
      },
    })

    const finalY = doc.lastAutoTable.finalY + 10

    doc.setFont("helvetica", "normal")
    doc.text(`Subtotal: R$ ${calculateSubtotal().toFixed(2)}`, 140, finalY)

    if (calculateDiscount() > 0) {
      doc.text(`Desconto: R$ ${calculateDiscount().toFixed(2)}`, 140, finalY + 7)
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text(`TOTAL: R$ ${calculateTotal().toFixed(2)}`, 140, finalY + (calculateDiscount() > 0 ? 14 : 7))

    let footerY = finalY + 25

    if (budgetData.paymentTerms) {
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("Condições de Pagamento:", 20, footerY)
      doc.setFont("helvetica", "normal")
      doc.text(budgetData.paymentTerms, 20, footerY + 7)
      footerY += 14
    }

    if (budgetData.deliveryTime) {
      doc.setFont("helvetica", "bold")
      doc.text("Prazo de Entrega:", 20, footerY)
      doc.setFont("helvetica", "normal")
      doc.text(budgetData.deliveryTime, 20, footerY + 7)
      footerY += 14
    }

    if (budgetData.observations) {
      doc.setFont("helvetica", "bold")
      doc.text("Observações:", 20, footerY)
      doc.setFont("helvetica", "normal")
      const splitObservations = doc.splitTextToSize(budgetData.observations, 170)
      doc.text(splitObservations, 20, footerY + 7)
    }

    doc.save(`Orcamento_${budgetNumber}_${selectedClient.name.replace(/\s+/g, "_")}.pdf`)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>\
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
                  <div className="bg-gradient-to-r from-green-400 to-green-600 p-2 rounded-full">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Novo Orçamento</h1>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleGeneratePDF}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all inline-flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleSaveBudget}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg transition-all inline-flex items-center space-x-2"
                >
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
                    <button
                      onClick={() => setClientType("pf")}
                      className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-all ${
                        clientType === "pf"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                          : "border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600"
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <span className="font-medium">Pessoa Física</span>
                    </button>
                    <button
                      onClick={() => setClientType("pj")}
                      className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-all ${
                        clientType === "pj"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                          : "border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600"
                      }`}
                    >
                      <Building className="w-5 h-5" />
                      <span className="font-medium">Pessoa Jurídica</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tipo de Serviço</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setServiceType("manutencao")}
                      className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-all ${
                        serviceType === "manutencao"
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                          : "border-gray-300 dark:border-gray-600 hover:border-amber-300 dark:hover:border-amber-600"
                      }`}
                    >
                      <Wrench className="w-5 h-5" />
                      <span className="font-medium">Manutenção</span>
                    </button>
                    <button
                      onClick={() => setServiceType("eventos")}
                      className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-all ${
                        serviceType === "eventos"
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                          : "border-gray-300 dark:border-gray-600 hover:border-amber-300 dark:hover:border-amber-600"
                      }`}
                    >
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">Eventos</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {serviceType === "eventos" && (
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-purple-500" />
                  Detalhes do Evento
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data do Evento</label>
                    <input
                      type="date"
                      value={budgetData.eventDate}
                      onChange={(e) => setBudgetData({ ...budgetData, eventDate: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duração (dias)</label>
                    <input
                      type="number"
                      min="1"
                      value={budgetData.eventDuration}
                      onChange={(e) => setBudgetData({ ...budgetData, eventDuration: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Número de Participantes</label>
                    <input
                      type="number"
                      min="1"
                      value={budgetData.participants}
                      onChange={(e) => setBudgetData({ ...budgetData, participants: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Ex: 20"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Local do Evento</label>
                    <input
                      type="text"
                      value={budgetData.eventLocation}
                      onChange={(e) => setBudgetData({ ...budgetData, eventLocation: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Endereço completo do evento"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Evento</label>
                    <select
                      value={budgetData.eventType}
                      onChange={(e) => setBudgetData({ ...budgetData, eventType: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="">Selecionar...</option>
                      <option value="passeio">Passeio Ciclístico</option>
                      <option value="corporativo">Evento Corporativo</option>
                      <option value="turismo">Turismo Ecológico</option>
                      <option value="competicao">Competição</option>
                      <option value="lazer">Lazer/Recreação</option>
                      <option value="educativo">Evento Educativo</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observações do Evento</label>
                  <textarea
                    value={budgetData.eventObservations}
                    onChange={(e) => setBudgetData({ ...budgetData, eventObservations: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    rows={3}
                    placeholder="Detalhes específicos do evento, necessidades especiais, horários, etc."
                  />
                </div>
              </div>
            )}

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  {clientType === "pf" ? (
                    <User className="w-6 h-6 mr-2 text-blue-500" />
                  ) : (
                    <Building className="w-6 h-6 mr-2 text-blue-500" />
                  )}
                  Cliente {clientType === "pf" ? "(Pessoa Física)" : "(Pessoa Jurídica)"}
                </h2>
                <button
                  onClick={() => setShowClientModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all inline-flex items-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Buscar Cliente</span>
                </button>
              </div>

              {selectedClient ? (
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-white text-lg">{selectedClient.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          {clientType === "pf" ? (
                            <User className="w-4 h-4 mr-2" />
                          ) : (
                            <Building className="w-4 h-4 mr-2" />
                          )}
                          {clientType === "pf" ? selectedClient.cpf : selectedClient.cnpj}
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4 mr-2" />
                          {selectedClient.phone}
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4 mr-2" />
                          {selectedClient.email}
                        </div>
                        {clientType === "pj" && selectedClient.contact && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Users className="w-4 h-4 mr-2" />
                            {selectedClient.contact}
                          </div>
                        )}
                        <div className="flex items-center text-gray-600 dark:text-gray-400 md:col-span-2">
                          <MapPin className="w-4 h-4 mr-2" />
                          {selectedClient.address}
                        </div>
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
                  <p className="text-sm">Clique em "Buscar Cliente" para selecionar</p>
                </div>
              )}
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  {serviceType === "manutencao" ? (
                    <Wrench className="w-6 h-6 mr-2 text-amber-500" />
                  ) : (
                    <Calendar className="w-6 h-6 mr-2 text-amber-500" />
                  )}
                  Itens do Orçamento
                </h2>
                <button
                  onClick={addBudgetItem}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Item</span>
                </button>
              </div>

              <div className="space-y-4">
                {budgetItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-12 md:col-span-5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateBudgetItem(item.id, "description", e.target.value)}
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="Descrição do serviço/produto"
                          />
                          <select
                            onChange={(e) => selectService(item, Number(e.target.value))}
                            className="px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          >
                            <option value="">Selecionar...</option>
                            {(serviceType === "manutencao" ? maintenanceServices : eventServices).map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name} - R$ {service.price.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="col-span-6 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Qtd.</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateBudgetItem(item.id, "quantity", Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>

                      <div className="col-span-6 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unid.</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateBudgetItem(item.id, "unit", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          placeholder="un"
                        />
                      </div>

                      <div className="col-span-6 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preço Unit.</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => updateBudgetItem(item.id, "price", Number(e.target.value))}
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="0,00"
                          />
                          <button
                            onClick={() => {
                              const newPrice = prompt("Digite o novo preço:", item.price.toString())
                              if (newPrice && !isNaN(Number(newPrice))) {
                                updateBudgetItem(item.id, "price", Number(newPrice))
                              }
                            }}
                            className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Editar preço"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="col-span-5 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total</label>
                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-800 dark:text-white font-semibold">
                          R$ {item.total.toFixed(2)}
                        </div>
                      </div>

                      <div className="col-span-1">
                        {budgetItems.length > 1 && (
                          <button
                            onClick={() => removeBudgetItem(item.id)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Válido até</label>
                    <input
                      type="date"
                      value={budgetData.validUntil}
                      onChange={(e) => setBudgetData({ ...budgetData, validUntil: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prazo de entrega</label>
                    <input
                      type="text"
                      value={budgetData.deliveryTime}
                      onChange={(e) => setBudgetData({ ...budgetData, deliveryTime: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Ex: 3 dias úteis"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Condições de pagamento</label>
                    <select
                      value={budgetData.paymentTerms}
                      onChange={(e) => setBudgetData({ ...budgetData, paymentTerms: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="">Selecionar...</option>
                      <option value="À vista">À vista</option>
                      <option value="30 dias">30 dias</option>
                      <option value="2x sem juros">2x sem juros</option>
                      <option value="3x sem juros">3x sem juros</option>
                      <option value="6x sem juros">6x sem juros</option>
                      <option value="12x sem juros">12x sem juros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observações</label>
                    <textarea
                      value={budgetData.observations}
                      onChange={(e) => setBudgetData({ ...budgetData, observations: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={3}
                      placeholder="Observações adicionais..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                  <DollarSign className="w-6 h-6 mr-2 text-green-500" />
                  Resumo do Orçamento
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
                    <span className="font-semibold text-gray-800 dark:text-white">R$ {calculateSubtotal().toFixed(2)}</span>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <div className="flex items-center space-x-4 mb-2">
                      <label className="text-gray-700 dark:text-gray-300">Desconto:</label>
                      <select
                        value={budgetData.discountType}
                        onChange={(e) => setBudgetData({ ...budgetData, discountType: e.target.value })}
                        className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">R$</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={budgetData.discount}
                        onChange={(e) => setBudgetData({ ...budgetData, discount: Number(e.target.value) })}
                        className="flex-1 px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">Valor do desconto:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">- R$ {calculateDiscount().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span className="text-gray-800 dark:text-white">Total:</span>
                      <span className="text-green-600 dark:text-green-400">R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {budgetData.paymentTerms && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-400">
                        <strong>Pagamento:</strong> {budgetData.paymentTerms}
                      </p>
                    </div>
                  )}

                  {budgetData.deliveryTime && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                      <p className="text-sm text-amber-800 dark:text-amber-400">
                        <strong>Prazo:</strong> {budgetData.deliveryTime}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {showClientModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Selecionar Cliente {clientType === "pf" ? "(Pessoa Física)" : "(Pessoa Jurídica)"}
                  </h3>
                  <button
                    onClick={() => setShowClientModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-10 w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {mockClients[clientType]
                    .filter(
                      (client) =>
                        client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                        (clientType === "pf" ? client.cpf : client.cnpj).includes(clientSearch) ||
                        client.phone.includes(clientSearch),
                    )
                    .map((client) => (
                      <div
                        key={client.id}
                        onClick={() => handleClientSelect(client)}
                        className="p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                      >
                        <h4 className="font-semibold text-gray-800 dark:text-white">{client.name}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <p>{clientType === "pf" ? client.cpf : client.cnpj}</p>
                          <p>{client.phone}</p>
                          <p className="md:col-span-2">{client.email}</p>
                          {clientType === "pj" && client.contact && <p className="md:col-span-2">Contato: {client.contact}</p>}
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
  )
}
