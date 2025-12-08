import { useMemo, useState } from "react"
import { buildCldUrl, normalizeProductImages, type ImgVariant } from "@/utils/productImage"

const ROLE_TO_VARIANT: Record<string, ImgVariant> = {
  card: "card",
  carousel: "card",
  modal: "modal",
  thumb: "thumb",
}

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480' fill='none'%3E%3Crect width='640' height='480' fill='%23f5f5f4'/%3E%3Cpath d='M200 330c0-44.183 35.817-80 80-80h80c44.183 0 80 35.817 80 80' stroke='%23d4d4d4' stroke-width='24' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='320' cy='210' r='70' stroke='%23d4d4d4' stroke-width='24'/%3E%3C/svg%3E"

export type ProductImageProps = {
  publicId?: string | null
  secureUrl?: string | null
  alt?: string
  role?: "card" | "carousel" | "modal" | "thumb"
  className?: string
  wrapperClassName?: string
  onLoad?: () => void
}

export function ProductImage({
  publicId,
  secureUrl,
  alt = "Imagem do produto",
  role = "card",
  className = "",
  wrapperClassName = "",
  onLoad,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false)

  const variant = ROLE_TO_VARIANT[role] || "card"

  const src = useMemo(() => {
    if (!publicId && secureUrl) return secureUrl
    if (!publicId && !secureUrl) return PLACEHOLDER
    return buildCldUrl(publicId || "", {
      w: variant === "modal" ? 1200 : variant === "thumb" ? 256 : 640,
      h: variant === "modal" ? 900 : variant === "thumb" ? 256 : 480,
      fit: "fit",
      secureUrl: secureUrl ?? undefined,
    })
  }, [publicId, secureUrl, variant])

  const displaySrc = hasError ? PLACEHOLDER : src

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 ${wrapperClassName}`}
      aria-hidden={false}
    >
      <img
        src={displaySrc}
        alt={alt}
        className={`h-full w-full object-contain object-center ${className}`}
        loading="lazy"
        decoding="async"
        onLoad={onLoad}
        onError={() => setHasError(true)}
      />
    </div>
  )
}

export function normalizeCoverImage(product: any) {
  const normalized = normalizeProductImages(product?.images || product?.image || [])
  if (normalized.length) return normalized[0]
  return null
}
