import { useState } from "react"
import { uploadToCloudinary } from "@/utils/cloudinary"

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

export default function ProductImagesManager({ value = [], onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const images = Array.isArray(value) ? value : []

  async function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setError("")
    setUploading(true)
    const newImages = [...images]
    try {
      for (const file of files) {
        const res = await uploadToCloudinary(file, { folder: "sportbike/products" })
        newImages.push({
          id: res.asset_id || res.public_id || uid(),
          publicId: res.public_id,
          url: res.secure_url,
          secureUrl: res.secure_url,
          width: res.width,
          height: res.height,
          alt: file.name,
        })
      }
      onChange?.(newImages)
    } catch (err) {
      console.error(err)
      setError(err?.message || "Falha ao enviar imagem")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleRemove(id) {
    setError("")
    const updated = images.filter((img) => img.id !== id)
    onChange?.(updated)
  }

  function move(index, direction) {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const updated = [...images]
    const [item] = updated.splice(index, 1)
    updated.splice(target, 0, item)
    onChange?.(updated)
  }

  function makeCover(index) {
    if (index === 0) return
    const updated = [...images]
    const [item] = updated.splice(index, 1)
    updated.unshift(item)
    onChange?.(updated)
  }

  function updateAlt(id, alt) {
    const updated = images.map((img) => (img.id === id ? { ...img, alt } : img))
    onChange?.(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 max-h-[50vh] overflow-y-auto pr-1">
        {images.map((img, idx) => (
          <div
            key={img.id}
            className="relative flex w-40 flex-col overflow-hidden rounded-xl border bg-white shadow-sm"
          >
            <div className="h-28 w-full bg-gray-50">
              <img
                src={
                  (img.secureUrl || img.url) && /^(https?:)?\/\//.test(img.secureUrl || img.url)
                    ? img.secureUrl || img.url
                    : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='112' viewBox='0 0 160 112' fill='none'%3E%3Crect width='160' height='112' fill='%23f5f5f4'/%3E%3Cpath d='M50 80c0-15 12-27 27-27h6c15 0 27 12 27 27' stroke='%23d4d4d4' stroke-width='10' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='80' cy='50' r='24' stroke='%23d4d4d4' stroke-width='10'/%3E%3C/svg%3E"
                }
                alt={img.alt || "Imagem do produto"}
                className="h-full w-full object-contain object-center"
                loading="lazy"
                width={160}
                height={112}
              />
            </div>
            <div className="flex flex-col gap-1 p-2 text-xs text-gray-700">
              <input
                value={img.alt || ""}
                onChange={(e) => updateAlt(img.id, e.target.value)}
                placeholder="Alt da imagem"
                className="w-full rounded border px-2 py-1 text-xs"
              />
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  className="rounded border px-2 py-1 hover:bg-gray-50"
                  aria-label="Mover para esquerda"
                  disabled={idx === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  className="rounded border px-2 py-1 hover:bg-gray-50"
                  aria-label="Mover para direita"
                  disabled={idx === images.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => makeCover(idx)}
                  className="rounded border px-2 py-1 hover:bg-amber-50"
                  aria-label="Definir como capa"
                  disabled={idx === 0}
                >
                  Capa
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(img.id)}
                  className="rounded border px-2 py-1 text-red-600 hover:bg-red-50"
                  aria-label="Remover imagem"
                >
                  Remover
                </button>
              </div>
            </div>
            {idx === 0 && (
              <span className="absolute left-2 top-2 rounded bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
                Capa
              </span>
            )}
          </div>
        ))}
        <label className="flex h-40 w-40 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-sm font-semibold text-gray-600 hover:border-amber-400 hover:text-amber-600">
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
          {uploading ? "Enviando..." : "+ Adicionar"}
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
