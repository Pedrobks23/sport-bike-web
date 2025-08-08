/**
 * Variáveis de ambiente necessárias:
 *
 * Front (.env)
 * VITE_CLOUDINARY_CLOUD_NAME
 * VITE_CLOUDINARY_UPLOAD_PRESET
 * VITE_ADMIN_API_TOKEN (mesmo valor de ADMIN_API_TOKEN)
 *
 * Serverless (Vercel)
 * CLOUDINARY_CLOUD_NAME
 * CLOUDINARY_API_KEY
 * CLOUDINARY_API_SECRET
 * ADMIN_API_TOKEN
 *
 * Defina os valores em Production e Preview e faça o redeploy.
 * A deleção de imagens usa uma rota serverless que requer o ADMIN_API_TOKEN.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
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
} from 'firebase/firestore'
import { db } from '../config/firebase'
import {
  uploadImageToCloudinary,
  optimizeCloudinaryUrl,
  isCloudinaryUrl,
  extractPublicIdFromUrl,
} from '../services/cloudinary'

const emptyItem = {
  title: '',
  description: '',
  price: '',
  visible: true,
  imageUrl: '',
  publicId: null,
}

export default function HomeManagement() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyItem)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [editing, setEditing] = useState(null)
  const adminToken = import.meta.env.VITE_ADMIN_API_TOKEN

  const deleteFromCloudinary = async (publicId) => {
    if (!publicId || !adminToken) return
    try {
      await fetch('/api/cloudinary-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ publicId }),
      })
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'featured'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setItems(docs)
      docs.forEach((it) => {
        if (!it.publicId && isCloudinaryUrl(it.imageUrl)) {
          const pid = extractPublicIdFromUrl(it.imageUrl)
          if (pid) {
            updateDoc(doc(db, 'featured', it.id), { publicId: pid })
          }
        }
      })
    })
    return unsub
  }, [])

  const formatPrice = (value) =>
    Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })

  const resetForm = () => {
    setForm(emptyItem)
    setFile(null)
    setPreview('')
    setEditing(null)
  }

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  const handleUrl = (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, imageUrl: value, publicId: null }))
    setPreview(value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let imageUrl = form.imageUrl.trim()
    let publicId = null

    if (editing) {
      const imageChanged = file || imageUrl !== (editing.imageUrl || '')
      publicId = editing.publicId || null
      if (imageChanged) {
        if (editing.publicId) {
          await deleteFromCloudinary(editing.publicId)
        }
        if (file) {
          const uploaded = await uploadImageToCloudinary(file)
          imageUrl = uploaded.secureUrl
          publicId = uploaded.publicId
        } else {
          if (isCloudinaryUrl(imageUrl)) {
            publicId = extractPublicIdFromUrl(imageUrl)
          } else {
            publicId = null
          }
        }
      } else {
        imageUrl = editing.imageUrl
      }

      const payload = {
        title: form.title,
        description: form.description,
        price: parseFloat((form.price || '0').replace(',', '.')),
        visible: form.visible,
        imageUrl,
        imageUrlCard: isCloudinaryUrl(imageUrl)
          ? optimizeCloudinaryUrl(imageUrl)
          : '',
        publicId,
      }
      await updateDoc(doc(db, 'featured', editing.id), {
        ...payload,
        updatedAt: serverTimestamp(),
      })
    } else {
      if (file) {
        const uploaded = await uploadImageToCloudinary(file)
        imageUrl = uploaded.secureUrl
        publicId = uploaded.publicId
      } else if (isCloudinaryUrl(imageUrl)) {
        publicId = extractPublicIdFromUrl(imageUrl)
      }
      const payload = {
        title: form.title,
        description: form.description,
        price: parseFloat((form.price || '0').replace(',', '.')),
        visible: form.visible,
        imageUrl,
        imageUrlCard: isCloudinaryUrl(imageUrl)
          ? optimizeCloudinaryUrl(imageUrl)
          : '',
        publicId,
      }
      await addDoc(collection(db, 'featured'), {
        ...payload,
        createdAt: serverTimestamp(),
      })
    }
    setShowModal(false)
    resetForm()
  }

  const handleEdit = (item) => {
    setEditing(item)
    setForm({
      title: item.title || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      visible: item.visible !== false,
      imageUrl: item.imageUrl || '',
      publicId: item.publicId || null,
    })
    setPreview(item.imageUrlCard || item.imageUrl || '')
    setShowModal(true)
  }

  const handleDelete = async (item) => {
    if (window.confirm('Excluir destaque?')) {
      if (item.publicId) {
        await deleteFromCloudinary(item.publicId)
      }
      await deleteDoc(doc(db, 'featured', item.id))
    }
  }

  const handleToggleVisible = async (item) => {
    await updateDoc(doc(db, 'featured', item.id), {
      visible: !item.visible,
      updatedAt: serverTimestamp(),
    })
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Gerenciar Destaques
          </h1>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Novo
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <div key={it.id} className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
              {it.imageUrlCard || it.imageUrl ? (
                <img
                  src={it.imageUrlCard || it.imageUrl}
                  alt={it.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  {it.title}
                </h3>
                {it.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {it.description}
                  </p>
                )}
                <p className="text-amber-600 dark:text-amber-400 font-semibold">
                  {formatPrice(it.price)}
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleToggleVisible(it)}
                    className="p-2 rounded bg-gray-200 dark:bg-gray-700"
                    title={it.visible ? 'Ocultar' : 'Exibir'}
                  >
                    {it.visible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(it)}
                    className="p-2 rounded bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(it)}
                    className="p-2 rounded bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
                {editing ? 'Editar' : 'Novo'} Destaque
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Título</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preço</label>
                  <input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    placeholder="0,00"
                    required
                  />
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="visible"
                    checked={form.visible}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Exibir destaque</span>
                </label>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    URL da Imagem (opcional)
                  </label>
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={handleUrl}
                    className="w-full border rounded px-3 py-2 mb-2"
                    placeholder="https://..."
                  />
                  <label className="block text-sm font-medium mb-1">
                    Upload da Imagem
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    className="w-full"
                  />
                  {preview && (
                    <img
                      src={preview}
                      alt="Pré-visualização"
                      className="mt-2 w-full h-48 object-cover rounded"
                    />
                  )}
                </div>
                <div className="flex justify-end gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded text-white bg-blue-500 hover:bg-blue-600"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

