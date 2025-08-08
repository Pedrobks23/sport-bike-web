/**
 * Configurar as variáveis de ambiente antes de executar:
 *
 * Local (.env)
 * VITE_CLOUDINARY_CLOUD_NAME=SEU_CLOUD_NAME
 * VITE_CLOUDINARY_UPLOAD_PRESET=SEU_PRESET_UNSIGNED
 *
 * Vercel -> Project -> Settings -> Environment Variables
 * use os mesmos nomes/valores em Production e Preview e faça o redeploy.
 */

export const uploadImageToCloudinary = async (
  file: File,
): Promise<{ secureUrl: string; publicId: string }> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are missing')
  }
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  const res = await fetch(url, { method: 'POST', body: formData })
  if (!res.ok) {
    throw new Error('Failed to upload image to Cloudinary')
  }
  const data = await res.json()
  return { secureUrl: data.secure_url as string, publicId: data.public_id as string }
}

export const optimizeCloudinaryUrl = (secureUrl: string, width = 800): string => {
  if (!secureUrl) return secureUrl
  return secureUrl.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`)
}

export const isCloudinaryUrl = (url: string): boolean => {
  try {
    return new URL(url).hostname.includes('res.cloudinary.com')
  } catch {
    return false
  }
}

export const extractPublicIdFromUrl = (url: string): string | null => {
  if (!isCloudinaryUrl(url)) return null
  const match = url.match(/\/upload\/.*\/([^/.]+)(?:\.[a-zA-Z0-9]+)?$/)
  return match ? match[1] : null
}

