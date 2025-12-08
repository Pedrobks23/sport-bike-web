// @ts-nocheck
import { useEffect, useMemo, useState } from "react"
import { X, MessageCircle, ChevronLeft, ChevronRight, Star } from "lucide-react"
import { productImgUrl } from "@/utils/productImage"

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || "558532677425"

function formatBRL(value) {
  const num = Number(String(value ?? "").toString().replace(/[^\d,.-]/g, "").replace(",", ".") || 0)
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function buildWhatsappLink(product) {
  const msg =
    `Olá! Gostaria de saber mais sobre o produto: ${product?.name || "Produto"}.\n` +
    `Preço atual: ${formatBRL(product?.price || product?.promoPrice || 0)}\n` +
    (product?.category ? `Categoria: ${product.category}\n` : "") +
    "Me envie mais detalhes, por favor."

  return `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(
    msg
  )}&type=phone_number&app_absent=0`
}

export default function ProductQuickView({ product, isXmas, prefersReducedMotion, onClose }) {
  const [activeIndex, setActiveIndex] = useState(0)

  const images = useMemo(() => {
    const base = Array.isArray(product?.images) ? product.images : []
    const legacy = product?.image ? [product.image] : []
    const merged = [...base, ...legacy].filter(Boolean)
    if (!merged.length) return []
    return merged.map((img, idx) => {
      if (typeof img === "string") return { id: `img-${idx}`, url: img }
      return { id: img.id || `img-${idx}`, ...img }
    })
  }, [product])

  const activeImage = images[activeIndex] || images[0]

  const heroUrl = useMemo(() => {
    if (!activeImage) return null
    if (activeImage.publicId) return productImgUrl(activeImage.publicId, "expanded")
    return activeImage.url || null
  }, [activeImage])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.()
      if (images.length > 1 && !prefersReducedMotion) {
        if (e.key === "ArrowRight") setActiveIndex((prev) => (prev + 1) % images.length)
        if (e.key === "ArrowLeft") setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
      }
    }
    window.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [images.length, prefersReducedMotion, onClose])

  if (!product) return null

  const promoPrice = product?.promoPrice ?? product?.salePrice
  const hasPromoFlag = product?.promo === true || product?.promoNatal === true || product?.tags?.includes?.("natal")
  const isOnSale = Boolean(hasPromoFlag || (promoPrice && Number(promoPrice) < Number(product?.price || promoPrice)))
  const displayPrice = promoPrice && Number(promoPrice) < Number(product?.price || promoPrice) ? promoPrice : product?.price
  const previousPrice = promoPrice && Number(promoPrice) < Number(product?.price || promoPrice)
    ? product?.price
    : product?.oldPrice || product?.previousPrice

  const rating = Number(product?.rating || product?.stars || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="relative grid w-full max-w-5xl gap-6 rounded-3xl bg-white p-6 shadow-2xl lg:grid-cols-2">
        <button
          className="absolute right-3 top-3 rounded-full bg-red-500 p-2 text-white shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Fechar"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
            {heroUrl ? (
              <img
                src={heroUrl}
                alt={activeImage?.alt || product?.name || "Produto"}
                className="h-[320px] w-full object-cover md:h-[420px]"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-gray-500">Sem imagem</div>
            )}
            {images.length > 1 && (
              <div className="absolute left-0 right-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-3">
                <button
                  className="rounded-full bg-white/85 p-2 shadow hover:bg-white"
                  onClick={() => setActiveIndex((prev) => (prev - 1 + images.length) % images.length)}
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  className="rounded-full bg-white/85 p-2 shadow hover:bg-white"
                  onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)}
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
            {images.length > 1 && (
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    className={`h-2.5 w-2.5 rounded-full border border-white transition ${idx === activeIndex ? "bg-white" : "bg-white/60"}`}
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Mostrar imagem ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Produto</p>
            <h2 className="text-2xl font-bold text-gray-900">{product?.name || "Produto"}</h2>
            {product?.category && <p className="text-sm text-gray-600">{product.category}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold text-gray-900">{formatBRL(displayPrice)}</span>
              {previousPrice && <span className="text-sm text-gray-500 line-through">{formatBRL(previousPrice)}</span>}
            </div>
            {isOnSale && (
              <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isXmas ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                Oferta de Natal
              </span>
            )}
            {product?.installments && <p className="text-sm text-gray-600">{product.installments}</p>}
            {rating > 0 && (
              <div className="flex items-center gap-1 text-amber-500" aria-label={`Avaliação ${rating} de 5`}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className={`h-4 w-4 ${idx < rating ? "fill-amber-500" : "stroke-amber-300"}`} />
                ))}
                <span className="text-xs text-gray-600">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {product?.description && (
            <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">{product.description}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.open(buildWhatsappLink(product), "_blank")}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isXmas ? "bg-red-600 hover:bg-red-500 focus:ring-red-400" : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
              }`}
            >
              <MessageCircle className="h-4 w-4" /> Tenho interesse
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-800 transition hover:border-amber-400 hover:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
