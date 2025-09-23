type ImgLike =
  | { publicId?: string; url?: string; secure_url?: string }
  | string
  | null
  | undefined;

export function cldFill(
  img: ImgLike,
  opts: { w?: number; h?: number; q?: string | number; fmt?: string } = {}
): string | null {
  const { w = 640, h = 480, q = "auto", fmt = "auto" } = opts;
  if (!img) return null;

  const isObj = typeof img === "object" && img !== null;
  const publicId = isObj ? (img as any).publicId : undefined;
  const rawUrl =
    (isObj ? ((img as any).secure_url || (img as any).url) : undefined) ||
    (typeof img === "string" ? img : undefined);

  const cloud = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME) || "";

  // 1) publicId + cloud do env
  if (publicId && cloud) {
    return `https://res.cloudinary.com/${cloud}/image/upload/w_${w},h_${h},c_fill,g_auto,f_${fmt},q_${q}/${publicId}.jpg`;
  }

  // 2) URL Cloudinary existente -> injeta transform
  if (rawUrl && /https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(rawUrl)) {
    return rawUrl.replace(/\/upload\/(?!.*w_\d+)/, `/upload/w_${w},h_${h},c_fill,g_auto,f_${fmt},q_${q}/`);
  }

  // 3) Qualquer outra URL -> retorna como está
  return rawUrl || null;
}

