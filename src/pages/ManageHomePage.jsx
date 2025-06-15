"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Bike, Plus, Edit, Trash2, Eye, EyeOff, Search, Filter } from "lucide-react"

export default function ManageHomePage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showFeaturedProducts, setShowFeaturedProducts] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const [featuredProducts, setFeaturedProducts] = useState([
    {
      id: 1,
      name: "Bicicleta IGK",
      category: "MTB 29",
      price: "R$ 1.200",
      description: "Modelo de entrada para trilhas",
      image: "/placeholder.svg?height=200&width=300",
      featured: true,
    },
    {
      id: 2,
      name: "Speed Carbon Pro",
      category: "Speed",
      price: "R$ 3.500",
      description: "Bicicleta de alta performance em carbono",
      image: "/placeholder.svg?height=200&width=300",
      featured: true,
    },
    {
      id: 3,
      name: "Urban Comfort",
      category: "Urbana",
      price: "R$ 890",
      description: "Perfeita para deslocamentos diários",
      image: "/placeholder.svg?height=200&width=300",
      featured: false,
    },
  ])

  const handleToggleFeatured = (id) => {
    setFeaturedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p))
    )
  }

  const handleNewProduct = () => {
    const name = prompt("Nome do produto:")
    if (!name) return
    const category = prompt("Categoria:") || ""
    const price = prompt("Preço:") || ""
    const description = prompt("Descrição:") || ""
    const newId =
      featuredProducts.length > 0
        ? Math.max(...featuredProducts.map((p) => p.id)) + 1
        : 1
    setFeaturedProducts((prev) => [
      ...prev,
      { 
        id: newId,
        name,
        category,
        price,
        description,
        image: "/placeholder.svg?height=200&width=300",
        featured: false,
      },
    ])
  }

  const handleEditProduct = (id) => {
    const product = featuredProducts.find((p) => p.id === id)
    if (!product) return
    const name = prompt("Nome do produto:", product.name)
    if (!name) return
    const category = prompt("Categoria:", product.category) || product.category
    const price = prompt("Preço:", product.price) || product.price
    const description = prompt("Descrição:", product.description) || product.description
    setFeaturedProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, name, category, price, description } : p
      )
    )
  }

  const handleDeleteProduct = (id) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      setFeaturedProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const filteredProducts = featuredProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
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
                  <div className="bg-gradient-to-r from-amber-400 to-amber-600 p-2 rounded-full">
                    <Bike className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciar Home</h1>
                </div>
              </div>
              <button
                onClick={handleNewProduct}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-full transition-all transform hover:scale-105 shadow-lg inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Novo Produto</span>
              </button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFeaturedProducts}
                    onChange={(e) => setShowFeaturedProducts(e.target.checked)}
                    className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span className="text-gray-800 dark:text-white font-medium">Exibir seção de produtos em destaque</span>
                </label>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <button className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
          {showFeaturedProducts && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                  >
                  <div className="relative">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => handleToggleFeatured(product.id)}
                        className={`p-2 rounded-full transition-colors ${
                          product.featured
                            ? "bg-amber-500 text-white"
                            : "bg-white/80 text-gray-600 hover:bg-amber-500 hover:text-white"
                        }`}
                        title={product.featured ? "Remover dos destaques" : "Adicionar aos destaques"}
                      >
                        {product.featured ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                    {product.featured && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium">Destaque</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="mb-4">
                      <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">{product.category}</span>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">{product.name}</h3>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{product.price}</p>
                      {product.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 whitespace-pre-line">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditProduct(product.id)}
                          className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          title="Editar produto"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          title="Excluir produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">ID: {product.id}</div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <Bike className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">Nenhum produto encontrado</h3>
                  <p className="text-gray-500 dark:text-gray-500">Tente ajustar os filtros ou adicione novos produtos</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
