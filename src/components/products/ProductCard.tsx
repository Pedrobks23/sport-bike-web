// @ts-nocheck
import { useMemo, useState } from "react"
import { Star, Tag, MessageCircle } from "lucide-react"
import { cldFill } from "@/utils/cloudinaryUrl"

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

export default function ProductCard({ product, isXmas = false }) {
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const imgUrl = useMemo(() => {
    const img = typeof product?.image === "string" ? { url: product.image } : product?.image
    return cldFill(img, { w: 600, h: 600 })
  }, [product])

  const promoPrice = product?.promoPrice ?? product?.salePrice
  const hasPromoFlag = product?.promo === true || product?.promoNatal === true || product?.tags?.includes?.("natal")
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

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100" style={{ minHeight: 240 }}>
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={product?.name || "Produto"}
            loading="lazy"
            decoding="async"
            width={600}
            height={600}
            onLoad={() => setIsImageLoaded(true)}
            className={`h-64 w-full object-cover object-center transition duration-500 ease-out ${
              isImageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="flex h-64 w-full items-center justify-center text-sm text-gray-500">Sem imagem</div>
        )}
        {!isImageLoaded && imgUrl && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-300" aria-hidden />
        )}

        <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
          {isOnSale && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow">
              🎁 Oferta de Natal
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
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isXmas ? "bg-red-600 hover:bg-red-500 focus:ring-red-400" : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
            }`}
          >
            <MessageCircle className="h-4 w-4" /> Tenho interesse
          </button>
          <button
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-amber-400 hover:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            onClick={() => window.open(product?.link || buildWhatsappLink(product), "_blank")}
          >
            Ver detalhes
          </button>
        </div>
      </div>
    </article>
  )
}
