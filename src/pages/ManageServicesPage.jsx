"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Settings, Plus, Edit, Trash2, Clock, DollarSign } from "lucide-react"
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteField,
} from "firebase/firestore"
import { db } from "../config/firebase"

export default function ManageServicesPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [serviceType, setServiceType] = useState("manutencao")
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const loadServices = async (type = serviceType) => {
    try {
      const collectionName = type === "manutencao" ? "servicos" : "rentalServices"
      const ref = collection(db, collectionName)
      const snapshot = await getDocs(ref)
      const data = []
      snapshot.forEach((docSnap) => {
        const docData = docSnap.data()
        Object.entries(docData).forEach(([name, price]) => {
          const numeric = parseFloat(String(price).replace(/['"]/g, ""))
          data.push({ id: `${docSnap.id}_${name}`, name, description: name, price: numeric, duration: 30 })
        })
      })
      data.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      setServices(data)
    } catch (err) {
      console.error("Erro ao carregar serviços:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [serviceType])


  const handleEditService = async (serviceId) => {
    const service = services.find((s) => s.id === serviceId)
    if (!service) return

    const name = prompt("Nome do serviço:", service.name)
    if (!name) return
    const priceStr = prompt("Preço:", String(service.price))
    if (priceStr === null) return
    const price = parseFloat(priceStr)

    try {
      const collectionName = serviceType === "manutencao" ? "servicos" : "rentalServices"
      const ref = collection(db, collectionName)
      const snapshot = await getDocs(ref)
      if (!snapshot.empty) {
        const docRef = doc(db, collectionName, snapshot.docs[0].id)
        await updateDoc(docRef, {
          [service.name]: deleteField(),
          [name]: price.toString(),
        })
        loadServices()
      }
    } catch (err) {
      console.error("Erro ao editar serviço:", err)
    }
  }

  const handleDeleteService = async (serviceId) => {
    const service = services.find((s) => s.id === serviceId)
    if (!service) return
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      try {
        const collectionName = serviceType === "manutencao" ? "servicos" : "rentalServices"
        const ref = collection(db, collectionName)
        const snapshot = await getDocs(ref)
        if (!snapshot.empty) {
          const docRef = doc(db, collectionName, snapshot.docs[0].id)
          await updateDoc(docRef, { [service.name]: deleteField() })
          loadServices()
        }
      } catch (err) {
        console.error("Erro ao excluir serviço:", err)
      }
    }
  }

  const handleNewService = async () => {
    const name = prompt("Nome do serviço:")
    if (!name) return
    const priceStr = prompt("Preço:", "0")
    if (priceStr === null) return
    const price = parseFloat(priceStr)

    try {
      const collectionName = serviceType === "manutencao" ? "servicos" : "rentalServices"
      const ref = collection(db, collectionName)
      const snapshot = await getDocs(ref)
      if (snapshot.empty) {
        await addDoc(ref, { [name]: price.toString() })
      } else {
        const docRef = doc(db, collectionName, snapshot.docs[0].id)
        await updateDoc(docRef, { [name]: price.toString() })
      }
      loadServices()
    } catch (err) {
      console.error("Erro ao adicionar serviço:", err)
    }
  }

  const getServiceColor = (index) => {
    const colors = [
      "from-blue-400 to-blue-600",
      "from-green-400 to-green-600",
      "from-purple-400 to-purple-600",
      "from-red-400 to-red-600",
      "from-amber-400 to-amber-600",
      "from-indigo-400 to-indigo-600",
      "from-pink-400 to-pink-600",
      "from-teal-400 to-teal-600",
    ]
    return colors[index % colors.length]
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
                  <div className="bg-gradient-to-r from-gray-400 to-gray-600 p-2 rounded-full">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciar Serviços</h1>
                </div>
              </div>

              <button
                onClick={handleNewService}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-full transition-all transform hover:scale-105 shadow-lg inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Novo Serviço</span>
              </button>
            </div>
          </div>
        </header>

        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Tipo de Serviço</h3>
            <div className="flex items-center space-x-4">
              <span
                className={`font-medium ${serviceType === "manutencao" ? "text-amber-600 dark:text-amber-400" : "text-gray-500"}`}
              >
                Manutenção
              </span>
              <button
                onClick={() => setServiceType(serviceType === "manutencao" ? "aluguel" : "manutencao")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  serviceType === "aluguel" ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    serviceType === "aluguel" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`font-medium ${serviceType === "aluguel" ? "text-blue-600 dark:text-blue-400" : "text-gray-500"}`}
              >
                Aluguel
              </span>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Serviços</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{services.length}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                  <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Preço Médio</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    R$
                    {services.length > 0
                      ? (services.reduce((sum, s) => sum + s.price, 0) / services.length).toFixed(0)
                      : 0}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mais Caro</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    R$
                    {services.length > 0 ? Math.max(...services.map((s) => s.price)) : 0}
                  </p>
                </div>
                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tempo Médio</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {services[0]?.duration || 30} min
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div
                key={service.id}
                className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`bg-gradient-to-r ${getServiceColor(index)} p-4 text-white`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{service.name}</h3>
                      <p className="text-sm opacity-90">{service.description}</p>
                    </div>
                    <div className="flex space-x-1 ml-4">
                      <button
                        onClick={() => handleEditService(service.id)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                        title="Editar serviço"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                        title="Excluir serviço"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <DollarSign className="w-5 h-5 text-green-500 mr-1" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Preço</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        R$ {service.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Clock className="w-5 h-5 text-blue-500 mr-1" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tempo</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{service.duration} min</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-xs text-gray-500 dark:text-gray-400">ID: {service.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
