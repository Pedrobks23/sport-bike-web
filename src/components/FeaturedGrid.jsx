/**
 * FeaturedGrid
 * Renderiza os destaques visíveis usando imageUrlCard || imageUrl.
 */
import React, { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

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
    return () => unsub()
  }, [])

  if (!items.length) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((it) => (
        <div
          key={it.id}
          className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden"
        >
          {it.imageUrl && (
            <img
              src={it.imageUrlCard || it.imageUrl}
              alt={it.title}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-4 space-y-2">
            <h3 className="text-lg font-bold">{it.title}</h3>
            {it.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {it.description}
              </p>
            )}
            <p className="font-semibold text-amber-600">
              {currency.format(it.price)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
