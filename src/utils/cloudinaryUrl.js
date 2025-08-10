// src/utils/cloudinaryUrl.js
/**
 * Gera URL transformada do Cloudinary com foco automático.
 * Prioriza publicId; se não houver, cai no .url original.
 */
export function cldFill(img, { w = 600, h = 450, fmt = "auto", q = "auto" } = {}) {
  if (!img) return null;

  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const publicId = img?.publicId;

  if (publicId && cloud) {
    // c_fill + g_auto = corta centralizando o assunto (melhor para verticais)
    return `https://res.cloudinary.com/${cloud}/image/upload/w_${w},h_${h},c_fill,g_auto,f_${fmt},q_${q}/${publicId}.jpg`;
  }

  // Fallback: se só tiver URL direto (produto antigo)
  return img?.url || (typeof img === "string" ? img : null);
}
