"use client"

/**
 * HomeManagement
 *
 * Required client env vars (.env local e Vercel):
 * VITE_CLOUDINARY_CLOUD_NAME
 * VITE_CLOUDINARY_UPLOAD_PRESET
 * VITE_ADMIN_API_TOKEN (token para /api/cloudinary-delete)
 *
 * Serverless env vars (Vercel):
 * CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, ADMIN_API_TOKEN
 */

import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../config/firebase"
import {
  uploadImageToCloudinary,
  optimizeCloudinaryUrl,
  isCloudinaryUrl,
  extractPublicIdFromUrl,
} from "../services/cloudinary"

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const emptyItem = {
  title: "",
  description: "",
  price: "",
  visible: true,
  imageUrl: "",
  publicId: null,
}

function FeaturedModal({ initialData, onClose, onSave }) {
  const [formData, setFormData] = useState(initialData)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(initialData.imageUrl || "")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }))
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
    setFormData((p) => ({ ...p, imageUrl: value }))
    setPreview(value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      await onSave({ ...formData, imageFile })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          {initialData.id ? "Editar" : "Novo"} Destaque
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
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
            <label className="block text-sm font-medium mb-1">Imagem (arquivo)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Imagem (URL)</label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleUrlChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {preview && (
            <img
              src={preview}
              alt="Pré-visualização"
              className="w-full h-48 object-cover rounded"
            />
          )}
          <div className="flex items-center space-x-2">
            <input
              id="visible"
              type="checkbox"
              name="visible"
              checked={formData.visible}
              onChange={handleChange}
            />
            <label htmlFor="visible" className="text-sm">
              Visível
            </label>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-600 text-white rounded"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function HomeManagement() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)

  useEffect(() => {
    const q = query(collection(db, "featured"), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setItems(docs)
      setLoading(false)
      // optional backfill of publicId
      docs.forEach((it) => {
        if (!it.publicId && it.imageUrl && isCloudinaryUrl(it.imageUrl)) {
          const pid = extractPublicIdFromUrl(it.imageUrl)
          if (pid) {
            updateDoc(doc(db, "featured", it.id), { publicId: pid })
          }
        }
      })
    })
    return () => unsub()
  }, [])

  const parsePrice = (value) => {
    if (typeof value === "number") return value
    return Number(value.replace(/\./g, "").replace(",", "."))
  }

  const deleteCloudinaryImage = async (publicId) => {
    if (!publicId) return
    const token = import.meta.env.VITE_ADMIN_API_TOKEN
    try {
      await fetch("/api/cloudinary-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ publicId }),
      })
    } catch (err) {
      console.error("Erro ao deletar imagem do Cloudinary", err)
    }
  }

  const handleAdd = async (data) => {
    const price = parsePrice(data.price)
    const itemData = {
      title: data.title,
      description: data.description,
      price,
      visible: data.visible,
    }
    let imageUrl = data.imageUrl
    let imageUrlCard = ""
    let publicId = null

    if (data.imageFile) {
      const upload = await uploadImageToCloudinary(data.imageFile)
      imageUrl = upload.secureUrl
      imageUrlCard = optimizeCloudinaryUrl(upload.secureUrl)
      publicId = upload.publicId
    } else if (imageUrl) {
      if (isCloudinaryUrl(imageUrl)) {
        imageUrlCard = optimizeCloudinaryUrl(imageUrl)
        publicId = extractPublicIdFromUrl(imageUrl)
      }
    }

    await addDoc(collection(db, "featured"), {
      ...itemData,
      imageUrl,
      imageUrlCard,
      publicId,
      createdAt: serverTimestamp(),
    })
    setShowModal(false)
  }

  const handleUpdate = async (data) => {
    if (!editItem) return
    const ref = doc(db, "featured", editItem.id)
    const price = parsePrice(data.price)
    const updates = {
      title: data.title,
      description: data.description,
      price,
      visible: data.visible,
      updatedAt: serverTimestamp(),
    }

    let imageUrl = data.imageUrl
    let imageUrlCard = editItem.imageUrlCard || ""
    let publicId = editItem.publicId || null

    if (data.imageFile) {
      if (publicId) await deleteCloudinaryImage(publicId)
      const upload = await uploadImageToCloudinary(data.imageFile)
      imageUrl = upload.secureUrl
      imageUrlCard = optimizeCloudinaryUrl(upload.secureUrl)
      publicId = upload.publicId
    } else if (imageUrl !== editItem.imageUrl) {
      if (publicId) await deleteCloudinaryImage(publicId)
      if (imageUrl && isCloudinaryUrl(imageUrl)) {
        imageUrlCard = optimizeCloudinaryUrl(imageUrl)
        publicId = extractPublicIdFromUrl(imageUrl)
      } else {
        imageUrlCard = ""
        publicId = null
      }
    }

    await updateDoc(ref, { ...updates, imageUrl, imageUrlCard, publicId })
    setShowModal(false)
    setEditItem(null)
  }

  const handleDelete = async (item) => {
    if (!confirm("Remover este item?")) return
    if (item.publicId) await deleteCloudinaryImage(item.publicId)
    await deleteDoc(doc(db, "featured", item.id))
  }

  const handleToggleVisibility = async (item) => {
    await updateDoc(doc(db, "featured", item.id), {
      visible: !item.visible,
      updatedAt: serverTimestamp(),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="p-4 flex items-center space-x-4 bg-white dark:bg-gray-800 shadow">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold flex-1">Gerenciar Destaques</h1>
        <button
          onClick={() => {
            setEditItem(null)
            setShowModal(true)
          }}
          className="px-4 py-2 bg-amber-600 text-white rounded flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" /> Novo
        </button>
      </header>
      <main className="p-4 space-y-4">
        {loading ? (
          <div>Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden"
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrlCard || item.imageUrl}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4 space-y-2">
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {item.description}
                    </p>
                  )}
                  <p className="font-semibold text-amber-600">
                    {currency.format(item.price)}
                  </p>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleVisibility(item)}
                        className="p-2 rounded bg-gray-200 dark:bg-gray-700"
                      >
                        {item.visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditItem(item)
                          setShowModal(true)
                        }}
                        className="p-2 rounded bg-blue-200 dark:bg-blue-700/40"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 rounded bg-red-200 dark:bg-red-700/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {!item.visible && (
                      <span className="text-xs text-gray-500">Oculto</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {showModal && (
        <FeaturedModal
          initialData={editItem || emptyItem}
          onClose={() => {
            setShowModal(false)
            setEditItem(null)
          }}
          onSave={editItem ? handleUpdate : handleAdd}
        />
      )}
    </div>
  )
}
