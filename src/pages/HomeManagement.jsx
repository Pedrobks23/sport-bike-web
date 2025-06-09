"use client"

import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Bike,
  Plus,
  Edit,
  Trash2,
  Search,
} from "lucide-react"
import {
  getFeaturedProducts,
  createFeaturedProduct,
  updateFeaturedProduct,
  deleteFeaturedProduct,
  getHomeSettings,
  updateHomeSettings,
} from "../services/homeService"
import { uploadImage } from "../services/uploadImage"

const normalizeDriveUrl = (url) => {
  if (!url) return url
  const file = url.match(/https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (file) return `https://drive.google.com/uc?export=view&id=${file[1]}`
  const open = url.match(/https?:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
  if (open) return `https://drive.google.com/uc?export=view&id=${open[1]}`
  const uc = url.match(/https?:\/\/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/)
  if (uc) return `https://drive.google.com/uc?export=view&id=${uc[1]}`
  return url
}

const emptyProduct = { name: "", price: "", image: "", category: "" }

const ProductModal = ({ isEdit, onClose, onSave, product }) => {
  const [formData, setFormData] = useState(product || emptyProduct)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(product?.image || "")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleUrlChange = (e) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, image: value }))
    setPreview(normalizeDriveUrl(value))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...formData, imageFile })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          {isEdit ? "Editar" : "Novo"} Produto
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preço</label>
            <input
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <input
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link da Imagem (Google Drive)</label>
            <input
              name="image"
              value={formData.image}
              onChange={handleUrlChange}
              className="w-full border rounded px-3 py-2 mb-2"
              placeholder="https://drive.google.com/..."
            />
            <label className="block text-sm font-medium mb-1">Upload da Imagem</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full" />
            {preview && <img src={preview} alt="Pré-visualização" className="mt-2 w-full h-40 object-cover rounded" />}
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function HomeManagement() {
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [products, setProducts] = useState([])
  const [showFeatured, setShowFeatured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  const loadData = async () => {
    const [prods, settings] = await Promise.all([getFeaturedProducts(), getHomeSettings()])
    setProducts(prods)
    setShowFeatured(settings.showFeaturedProducts ?? true)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const handleAdd = async (data) => {
    let imageUrl = data.image ? normalizeDriveUrl(data.image) : ""
    if (data.imageFile) {
      imageUrl = await uploadImage(data.imageFile)
    }
    await createFeaturedProduct({ ...data, image: imageUrl })
    setShowModal(false)
    loadData()
  }

  const handleUpdate = async (data) => {
    let imageUrl = editProduct.image
    if (data.imageFile) {
      imageUrl = await uploadImage(data.imageFile)
    } else if (data.image) {
      imageUrl = normalizeDriveUrl(data.image)
    }
    await updateFeaturedProduct(editProduct.id, { ...data, image: imageUrl })
    setEditProduct(null)
    setShowModal(false)
    loadData()
  }

  const handleDelete = async (id) => {
    if (window.confirm("Excluir produto?")) {
      await deleteFeaturedProduct(id)
      loadData()
    }
  }

  const toggleVisibility = async () => {
    const newValue = !showFeatured
    setShowFeatured(newValue)
    await updateHomeSettings({ showFeaturedProducts: newValue })
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/admin")}
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
                onClick={() => setShowModal(true)}
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
                    checked={showFeatured}
                    onChange={toggleVisibility}
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
              </div>
            </div>
          </div>
          {loading ? (
            <div className="text-center text-gray-600 dark:text-gray-300">Carregando...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className="relative">
                      <img src={product.image} alt={product.name} className="w-full h-48 object-cover" loading="lazy" />
                    </div>
                    <div className="p-6">
                      <div className="mb-4">
                        <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">{product.category}</span>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">{product.name}</h3>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{product.price}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditProduct(product)
                              setShowModal(true)
                            }}
                            className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            title="Editar produto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
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
      {showModal && (
        <ProductModal
          isEdit={!!editProduct}
          product={editProduct || emptyProduct}
          onClose={() => {
            setShowModal(false)
            setEditProduct(null)
          }}
          onSave={editProduct ? handleUpdate : handleAdd}
        />
      )}
    </div>
  )
}

