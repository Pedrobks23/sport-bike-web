export type ImgVariant = "card" | "expanded" | "thumb" | "modal"

const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

const TRANSFORMS: Record<ImgVariant, { w: number; h: number }> = {
  card: { w: 640, h: 480 },
  expanded: { w: 1200, h: 900 },
  thumb: { w: 256, h: 256 },
  modal: { w: 1200, h: 900 },
}

function sanitizeId(publicId?: string | null) {
  if (!publicId) return null
  return publicId.replace(/^\/+/, "")
}

const isHttpUrl = (value?: string | null) => Boolean(value && /^https?:\/\//i.test(value))

function encodePublicId(publicId: string) {
  return publicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

export function buildCldUrl(
  publicId: string,
  {
    w,
    h,
    fit = "fit",
    secureUrl,
  }: { w?: number; h?: number; fit?: "fit" | "pad"; secureUrl?: string } = {}
) {
  const cleanId = sanitizeId(publicId)
  if (!cleanId) return secureUrl || ""

  const encodedId = encodePublicId(cleanId)
  const cloud = CLOUD
  const baseFromSecure = secureUrl && secureUrl.includes("/upload/")
    ? secureUrl.split("/upload/")[0] + "/upload/"
    : null

  const base = baseFromSecure || (cloud ? `https://res.cloudinary.com/${cloud}/image/upload/` : null)
  if (!base) return secureUrl || ""

  const transforms = ["f_auto", "q_auto", "a_auto", `c_${fit}`, "dpr_2"]
  if (w) transforms.push(`w_${w}`)
  if (h) transforms.push(`h_${h}`)

  const transformation = transforms.join(",")
  return `${base}${transformation}/${encodedId}`
}

export function productImgUrl(publicId: string, variant: ImgVariant): string {
  const { w, h } = TRANSFORMS[variant]
  return buildCldUrl(publicId, { w, h, fit: "fit" })
}

function extractPublicIdFromUrl(url?: string | null) {
  if (!url || !url.includes("/upload/")) return null
  const [, rest] = url.split("/upload/")
  if (!rest) return null
  const parts = rest.split("/")
  // drop transformation segments (comma separated)
  while (parts.length && parts[0].includes(",")) {
    parts.shift()
  }
  return parts.join("/").replace(/^\/+/, "")
}

export type ProductImageInput =
  | string
  | {
      id?: string
      publicId?: string | null
      secureUrl?: string | null
      url?: string | null
      alt?: string | null
      [key: string]: any
    }

export type NormalizedProductImage = {
  id: string
  publicId?: string
  secureUrl?: string
  alt?: string
}

export function normalizeProductImages(images: ProductImageInput | ProductImageInput[] | null | undefined) {
  const list = Array.isArray(images)
    ? images
    : images
      ? [images]
      : []

  return list
    .map((img, idx) => {
      if (!img) return null
      if (typeof img === "string") {
        if (isHttpUrl(img)) {
          return {
            id: `img-${idx}`,
            secureUrl: img,
            publicId: extractPublicIdFromUrl(img) || undefined,
            alt: "Imagem do produto",
          }
        }
        return null
      }

      const secureUrl = isHttpUrl(img.secureUrl) ? img.secureUrl : isHttpUrl(img.url) ? img.url : undefined
      const publicId = sanitizeId(img.publicId || extractPublicIdFromUrl(secureUrl)) || undefined

      if (!publicId && !secureUrl) return null

      return {
        id: img.id || `img-${idx}`,
        publicId,
        secureUrl,
        alt: img.alt || undefined,
      }
    })
    .filter(Boolean) as NormalizedProductImage[]
}
