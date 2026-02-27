// @ts-nocheck
import { useEffect, useId, useMemo, useState } from "react"
import { X, MessageCircle, ChevronLeft, ChevronRight, Star } from "lucide-react"
import { doc, onSnapshot } from "firebase/firestore"
import { normalizeProductImages } from "@/utils/productImage"
import { ProductImage } from "@/components/shared/ProductImage"
import { getProductFeatures } from "@/utils/productFeatures"
import { db } from "@/config/firebase"

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

export default function ProductQuickView({ product, prefersReducedMotion, onClose }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [showAllFeatures, setShowAllFeatures] = useState(false)
  const titleId = useId()
  const [liveProduct, setLiveProduct] = useState(null)

  useEffect(() => {
    if (!product?.id) return
    const ref = doc(db, "products", product.id)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data()
        setLiveProduct(data ? { id: snap.id, ...data } : null)
      },
      (err) => {
        console.warn("[ProductQuickView] snapshot error", err?.message || err)
      }
    )
    return () => unsub()
  }, [product?.id])

  const productData = liveProduct ?? product

  const images = useMemo(() => {
    const base = normalizeProductImages(productData?.images || [])
    const legacy = normalizeProductImages(productData?.image ? [productData.image] : [])
    const merged = [...base, ...legacy]
    const seen = new Set()
    return merged.filter((img) => {
      const key = img.publicId || img.secureUrl || img.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [productData])

  const features = useMemo(() => getProductFeatures(productData, 20), [productData])
  const displayFeatures = showAllFeatures ? features : features.slice(0, 8)
  const hasMoreFeatures = features.length > displayFeatures.length

  const activeImage = images[activeIndex] || images[0]

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

  useEffect(() => {
    if (activeIndex >= images.length) setActiveIndex(0)
  }, [images.length, activeIndex])

  if (!productData) return null

  const promoPrice = productData?.promoPrice ?? productData?.salePrice
  const hasPromoFlag = productData?.promo === true
  const isOnSale = Boolean(hasPromoFlag || (promoPrice && Number(promoPrice) < Number(productData?.price || promoPrice)))
  const displayPrice =
    promoPrice && Number(promoPrice) < Number(productData?.price || promoPrice) ? promoPrice : productData?.price
  const previousPrice = promoPrice && Number(promoPrice) < Number(productData?.price || promoPrice)
    ? productData?.price
    : productData?.oldPrice || productData?.previousPrice

  const rating = Number(productData?.rating || productData?.stars || 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="relative w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-950">
        <button
          className="absolute right-3 top-3 z-10 rounded-full bg-red-500 p-2 text-white shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Fechar"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex max-h-[90vh] flex-col">
          <div className="grid flex-1 gap-6 overflow-y-auto p-5 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
            <div className="flex flex-col gap-3">
              <div className="relative w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900 lg:h-[420px] sm:h-[360px] h-[300px]">
                <ProductImage
                  publicId={activeImage?.publicId}
                  secureUrl={activeImage?.secureUrl}
                  alt={activeImage?.alt || productData?.name || "Produto"}
                  role="modal"
                />
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
                        key={img.id || idx}
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
                <h2 id={titleId} className="text-2xl font-bold text-gray-900 dark:text-white">
                  {productData?.name || "Produto"}
                </h2>
                {productData?.category && (
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-100">
                    {productData.category}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{formatBRL(displayPrice)}</span>
                  {previousPrice && <span className="text-sm text-gray-500 line-through">{formatBRL(previousPrice)}</span>}
                </div>
                {isOnSale && (
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Oferta
                  </span>
                )}
                {product?.installments && <p className="text-sm text-gray-600 dark:text-gray-200">{product.installments}</p>}
                {rating > 0 && (
                  <div className="flex items-center gap-1 text-blue-500" aria-label={`Avaliação ${rating} de 5`}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={`h-4 w-4 ${idx < rating ? "fill-blue-500" : "stroke-blue-300"}`} />
                    ))}
                    <span className="text-xs text-gray-600 dark:text-gray-200">{rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {productData?.description && (
                <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-900/70 dark:text-gray-100">
                  {productData.description}
                </p>
              )}

              {features.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Sobre este item</h3>
                    <span className="text-xs text-gray-500">{features.length} itens</span>
                  </div>
                  <ul className="mt-3 list-disc space-y-1.5 pl-6 text-[15px] leading-6 text-gray-800 dark:text-gray-100">
                    {displayFeatures.map((feat, idx) => (
                      <li key={idx}>{feat}</li>
                    ))}
                  </ul>
                  {hasMoreFeatures && (
                    <button
                      type="button"
                      onClick={() => setShowAllFeatures((prev) => !prev)}
                      className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 focus:outline-none"
                    >
                      {showAllFeatures ? "Ver menos" : "Ver mais"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-gray-100 bg-white/95 px-5 py-4 shadow-inner backdrop-blur supports-[backdrop-filter]:bg-white/85 dark:border-gray-800 dark:bg-neutral-950/90 lg:flex-row">
            <button
              onClick={() => window.open(buildWhatsappLink(productData), "_blank")}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2 bg-green-600 hover:bg-green-700 focus:ring-green-500"
          >
              <MessageCircle className="h-4 w-4" /> Tenho interesse
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-800 transition hover:border-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:border-gray-800 dark:text-gray-100"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
