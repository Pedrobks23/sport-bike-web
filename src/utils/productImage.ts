export type ImgVariant = "card" | "expanded" | "thumb"

const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

const TRANSFORMS: Record<ImgVariant, { w: number; h: number }> = {
  card: { w: 640, h: 480 },
  expanded: { w: 1200, h: 900 },
  thumb: { w: 256, h: 256 },
}

function sanitizeId(publicId?: string | null) {
  if (!publicId) return null
  return publicId.replace(/^\/+/, "")
}

export function productImgUrl(publicId: string, variant: ImgVariant): string {
  const cleanId = sanitizeId(publicId)
  if (!cleanId) return ""
  const cloud = CLOUD
  const { w, h } = TRANSFORMS[variant]
  if (cloud) {
    return `https://res.cloudinary.com/${cloud}/image/upload/w_${w},h_${h},c_fit,g_auto,f_auto,q_auto,dpr_2/${cleanId}.png`
  }
  return cleanId
}
