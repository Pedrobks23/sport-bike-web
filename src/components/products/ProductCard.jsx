import { useEffect, useMemo, useRef, useState } from "react"
import { Star, Tag, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { normalizeProductImages } from "@/utils/productImage"
import { ProductImage } from "@/components/shared/ProductImage"

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

export default function ProductCard({ product, prefersReducedMotion = false, onOpenQuickView }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const cardRef = useRef(null)

  const images = useMemo(() => {
    const base = normalizeProductImages(product?.images || [])
    const legacy = normalizeProductImages(product?.image ? [product.image] : [])
    const merged = [...base, ...legacy]
    if (!merged.length) return []
    const seen = new Set()
    return merged.filter((img) => {
      const key = img.publicId || img.secureUrl || img.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [product])

  const activeImage = images[activeIndex] || images[0]

  useEffect(() => {
    setIsImageLoaded(false)
  }, [activeImage?.publicId, activeImage?.secureUrl])

  const promoPrice = product?.promoPrice ?? product?.salePrice
  const hasPromoFlag = product?.promo === true
  const isOnSale = Boolean(
    hasPromoFlag || (promoPrice && Number(promoPrice) < Number(product?.price || promoPrice))
  )
  const displayPrice = promoPrice && Number(promoPrice) < Number(product?.price || promoPrice)
    ? promoPrice
    : product?.price
  const previousPrice = promoPrice && Number(promoPrice) < Number(product?.price || promoPrice)
    ? product?.price
    : product?.oldPrice || product?.previousPrice

  const rating = Number(product?.rating || product?.stars || 0)

  useEffect(() => {
    if (!cardRef.current) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry?.isIntersecting !== false)
      },
      { threshold: 0.25 }
    )
    obs.observe(cardRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return
    if (!images.length || images.length < 2) return
    if (!isVisible || isHovered) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length)
      setIsImageLoaded(false)
    }, 3500)
    return () => clearInterval(timer)
  }, [images.length, isHovered, isVisible, prefersReducedMotion])

  useEffect(() => {
    if (activeIndex >= images.length) setActiveIndex(0)
  }, [images.length, activeIndex])

  return (
    <article
      ref={cardRef}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative flex h-56 w-full items-center justify-center overflow-hidden bg-neutral-100 transition sm:h-64 dark:bg-neutral-900"
        onClick={() => onOpenQuickView?.(product)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onOpenQuickView?.(product)
          }
        }}
        aria-label={`Abrir detalhes rápidos de ${product?.name || "produto"}`}
      >
        <ProductImage
          publicId={activeImage?.publicId}
          secureUrl={activeImage?.secureUrl}
          alt={activeImage?.alt || product?.name || "Produto"}
          role="card"
          wrapperClassName={`transition duration-500 ease-out ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setIsImageLoaded(true)}
        />
        {!isImageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-300" aria-hidden />
        )}

        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                className={`h-2.5 w-2.5 rounded-full border border-white transition ${
                  idx === activeIndex ? "bg-white" : "bg-white/50"
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setActiveIndex(idx)
                  setIsImageLoaded(false)
                }}
                aria-label={`Mostrar imagem ${idx + 1}`}
              />
            ))}
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-700 shadow transition hover:bg-white"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsImageLoaded(false)
                setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
              }}
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-700 shadow transition hover:bg-white"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsImageLoaded(false)
                setActiveIndex((prev) => (prev + 1) % images.length)
              }}
              aria-label="Próxima imagem"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
          {isOnSale && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow">
              Oferta
            </span>
          )}
          {product?.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs text-gray-800 shadow">
              <Tag className="h-3.5 w-3.5" /> {product.category}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-lg font-semibold text-gray-900">{product?.name || "Produto"}</h3>
          {product?.description && (
            <p className="line-clamp-2 text-sm text-gray-600">{product.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-gray-900">{formatBRL(displayPrice)}</span>
            {previousPrice && (
              <span className="text-sm text-gray-500 line-through">{formatBRL(previousPrice)}</span>
            )}
          </div>
          {product?.installments && (
            <p className="text-xs text-gray-500">{product.installments}</p>
          )}
          {rating > 0 && (
            <div className="flex items-center gap-1 text-amber-500" aria-label={`Avaliação ${rating} de 5`}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} className={`h-4 w-4 ${idx < rating ? "fill-amber-500" : "stroke-amber-300"}`} />
              ))}
              <span className="text-xs text-gray-600">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={() => window.open(buildWhatsappLink(product), "_blank")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2 bg-green-600 hover:bg-green-700 focus:ring-green-500"
          >
            <MessageCircle className="h-4 w-4" /> Tenho interesse
          </button>
          <button
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-amber-400 hover:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            onClick={(e) => {
              e.stopPropagation()
              if (onOpenQuickView) {
                onOpenQuickView(product)
                return
              }
              window.open(product?.link || buildWhatsappLink(product), "_blank")
            }}
          >
            Ver detalhes
          </button>
        </div>
      </div>
    </article>
  )
}
