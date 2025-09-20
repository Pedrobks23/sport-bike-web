// src/utils/cloudinaryUrl.js
/**
 * Gera URL Cloudinary (c_fill, g_auto) quando possível.
 * Funciona com:
 *  - {publicId} + cloudName do .env
 *  - URL Cloudinary já completa (injeta as transforms)
 *  - Firebase Storage (retorna a própria URL)
 *  - string crua de URL (retorna como está)
 */
export function cldFill(img, { w = 600, h = 450, fmt = "auto", q = "auto" } = {}) {
  if (!img) return null;

  const isObj = typeof img === "object" && img !== null;
  const publicId = isObj ? img.publicId : undefined;
  const rawUrl =
    (isObj ? img.secure_url || img.url : undefined) ||
    (typeof img === "string" ? img : undefined);

  // 1) cloud do .env (se houver)
  const envCloud =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME) || "";
  if (publicId && envCloud) {
    return `https://res.cloudinary.com/${envCloud}/image/upload/w_${w},h_${h},c_fill,g_auto,f_${fmt},q_${q}/${publicId}.jpg`;
  }

  // 2) URL Cloudinary existente → injeta transform após /upload/
  const CLOUD_RE = /https?:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\//;
  if (rawUrl && CLOUD_RE.test(rawUrl)) {
    return rawUrl.replace(
      /\/upload\/(?!.*w_\d+)/,
      `/upload/w_${w},h_${h},c_fill,g_auto,f_${fmt},q_${q}/`
    );
  }

  // 3) Firebase Storage ou qualquer outra URL → retorna como está
  return rawUrl || null;
}

function firstImageCandidate(product) {
  if (!product) return null;
  if (product.imageUrl) return product.imageUrl;
  if (product.image) return product.image;
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }
  return null;
}

/**
 * Resolve uma URL de imagem para o produto fornecido utilizando `cldFill`.
 * Mantém compatibilidade com strings simples, objetos Cloudinary e URLs já transformadas.
 */
export function resolveProductImageUrl(product, opts = {}) {
  const candidate = firstImageCandidate(product);
  if (!candidate) return null;
  return cldFill(candidate, opts);
}
