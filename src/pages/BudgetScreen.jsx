'use client'

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy, onSnapshot, limit } from "firebase/firestore"
import { db } from "../config/firebase"
import {
  FileText,
  Plus,
  Search,
  Filter,
  Check,
  XCircle,
  ArrowLeft,
  Download,
  Calendar,
  User,
  Phone,
  Bike,
  DollarSign,
} from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

// Componente principal do sistema de orçamentos
const BudgetScreen = ({ initialView = "list" }) => {
  const [view, setView] = useState({ mode: initialView, id: null })
  const [orcamentos, setOrcamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("Todos")

  // Carrega orçamentos do Firestore em tempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "orcamentos"), orderBy("dataCriacao", "desc")),
      (snapshot) => {
        const orcamentosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setOrcamentos(orcamentosData)
        setLoading(false)
      },
      (error) => {
        console.error("Erro ao carregar orçamentos:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  // Filtros aplicados aos orçamentos
  const filteredOrcamentos = useMemo(() => {
    return orcamentos.filter((orc) => {
      const matchesSearch =
        searchTerm === "" ||
        orc.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orc.cliente?.telefone?.includes(searchTerm) ||
        orc.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "Todos" || orc.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [orcamentos, searchTerm, statusFilter])

  // Renderização condicional baseada no modo atual
  const navigate = useNavigate()

  const renderContent = () => {
    switch (view.mode) {
      case "create":
        return <BudgetForm onBack={() => setView({ mode: "list" })} />
      case "details":
        return (
          <BudgetDetails
            budgetId={view.id}
            onBack={() => setView({ mode: "list" })}
            onUpdate={() => {
              // Força recarregamento dos dados
              setView({ mode: "list" })
            }}
          />
        )
      default:
        return (
          <BudgetList
            orcamentos={filteredOrcamentos}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onCreateNew={() => setView({ mode: "create" })}
            onViewDetails={(id) => setView({ mode: "details", id })}
            onBackToAdmin={() => navigate("/admin")}
          />
        )
    }
  }

  return <div className="min-h-screen bg-gray-50">{renderContent()}</div>
}

// Componente de listagem de orçamentos
const BudgetList = ({
  orcamentos,
  loading,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onCreateNew,
  onViewDetails,
  onBackToAdmin,
}) => {
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setSearchTerm(debouncedSearch)
  }, [debouncedSearch, setSearchTerm])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header com título e botão de novo orçamento */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToAdmin}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Orçamentos</h1>
            <p className="text-gray-600">Gerencie todos os orçamentos do sistema</p>
          </div>
        </div>
        <button
          onClick={onCreateNew}
          className="mt-4 sm:mt-0 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Novo Orçamento
        </button>
      </div>

      {/* Filtros e busca */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Campo de busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por código, telefone ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de status */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Aberto">Abertos</option>
              <option value="Aprovado">Aprovados</option>
              <option value="Rejeitado">Rejeitados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de orçamentos */}
      {orcamentos.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento encontrado</h3>
          <p className="text-gray-500 mb-4">Comece criando seu primeiro orçamento</p>
          <button
            onClick={onCreateNew}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Criar Orçamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orcamentos.map((orcamento) => (
            <BudgetCard key={orcamento.id} orcamento={orcamento} onViewDetails={onViewDetails} />
          ))}
        </div>
      )}
    </div>
  )
}

// Card individual de orçamento
const BudgetCard = ({ orcamento, onViewDetails }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Aberto":
        return "bg-blue-100 text-blue-800"
      case "Aprovado":
        return "bg-green-100 text-green-800"
      case "Rejeitado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "Data não disponível"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("pt-BR")
  }

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onViewDetails(orcamento.id)}
    >
      {/* Header do card */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{orcamento.codigo}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <Calendar size={14} />
            {formatDate(orcamento.dataCriacao)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(orcamento.status)}`}>
          {orcamento.status}
        </span>
      </div>

      {/* Informações do cliente */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <User size={16} className="text-gray-400" />
          <span className="font-medium text-gray-900">{orcamento.cliente?.nome}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-gray-400" />
          <span className="text-gray-600">{orcamento.cliente?.telefone}</span>
        </div>
      </div>

      {/* Informações das bicicletas */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Bike size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600">{orcamento.bicicletas?.length || 0} bicicleta(s)</span>
        </div>
      </div>

      {/* Valor total */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Valor Total:</span>
          <span className="font-bold text-lg text-gray-900 flex items-center gap-1">
            <DollarSign size={16} />
            {formatCurrency(orcamento.valorTotal)}
          </span>
        </div>
      </div>
    </div>
  )
}

// Formulário de criação de orçamento
const BudgetForm = ({ onBack }) => {
  const [formData, setFormData] = useState({
    cliente: null,
    bicicletas: [],
    servicos: [],
    observacoes: "",
    pessoaJuridica: false,
    evento: false,
  })
  const [clientes, setClientes] = useState([])
  const [servicosDisponiveis, setServicosDisponiveis] = useState([])
  const [clienteSearch, setClienteSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [showAddBike, setShowAddBike] = useState(false)
  const [newBike, setNewBike] = useState({ marca: "", modelo: "", cor: "" })
  const [showManualService, setShowManualService] = useState(false)
  const [manualService, setManualService] = useState({ nome: "", preco: "0" })

  // Carrega serviços disponíveis
  useEffect(() => {
    const loadServicos = async () => {
      try {
        const servicosSnapshot = await getDocs(collection(db, "servicos"))
        const servicosData = []
        servicosSnapshot.forEach((docSnap) => {
          const data = docSnap.data()
          Object.entries(data).forEach(([nome, preco]) => {
            const valorNum = parseFloat(String(preco).replace(/['"]/g, ""))
            servicosData.push({ id: `${docSnap.id}_${nome}`, nome, preco: valorNum })
          })
        })
        servicosData.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
        setServicosDisponiveis(servicosData)
      } catch (error) {
        console.error("Erro ao carregar serviços:", error)
      }
    }

    loadServicos()
  }, [])

  // Busca clientes por telefone
  useEffect(() => {
    const searchClientes = async () => {
      if (clienteSearch.length < 3) {
        setClientes([])
        return
      }

      try {
        const clientesSnapshot = await getDocs(collection(db, "clientes"))
        const clientesData = clientesSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (cliente) =>
              cliente.telefone?.includes(clienteSearch) ||
              cliente.nome?.toLowerCase().includes(clienteSearch.toLowerCase()),
          )
        setClientes(clientesData)
      } catch (error) {
        console.error("Erro ao buscar clientes:", error)
      }
    }

    const timer = setTimeout(searchClientes, 300)
    return () => clearTimeout(timer)
  }, [clienteSearch])

  // Carrega bicicletas do cliente selecionado
  useEffect(() => {
    const loadBicicletas = async () => {
      if (!formData.cliente) return

      try {
        // Bicicletas ficam armazenadas como subcoleção de cada cliente
        const bikesRef = collection(db, `clientes/${formData.cliente.id}/bikes`)
        const bicicletasSnapshot = await getDocs(bikesRef)
        const bicicletasData = bicicletasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          selected: false,
        }))
        setFormData((prev) => ({ ...prev, bicicletas: bicicletasData }))
      } catch (error) {
        console.error("Erro ao carregar bicicletas:", error)
      }
    }

    loadBicicletas()
  }, [formData.cliente])

  // Calcula valor total em tempo real
  const valorTotal = useMemo(() => {
    return formData.servicos.reduce((total, servico) => {
      return total + servico.preco * servico.quantidade
    }, 0)
  }, [formData.servicos])

  // Seleciona cliente
  const handleSelectCliente = (cliente) => {
    setFormData((prev) => ({ ...prev, cliente }))
    setClienteSearch(cliente.nome)
    setShowClienteDropdown(false)
  }

  // Toggle seleção de bicicleta
  const handleToggleBicicleta = (bicicletaId) => {
    setFormData((prev) => ({
      ...prev,
      bicicletas: prev.bicicletas.map((bike) =>
        bike.id === bicicletaId ? { ...bike, selected: !bike.selected } : bike,
      ),
    }))
  }

  // Adiciona bicicleta manualmente
  const handleAddBikeManual = () => {
    if (!newBike.marca.trim() && !newBike.modelo.trim()) return
    const bike = {
      id: `manual-${Date.now()}`,
      marca: newBike.marca,
      modelo: newBike.modelo,
      cor: newBike.cor,
      selected: true,
      manual: true,
    }
    setFormData((prev) => ({ ...prev, bicicletas: [...prev.bicicletas, bike] }))
    setNewBike({ marca: "", modelo: "", cor: "" })
    setShowAddBike(false)
  }

  // Adiciona serviço
  const handleAddServico = (servico) => {
    const servicoExistente = formData.servicos.find((s) => s.id === servico.id)

    if (servicoExistente) {
      setFormData((prev) => ({
        ...prev,
        servicos: prev.servicos.map((s) => (s.id === servico.id ? { ...s, quantidade: s.quantidade + 1 } : s)),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        servicos: [...prev.servicos, { ...servico, quantidade: 1 }],
      }))
    }
  }

  const handleAddServicoManual = () => {
    if (!manualService.nome.trim()) return
    const servico = {
      id: `manual-${Date.now()}`,
      nome: manualService.nome,
      preco: parseFloat(manualService.preco) || 0,
      quantidade: 1,
    }
    setFormData((prev) => ({ ...prev, servicos: [...prev.servicos, servico] }))
    setManualService({ nome: "", preco: "0" })
    setShowManualService(false)
  }

  // Remove serviço
  const handleRemoveServico = (servicoId) => {
    setFormData((prev) => ({
      ...prev,
      servicos: prev.servicos.filter((s) => s.id !== servicoId),
    }))
  }

  // Atualiza quantidade do serviço
  const handleUpdateQuantidade = (servicoId, quantidade) => {
    if (quantidade <= 0) {
      handleRemoveServico(servicoId)
      return
    }

    setFormData((prev) => ({
      ...prev,
      servicos: prev.servicos.map((s) => (s.id === servicoId ? { ...s, quantidade } : s)),
    }))
  }

  // Gera código do orçamento
  const generateCodigo = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `ORC-${year}${month}${random}`
  }

  // Salva orçamento
  const handleSave = async () => {
    if (!formData.cliente) {
      alert("Selecione um cliente")
      return
    }

    const bicicletasSelecionadas = formData.bicicletas.filter((bike) => bike.selected)

    if (formData.servicos.length === 0) {
      alert("Adicione pelo menos um serviço")
      return
    }

    setLoading(true)

    try {
      const orcamentoData = {
        codigo: generateCodigo(),
        cliente: {
          id: formData.cliente.id,
          nome: formData.cliente.nome,
          telefone: formData.cliente.telefone,
          email: formData.cliente.email,
        },
        bicicletas: bicicletasSelecionadas.map((bike) => ({
          id: bike.id,
          marca: bike.marca,
          modelo: bike.modelo,
          cor: bike.cor,
        })),
        servicos: formData.servicos,
        valorTotal,
        observacoes: formData.observacoes,
        tipoPessoa: formData.pessoaJuridica ? "Jurídica" : "Física",
        evento: formData.evento,
        status: "Aberto",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      }

      await addDoc(collection(db, "orcamentos"), orcamentoData)
      alert("Orçamento criado com sucesso!")
      onBack()
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error)
      alert("Erro ao salvar orçamento")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Orçamento</h1>
          <p className="text-gray-600">Crie um novo orçamento para o cliente</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Seleção de Cliente */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Cliente</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar cliente por nome ou telefone..."
              value={clienteSearch}
              onChange={(e) => {
                setClienteSearch(e.target.value)
                setShowClienteDropdown(true)
              }}
              onFocus={() => setShowClienteDropdown(true)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />

            {showClienteDropdown && clientes.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {clientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    onClick={() => handleSelectCliente(cliente)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{cliente.nome}</div>
                    <div className="text-sm text-gray-600">{cliente.telefone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formData.cliente && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Cliente Selecionado:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Nome:</span>
                  <div className="font-medium">{formData.cliente.nome}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Telefone:</span>
                  <div className="font-medium">{formData.cliente.telefone}</div>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.pessoaJuridica}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, pessoaJuridica: e.target.checked }))
                    }
                    className="w-4 h-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <span>Pessoa Jurídica</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.evento}
                    onChange={(e) => setFormData((p) => ({ ...p, evento: e.target.checked }))}
                    className="w-4 h-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <span>Evento</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Seleção de Bicicletas */}
        {formData.cliente && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Bicicletas do Cliente</h2>
            {formData.bicicletas.length === 0 ? (
              <p className="text-gray-500">Nenhuma bicicleta encontrada para este cliente</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.bicicletas.map((bike) => (
                  <div
                    key={bike.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      bike.selected ? "border-yellow-500 bg-yellow-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => handleToggleBicicleta(bike.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={bike.selected}
                        onChange={() => handleToggleBicicleta(bike.id)}
                        className="w-4 h-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      />
                      <div>
                        <div className="font-medium">
                          {bike.marca} {bike.modelo}
                        </div>
                        <div className="text-sm text-gray-600">Cor: {bike.cor}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              {showAddBike ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Marca"
                    value={newBike.marca}
                    onChange={(e) => setNewBike((p) => ({ ...p, marca: e.target.value }))}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Modelo"
                    value={newBike.modelo}
                    onChange={(e) => setNewBike((p) => ({ ...p, modelo: e.target.value }))}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Cor"
                    value={newBike.cor}
                    onChange={(e) => setNewBike((p) => ({ ...p, cor: e.target.value }))}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <div className="col-span-full flex gap-3 mt-2">
                    <button
                      onClick={handleAddBikeManual}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={() => setShowAddBike(false)}
                      className="px-4 py-2 border border-gray-300 rounded"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddBike(true)}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                >
                  Adicionar Bicicleta
                </button>
              )}
            </div>
          </div>
        )}

        {/* Seleção de Serviços */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Serviços</h2>

          {/* Lista de serviços disponíveis */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Adicionar Serviços:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {servicosDisponiveis.map((servico) => (
                <button
                  key={servico.id}
                  onClick={() => handleAddServico(servico)}
                  className="p-3 text-left border border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
                >
                  <div className="font-medium">{servico.nome}</div>
                  <div className="text-sm text-gray-600">{formatCurrency(servico.preco)}</div>
                </button>
              ))}
            </div>
            <div className="mt-4">
              {showManualService ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                  <input
                    type="text"
                    placeholder="Serviço"
                    value={manualService.nome}
                    onChange={(e) => setManualService((p) => ({ ...p, nome: e.target.value }))}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Valor"
                    value={manualService.preco}
                    onChange={(e) => setManualService((p) => ({ ...p, preco: e.target.value }))}
                    className="p-2 border border-gray-300 rounded"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddServicoManual}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={() => setShowManualService(false)}
                      className="px-4 py-2 border border-gray-300 rounded"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowManualService(true)}
                  className="mt-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                >
                  Serviço Manual
                </button>
              )}
            </div>
          </div>

          {/* Serviços selecionados */}
          {formData.servicos.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Serviços Selecionados:</h3>
              <div className="space-y-3">
                {formData.servicos.map((servico) => (
                  <div key={servico.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{servico.nome}</div>
                      <div className="text-sm text-gray-600">{formatCurrency(servico.preco)} cada</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantidade(servico.id, servico.quantidade - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{servico.quantidade}</span>
                        <button
                          onClick={() => handleUpdateQuantidade(servico.id, servico.quantidade + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                      <div className="font-medium min-w-[80px] text-right">
                        {formatCurrency(servico.preco * servico.quantidade)}
                      </div>
                      <button
                        onClick={() => handleRemoveServico(servico.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Observações</h2>
          <textarea
            value={formData.observacoes}
            onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
            placeholder="Observações adicionais sobre o orçamento..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>

        {/* Resumo e Ações */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">Valor Total</h2>
              <div className="text-3xl font-bold text-yellow-600">{formatCurrency(valorTotal)}</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Salvar Orçamento"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de detalhes do orçamento
const BudgetDetails = ({ budgetId, onBack, onUpdate }) => {
  const [orcamento, setOrcamento] = useState(null)
  const [loading, setLoading] = useState(true)

  // Carrega dados do orçamento
  useEffect(() => {
    const loadOrcamento = async () => {
      try {
        const orcamentosSnapshot = await getDocs(collection(db, "orcamentos"))
        const orcamentoData = orcamentosSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .find((orc) => orc.id === budgetId)

        setOrcamento(orcamentoData)
      } catch (error) {
        console.error("Erro ao carregar orçamento:", error)
      } finally {
        setLoading(false)
      }
    }

    loadOrcamento()
  }, [budgetId])

  // Aprova orçamento e cria OS
  const handleAprovar = async () => {
    if (!orcamento) return

    try {
      // Cria ordem de serviço
      // Gera código sequencial da ordem de serviço
      const generateOSCode = async () => {
        const now = new Date()
        const ano = now.getFullYear()
        const mes = String(now.getMonth() + 1).padStart(2, "0")
        const ordensRef = collection(db, "ordens")
        const q = query(
          ordensRef,
          where("codigo", ">=", `OS-${ano}${mes}`),
          where("codigo", "<=", `OS-${ano}${mes}\uf8ff`),
          orderBy("codigo", "desc"),
          limit(1)
        )
        const snap = await getDocs(q)
        const last = snap.docs[0]?.data()
        const sequencial = (last?.sequencial || 0) + 1
        const codigoOS = `OS-${ano}${mes}${String(sequencial).padStart(3, "0")}`
        const urlOS = `${window.location.origin}/consulta?os=${codigoOS}`
        return { codigoOS, sequencial, urlOS }
      }

      const { codigoOS, sequencial, urlOS } = await generateOSCode()

      const osData = {
        codigo: codigoOS,
        urlOS,
        sequencial,
        cliente: orcamento.cliente,
        bicicletas: orcamento.bicicletas,
        servicos: orcamento.servicos,
        valorTotal: orcamento.valorTotal,
        observacoes: orcamento.observacoes,
        status: "Pendente",
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        orcamentoId: orcamento.id,
      }

      await addDoc(collection(db, "ordens"), osData)

      // Atualiza status do orçamento
      await updateDoc(doc(db, "orcamentos", orcamento.id), {
        status: "Aprovado",
        dataAtualizacao: new Date(),
      })

      alert("Orçamento aprovado e OS criada com sucesso!")
      onUpdate()
    } catch (error) {
      console.error("Erro ao aprovar orçamento:", error)
      alert("Erro ao aprovar orçamento")
    }
  }

  // Rejeita orçamento
  const handleRejeitar = async () => {
    if (!orcamento) return

    try {
      await updateDoc(doc(db, "orcamentos", orcamento.id), {
        status: "Rejeitado",
        dataAtualizacao: new Date(),
      })

      alert("Orçamento rejeitado!")
      onUpdate()
    } catch (error) {
      console.error("Erro ao rejeitar orçamento:", error)
      alert("Erro ao rejeitar orçamento")
    }
  }

  // Exporta PDF
  const handleExportPDF = async () => {
    if (!orcamento) return

    try {
      const element = document.getElementById("orcamento-content")
      const canvas = await html2canvas(element)
      const imgData = canvas.toDataURL("image/png")

      const pdf = new jsPDF()
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${orcamento.codigo}.pdf`)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      alert("Erro ao gerar PDF")
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "Data não disponível"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("pt-BR")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  if (!orcamento) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Orçamento não encontrado</h2>
          <button onClick={onBack} className="text-yellow-600 hover:text-yellow-700">
            Voltar à listagem
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{orcamento.codigo}</h1>
            <p className="text-gray-600">Detalhes do orçamento</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={20} />
            Exportar PDF
          </button>

          {orcamento.status === "Aberto" && (
            <>
              <button
                onClick={handleRejeitar}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <XCircle size={20} />
                Rejeitar
              </button>
              <button
                onClick={handleAprovar}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Check size={20} />
                Aprovar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Conteúdo do orçamento */}
      <div id="orcamento-content" className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        {/* Header do documento */}
        <div className="text-center mb-8 border-b pb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SPORT & BIKE</h1>
          <p className="text-gray-600">Rua Ana Bilhar, 1680 - Varjota, Fortaleza - CE</p>
          <p className="text-gray-600">Tel: (85) 3267-7425 | WhatsApp: (85) 3267-7425</p>
          <p className="text-gray-600">@sportbike_fortaleza | comercialsportbike@gmail.com</p>
        </div>

        {/* Informações do orçamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Informações do Orçamento</h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Código:</span> {orcamento.codigo}
              </div>
              <div>
                <span className="font-medium">Data:</span> {formatDate(orcamento.dataCriacao)}
              </div>
              <div>
                <span className="font-medium">Status:</span> {orcamento.status}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Dados do Cliente</h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Nome:</span> {orcamento.cliente.nome}
              </div>
              <div>
                <span className="font-medium">Telefone:</span> {orcamento.cliente.telefone}
              </div>
              {orcamento.cliente.email && (
                <div>
                  <span className="font-medium">Email:</span> {orcamento.cliente.email}
                </div>
              )}
              <div>
                <span className="font-medium">Tipo de Pessoa:</span> {orcamento.tipoPessoa || "Física"}
              </div>
              <div>
                <span className="font-medium">Evento:</span> {orcamento.evento ? "Sim" : "Não"}
              </div>
            </div>
          </div>
        </div>

        {/* Bicicletas */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Bicicletas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orcamento.bicicletas.map((bike, index) => (
              <div key={bike.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="font-medium">
                  {bike.marca} {bike.modelo}
                </div>
                <div className="text-sm text-gray-600">Cor: {bike.cor}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Serviços */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Serviços</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left">Serviço</th>
                  <th className="border border-gray-300 p-3 text-center">Qtd</th>
                  <th className="border border-gray-300 p-3 text-right">Valor Unit.</th>
                  <th className="border border-gray-300 p-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {orcamento.servicos.map((servico, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-3">{servico.nome}</td>
                    <td className="border border-gray-300 p-3 text-center">{servico.quantidade}</td>
                    <td className="border border-gray-300 p-3 text-right">{formatCurrency(servico.preco)}</td>
                    <td className="border border-gray-300 p-3 text-right">
                      {formatCurrency(servico.preco * servico.quantidade)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan="3" className="border border-gray-300 p-3 text-right font-semibold">
                    Total:
                  </td>
                  <td className="border border-gray-300 p-3 text-right font-bold text-lg">
                    {formatCurrency(orcamento.valorTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Observações */}
        {orcamento.observacoes && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Observações</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{orcamento.observacoes}</p>
          </div>
        )}

        {/* Rodapé */}
        <div className="border-t pt-6 text-center text-sm text-gray-600">
          <p>Este orçamento tem validade de 30 dias a partir da data de emissão.</p>
          <p className="mt-2">Obrigado pela preferência!</p>
        </div>
      </div>
    </div>
  )
}

export default BudgetScreen
