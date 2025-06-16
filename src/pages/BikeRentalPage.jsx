"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Bike,
  Plus,
  Search,
  Calendar,
  Phone,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Edit,
  Trash2,
  Upload,
  Eye,
  Download,
  Settings,
  Package,
} from "lucide-react"

export default function BikeRentalPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showNewRentalModal, setShowNewRentalModal] = useState(false)
  const [showNewBikeModal, setShowNewBikeModal] = useState(false)
  const [editingBike, setEditingBike] = useState(null)
  const [bikeSearchTerm, setBikeSearchTerm] = useState("")
  const [newRental, setNewRental] = useState({
    clientName: "",
    phone: "",
    address: "",
    document: null,
    bikes: [{ bikeId: "", quantity: 1, dailyRate: 0 }],
    startDate: "",
    endDate: "",
    totalDays: 1,
    deposit: 0,
    observations: "",
  })
  const [newBike, setNewBike] = useState({
    id: "",
    model: "",
    type: "",
    brand: "",
    color: "",
    size: "",
    dailyRate: 0,
    status: "available",
    condition: "excellent",
    serialNumber: "",
    purchaseDate: "",
    observations: "",
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const [bikeFleet, setBikeFleet] = useState([
    {
      id: "BK001",
      model: "Urban Pro",
      type: "Urbana",
      brand: "Caloi",
      color: "Azul",
      size: "M",
      dailyRate: 25.0,
      status: "available",
      condition: "excellent",
      serialNumber: "CAL2024001",
      purchaseDate: "2024-01-15",
      observations: "",
      totalRentals: 15,
      revenue: 375.0,
    },
    {
      id: "BK002",
      model: "Speed Master",
      type: "Speed",
      brand: "Trek",
      color: "Vermelho",
      size: "L",
      dailyRate: 40.0,
      status: "rented",
      condition: "good",
      serialNumber: "TRK2024002",
      purchaseDate: "2024-02-10",
      observations: "Precisa ajuste no câmbio",
      totalRentals: 8,
      revenue: 320.0,
    },
    {
      id: "BK003",
      model: "Mountain Explorer",
      type: "MTB",
      brand: "Specialized",
      color: "Verde",
      size: "M",
      dailyRate: 35.0,
      status: "maintenance",
      condition: "fair",
      serialNumber: "SPE2024003",
      purchaseDate: "2024-01-20",
      observations: "Em manutenção - troca de pneu",
      totalRentals: 12,
      revenue: 420.0,
    },
    {
      id: "BK004",
      model: "Kids Fun",
      type: "Infantil",
      brand: "Nathor",
      color: "Rosa",
      size: "S",
      dailyRate: 20.0,
      status: "available",
      condition: "excellent",
      serialNumber: "NAT2024004",
      purchaseDate: "2024-03-05",
      observations: "",
      totalRentals: 6,
      revenue: 120.0,
    },
  ])

  const bikeTypes = [
    { id: 1, name: "Urbana", dailyRate: 25.0 },
    { id: 2, name: "Speed", dailyRate: 40.0 },
    { id: 3, name: "MTB", dailyRate: 35.0 },
    { id: 4, name: "Infantil", dailyRate: 20.0 },
  ]

  const mockRentals = [
    {
      id: 1,
      clientName: "João Silva",
      phone: "(85) 99999-9999",
      address: "Rua das Flores, 123, Centro, Fortaleza-CE",
      bikes: [{ bikeId: "BK002", type: "Speed", quantity: 1 }],
      startDate: "2025-01-10",
      endDate: "2025-01-15",
      totalDays: 5,
      dailyRate: 40.0,
      totalValue: 200.0,
      deposit: 100.0,
      status: "active",
      isLate: false,
      document: "documento1.pdf",
    },
    {
      id: 2,
      clientName: "Maria Santos",
      phone: "(85) 88888-8888",
      address: "Av. Principal, 456, Aldeota, Fortaleza-CE",
      bikes: [{ bikeId: "BK001", type: "Urbana", quantity: 1 }],
      startDate: "2025-01-08",
      endDate: "2025-01-12",
      totalDays: 4,
      dailyRate: 25.0,
      totalValue: 100.0,
      deposit: 50.0,
      status: "overdue",
      isLate: true,
      daysLate: 3,
      document: "documento2.pdf",
    },
    {
      id: 3,
      clientName: "Pedro Costa",
      phone: "(85) 77777-7777",
      address: "Rua do Mar, 789, Meireles, Fortaleza-CE",
      bikes: [{ bikeId: "BK003", type: "MTB", quantity: 1 }],
      startDate: "2025-01-05",
      endDate: "2025-01-10",
      totalDays: 5,
      dailyRate: 35.0,
      totalValue: 175.0,
      deposit: 70.0,
      status: "returned",
      isLate: false,
      document: null,
    },
  ]

  const calculateDays = (start, end) => {
    if (!start || !end) return 1
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays || 1
  }

  const calculateTotal = () => {
    return newRental.bikes.reduce((total, bike) => {
      const selectedBike = bikeFleet.find((b) => b.id === bike.bikeId)
      return total + (selectedBike ? selectedBike.dailyRate * newRental.totalDays : 0)
    }, 0)
  }

  const addBike = () => {
    setNewRental({
      ...newRental,
      bikes: [...newRental.bikes, { bikeId: "", quantity: 1, dailyRate: 0 }],
    })
  }

  const removeBike = (index) => {
    if (newRental.bikes.length > 1) {
      setNewRental({
        ...newRental,
        bikes: newRental.bikes.filter((_, i) => i !== index),
      })
    }
  }

  const updateBike = (index, field, value) => {
    const updatedBikes = newRental.bikes.map((bike, i) => {
      if (i === index) {
        const updatedBike = { ...bike, [field]: value }
        if (field === "bikeId") {
          const selectedBike = bikeFleet.find((b) => b.id === value)
          if (selectedBike) {
            updatedBike.dailyRate = selectedBike.dailyRate
          }
        }
        return updatedBike
      }
      return bike
    })
    setNewRental({ ...newRental, bikes: updatedBikes })
  }

  const handleDateChange = (field, value) => {
    const updatedRental = { ...newRental, [field]: value }
    if (field === "startDate" || field === "endDate") {
      updatedRental.totalDays = calculateDays(
        field === "startDate" ? value : newRental.startDate,
        field === "endDate" ? value : newRental.endDate,
      )
    }
    setNewRental(updatedRental)
  }

  const handleSaveRental = () => {
    if (!newRental.clientName || !newRental.phone || !newRental.address) {
      alert("Preencha todos os campos obrigatórios")
      return
    }
    if (newRental.bikes.some((bike) => !bike.bikeId)) {
      alert("Selecione todas as bicicletas")
      return
    }

    const updatedFleet = bikeFleet.map((bike) => {
      const isRented = newRental.bikes.some((rentalBike) => rentalBike.bikeId === bike.id)
      if (isRented) {
        return { ...bike, status: "rented" }
      }
      return bike
    })
    setBikeFleet(updatedFleet)

    console.log("Novo aluguel:", newRental)
    alert("Aluguel cadastrado com sucesso!")
    setShowNewRentalModal(false)
    setNewRental({
      clientName: "",
      phone: "",
      address: "",
      document: null,
      bikes: [{ bikeId: "", quantity: 1, dailyRate: 0 }],
      startDate: "",
      endDate: "",
      totalDays: 1,
      deposit: 0,
      observations: "",
    })
  }

  const handleSaveBike = () => {
    if (!newBike.model || !newBike.type || !newBike.brand) {
      alert("Preencha todos os campos obrigatórios")
      return
    }

    if (editingBike) {
      setBikeFleet(bikeFleet.map((bike) => (bike.id === editingBike.id ? { ...newBike, id: editingBike.id } : bike)))
      alert("Bicicleta atualizada com sucesso!")
    } else {
      const newId = `BK${String(bikeFleet.length + 1).padStart(3, "0")}`
      setBikeFleet([...bikeFleet, { ...newBike, id: newId, totalRentals: 0, revenue: 0 }])
      alert("Bicicleta cadastrada com sucesso!")
    }

    setShowNewBikeModal(false)
    setEditingBike(null)
    setNewBike({
      id: "",
      model: "",
      type: "",
      brand: "",
      color: "",
      size: "",
      dailyRate: 0,
      status: "available",
      condition: "excellent",
      serialNumber: "",
      purchaseDate: "",
      observations: "",
    })
  }

  const handleEditBike = (bike) => {
    setEditingBike(bike)
    setNewBike({ ...bike })
    setShowNewBikeModal(true)
  }

  const handleDeleteBike = (bikeId) => {
    if (confirm("Tem certeza que deseja excluir esta bicicleta?")) {
      setBikeFleet(bikeFleet.filter((bike) => bike.id !== bikeId))
      alert("Bicicleta excluída com sucesso!")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "returned":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getBikeStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "rented":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "unavailable":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getConditionColor = (condition) => {
    switch (condition) {
      case "excellent":
        return "text-green-600 dark:text-green-400"
      case "good":
        return "text-blue-600 dark:text-blue-400"
      case "fair":
        return "text-yellow-600 dark:text-yellow-400"
      case "poor":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <Clock className="w-4 h-4" />
      case "overdue":
        return <AlertTriangle className="w-4 h-4" />
      case "returned":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const filteredRentals = mockRentals.filter((rental) => {
    const matchesSearch =
      rental.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || rental.phone.includes(searchTerm)
    const matchesFilter = filterStatus === "all" || rental.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const filteredBikes = bikeFleet.filter(
    (bike) =>
      bike.model.toLowerCase().includes(bikeSearchTerm.toLowerCase()) ||
      bike.type.toLowerCase().includes(bikeSearchTerm.toLowerCase()) ||
      bike.brand.toLowerCase().includes(bikeSearchTerm.toLowerCase()) ||
      bike.id.toLowerCase().includes(bikeSearchTerm.toLowerCase()),
  )

  const stats = {
    total: mockRentals.length,
    active: mockRentals.filter((r) => r.status === "active").length,
    overdue: mockRentals.filter((r) => r.status === "overdue").length,
    returned: mockRentals.filter((r) => r.status === "returned").length,
    revenue: mockRentals.reduce((sum, r) => sum + r.totalValue, 0),
  }

  const bikeStats = {
    total: bikeFleet.length,
    available: bikeFleet.filter((b) => b.status === "available").length,
    rented: bikeFleet.filter((b) => b.status === "rented").length,
    maintenance: bikeFleet.filter((b) => b.status === "maintenance").length,
    totalRevenue: bikeFleet.reduce((sum, b) => sum + b.revenue, 0),
  }

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Aluguéis</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <Bike className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ativos</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Em Atraso</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Devolvidos</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.returned}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receita Total</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {stats.revenue.toFixed(2)}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
          <Package className="w-6 h-6 mr-2 text-purple-500" />
          Status da Frota
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{bikeStats.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Bikes</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{bikeStats.available}</p>
              <p className="text-sm text-green-600 dark:text-green-400">Disponíveis</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{bikeStats.rented}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Alugadas</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{bikeStats.maintenance}</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Manutenção</p>
            </div>
          </div>
        </div>
      </div>

      {stats.overdue > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-400">Atenção: Aluguéis em Atraso</h3>
              <p className="text-red-700 dark:text-red-500">
                Existem {stats.overdue} aluguel(is) em atraso que precisam de atenção imediata.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Aluguéis Recentes</h3>
        <div className="space-y-4">
          {filteredRentals.slice(0, 5).map((rental) => (
            <div
              key={rental.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                  <Bike className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white">{rental.clientName}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {rental.bikes.map((b) => `${b.bikeId} (${b.type})`).join(", ")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}
                >
                  {getStatusIcon(rental.status)}
                  <span>
                    {rental.status === "active" ? "Ativo" : rental.status === "overdue" ? "Atrasado" : "Devolvido"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">R$ {rental.totalValue.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderRentals = () => (
    <div className="space-y-6">
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent w-64"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="overdue">Em Atraso</option>
              <option value="returned">Devolvidos</option>
            </select>
          </div>
          <button
            onClick={() => setShowNewRentalModal(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Aluguel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRentals.map((rental) => (
          <div
            key={rental.id}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                  <Bike className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white">{rental.clientName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ID: {rental.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}
                >
                  {getStatusIcon(rental.status)}
                  <span>
                    {rental.status === "active" ? "Ativo" : rental.status === "overdue" ? "Atrasado" : "Devolvido"}
                  </span>
                </div>
                {rental.isLate && (
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium">
                    {rental.daysLate} dias
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4 mr-2" />
                <span className="text-sm">{rental.phone}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">{rental.address}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {new Date(rental.startDate).toLocaleDateString("pt-BR")} - {new Date(rental.endDate).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Bicicletas</h4>
              {rental.bikes.map((bike, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {bike.bikeId} ({bike.type})
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-white">
                    R$ {(rental.dailyRate * rental.totalDays).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">R$ {rental.totalValue.toFixed(2)}</p>
              </div>
              <div className="flex items-center space-x-2">
                {rental.document && (
                  <button
                    className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Ver documento"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button
                  className="p-2 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                  title="Gerar contrato"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderBikes = () => (
    <div className="space-y-6">
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por modelo, tipo ou ID..."
                value={bikeSearchTerm}
                onChange={(e) => setBikeSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent w-64"
              />
            </div>
          </div>
          <button
            onClick={() => setShowNewBikeModal(true)}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Bicicleta</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBikes.map((bike) => (
          <div
            key={bike.id}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                  <Bike className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white">{bike.model}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ID: {bike.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getBikeStatusColor(bike.status)}`}>
                  {bike.status === "available"
                    ? "Disponível"
                    : bike.status === "rented"
                    ? "Alugada"
                    : bike.status === "maintenance"
                    ? "Manutenção"
                    : "Indisponível"}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                  <p className="font-medium text-gray-800 dark:text-white">{bike.type}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Marca:</span>
                  <p className="font-medium text-gray-800 dark:text-white">{bike.brand}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Cor:</span>
                  <p className="font-medium text-gray-800 dark:text-white">{bike.color}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Tamanho:</span>
                  <p className="font-medium text-gray-800 dark:text-white">{bike.size}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Condição:</span>
                  <p className={`font-medium ${getConditionColor(bike.condition)}`}>
                    {bike.condition === "excellent"
                      ? "Excelente"
                      : bike.condition === "good"
                      ? "Boa"
                      : bike.condition === "fair"
                      ? "Regular"
                      : "Ruim"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Diária:</span>
                  <p className="font-bold text-green-600 dark:text-green-400">R$ {bike.dailyRate.toFixed(2)}</p>
                </div>
              </div>

              {bike.observations && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">{bike.observations}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Aluguéis:</span>
                  <p className="font-semibold text-gray-800 dark:text-white">{bike.totalRentals}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Receita:</span>
                  <p className="font-semibold text-green-600 dark:text-green-400">R$ {bike.revenue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p>Serial: {bike.serialNumber}</p>
                <p>Compra: {new Date(bike.purchaseDate).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditBike(bike)}
                  className="p-2 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteBike(bike.id)}
                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

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
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-2 rounded-full">
                    <Bike className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Aluguel de Bicicletas</h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-8">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === "dashboard"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab("rentals")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === "rentals"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Bike className="w-5 h-5" />
                <span>Aluguéis</span>
              </button>
              <button
                onClick={() => setActiveTab("bikes")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === "bikes"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Bicicletas</span>
              </button>
            </div>
          </div>

          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "rentals" && renderRentals()}
          {activeTab === "bikes" && renderBikes()}
        </main>

        {showNewRentalModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Novo Aluguel</h3>
                  <button
                    onClick={() => setShowNewRentalModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Dados do Cliente</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={newRental.clientName}
                        onChange={(e) => setNewRental({ ...newRental, clientName: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nome do cliente"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Telefone *
                      </label>
                      <input
                        type="tel"
                        value={newRental.phone}
                        onChange={(e) => setNewRental({ ...newRental, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="(85) 99999-9999"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Endereço Completo *
                      </label>
                      <input
                        type="text"
                        value={newRental.address}
                        onChange={(e) => setNewRental({ ...newRental, address: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Rua, número, bairro, cidade"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Documento (opcional)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setNewRental({ ...newRental, document: e.target.files?.[0] || null })}
                          className="hidden"
                          id="document-upload"
                        />
                        <label
                          htmlFor="document-upload"
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">Anexar documento</span>
                        </label>
                        {newRental.document && (
                          <span className="text-sm text-green-600 dark:text-green-400">{newRental.document.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Bicicletas</h4>
                    <button
                      onClick={addBike}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all inline-flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {newRental.bikes.map((bike, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-4 items-end p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="col-span-12 md:col-span-6">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Bicicleta
                          </label>
                          <select
                            value={bike.bikeId}
                            onChange={(e) => updateBike(index, "bikeId", e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Selecionar bicicleta...</option>
                            {bikeFleet
                              .filter((b) => b.status === "available")
                              .map((availableBike) => (
                                <option key={availableBike.id} value={availableBike.id}>
                                  {availableBike.id} - {availableBike.model} ({availableBike.type}) - R$ {availableBike.dailyRate.toFixed(2)}/dia
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="col-span-6 md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Diária
                          </label>
                          <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-800 dark:text-white font-semibold">
                            R$ {bike.dailyRate.toFixed(2)}
                          </div>
                        </div>

                        <div className="col-span-5 md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Subtotal
                          </label>
                          <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-800 dark:text-white font-semibold">
                            R$ {(bike.dailyRate * newRental.totalDays).toFixed(2)}
                          </div>
                        </div>

                        <div className="col-span-1">
                          {newRental.bikes.length > 1 && (
                            <button
                              onClick={() => removeBike(index)}
                              className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Período do Aluguel</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data de Início
                      </label>
                      <input
                        type="date"
                        value={newRental.startDate}
                        onChange={(e) => handleDateChange("startDate", e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data de Devolução
                      </label>
                      <input
                        type="date"
                        value={newRental.endDate}
                        onChange={(e) => handleDateChange("endDate", e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Total de Dias
                      </label>
                      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-800 dark:text-white font-semibold">
                        {newRental.totalDays} dia(s)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valor do Depósito
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newRental.deposit}
                      onChange={(e) => setNewRental({ ...newRental, deposit: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total do Aluguel
                    </label>
                    <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-600 rounded-lg text-green-800 dark:text-green-400 font-bold text-lg">
                      R$ {calculateTotal().toFixed(2)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observações</label>
                  <textarea
                    value={newRental.observations}
                    onChange={(e) => setNewRental({ ...newRental, observations: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Observações adicionais sobre o aluguel..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
                <button
                  onClick={() => setShowNewRentalModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveRental}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                >
                  Salvar Aluguel
                </button>
              </div>
            </div>
          </div>
        )}

        {showNewBikeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {editingBike ? "Editar Bicicleta" : "Nova Bicicleta"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowNewBikeModal(false)
                      setEditingBike(null)
                      setNewBike({
                        id: "",
                        model: "",
                        type: "",
                        brand: "",
                        color: "",
                        size: "",
                        dailyRate: 0,
                        status: "available",
                        condition: "excellent",
                        serialNumber: "",
                        purchaseDate: "",
                        observations: "",
                      })
                    }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Informações Básicas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Modelo *
                      </label>
                      <input
                        type="text"
                        value={newBike.model}
                        onChange={(e) => setNewBike({ ...newBike, model: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Ex: Urban Pro"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo *</label>
                      <select
                        value={newBike.type}
                        onChange={(e) => setNewBike({ ...newBike, type: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Selecionar tipo...</option>
                        <option value="Urbana">Urbana</option>
                        <option value="Speed">Speed</option>
                        <option value="MTB">MTB</option>
                        <option value="Infantil">Infantil</option>
                        <option value="Elétrica">Elétrica</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marca *</label>
                      <input
                        type="text"
                        value={newBike.brand}
                        onChange={(e) => setNewBike({ ...newBike, brand: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Ex: Caloi, Trek, Specialized"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor</label>
                      <input
                        type="text"
                        value={newBike.color}
                        onChange={(e) => setNewBike({ ...newBike, color: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Ex: Azul, Vermelho, Verde"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tamanho</label>
                      <select
                        value={newBike.size}
                        onChange={(e) => setNewBike({ ...newBike, size: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Selecionar tamanho...</option>
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor da Diária (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newBike.dailyRate}
                        onChange={(e) => setNewBike({ ...newBike, dailyRate: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Status e Condição</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                      <select
                        value={newBike.status}
                        onChange={(e) => setNewBike({ ...newBike, status: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="available">Disponível</option>
                        <option value="rented">Alugada</option>
                        <option value="maintenance">Em Manutenção</option>
                        <option value="unavailable">Indisponível</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Condição
                      </label>
                      <select
                        value={newBike.condition}
                        onChange={(e) => setNewBike({ ...newBike, condition: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="excellent">Excelente</option>
                        <option value="good">Boa</option>
                        <option value="fair">Regular</option>
                        <option value="poor">Ruim</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Detalhes Adicionais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Número de Série
                      </label>
                      <input
                        type="text"
                        value={newBike.serialNumber}
                        onChange={(e) => setNewBike({ ...newBike, serialNumber: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Ex: CAL2024001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data de Compra
                      </label>
                      <input
                        type="date"
                        value={newBike.purchaseDate}
                        onChange={(e) => setNewBike({ ...newBike, purchaseDate: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Observações
                    </label>
                    <textarea
                      value={newBike.observations}
                      onChange={(e) => setNewBike({ ...newBike, observations: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Observações sobre a bicicleta, manutenções necessárias, etc."
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowNewBikeModal(false)
                    setEditingBike(null)
                    setNewBike({
                      id: "",
                      model: "",
                      type: "",
                      brand: "",
                      color: "",
                      size: "",
                      dailyRate: 0,
                      status: "available",
                      condition: "excellent",
                      serialNumber: "",
                      purchaseDate: "",
                      observations: "",
                    })
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveBike}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
                >
                  {editingBike ? "Atualizar" : "Cadastrar"} Bicicleta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
