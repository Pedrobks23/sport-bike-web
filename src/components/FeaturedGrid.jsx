/**
 * Configurar as variáveis de ambiente VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET
 * no .env local e nas Environment Variables da Vercel antes de usar.
 */
import { useEffect, useState } from 'react'
import { db } from '../config/firebase'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'

export default function FeaturedGrid() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, 'featured'),
      where('visible', '==', true),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const formatPrice = (value) =>
    Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((it) => (
        <div key={it.id} className="bg-white dark:bg-gray-800 rounded shadow p-4">
          <img
            src={it.imageUrlCard || it.imageUrl || '/placeholder.svg'}
            alt={it.title}
            className="w-full h-48 object-cover rounded"
            loading="lazy"
          />
          <h3 className="text-lg font-bold mt-2 text-gray-800 dark:text-white">{it.title}</h3>
          {it.description && (
            <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">{it.description}</p>
          )}
          <p className="text-amber-600 dark:text-amber-400 font-semibold mt-2">
            {formatPrice(it.price)}
          </p>
        </div>
      ))}
    </div>
  )
}

