/**
 * Cloudinary service utilities
 *
 * Required client-side env vars (.env and Vercel):
 * VITE_CLOUDINARY_CLOUD_NAME=SEU_CLOUD_NAME
 * VITE_CLOUDINARY_UPLOAD_PRESET=SEU_PRESET_UNSIGNED
 */

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

if (!cloudName || !uploadPreset) {
  throw new Error(
    'Cloudinary env vars missing: VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET'
  )
}

export async function uploadImageToCloudinary(
  file: File
): Promise<{ secureUrl: string; publicId: string }> {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', uploadPreset)

  const res = await fetch(url, {
    method: 'POST',
    body: form,
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error?.message || 'Falha no upload para o Cloudinary')
  }
  return { secureUrl: json.secure_url, publicId: json.public_id }
}

export function optimizeCloudinaryUrl(secureUrl: string, width = 800) {
  return secureUrl.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`)
}

export function isCloudinaryUrl(url: string): boolean {
  try {
    const { host } = new URL(url)
    return host.includes('res.cloudinary.com')
  } catch {
    return false
  }
}

export function extractPublicIdFromUrl(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null
  try {
    const path = new URL(url).pathname
    const afterUpload = path.split('/upload/')[1]
    if (!afterUpload) return null
    // Remove transformations and version segments
    const parts = afterUpload.split('/')
    while (parts[0] && (parts[0].includes(',') || parts[0].startsWith('v'))) {
      parts.shift()
    }
    const idWithExt = parts.join('/')
    return idWithExt.replace(/\.[^/.]+$/, '') || null
  } catch {
    return null
  }
}
