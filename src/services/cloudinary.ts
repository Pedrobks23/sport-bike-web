/*
  Client-side Cloudinary helpers.
  Environment variables (set in .env and Vercel):
  VITE_CLOUDINARY_CLOUD_NAME=SEU_CLOUD_NAME
  VITE_CLOUDINARY_UPLOAD_PRESET=SEU_PRESET_UNSIGNED
  (Optional) VITE_ADMIN_API_TOKEN=TOKEN_MATCHING_SERVER
*/

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!cloudName || !uploadPreset) {
  throw new Error('Cloudinary environment variables are missing');
}

export async function uploadImageToCloudinary(file: File): Promise<{ secureUrl: string; publicId: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    throw new Error('Falha no upload para Cloudinary');
  }
  const json = await res.json();
  return { secureUrl: json.secure_url, publicId: json.public_id };
}

export function optimizeCloudinaryUrl(secureUrl: string, width = 800): string {
  if (!secureUrl) return secureUrl;
  return secureUrl.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}

export function isCloudinaryUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes('res.cloudinary.com');
  } catch {
    return false;
  }
}

export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(/\/upload\/(?:v\d+\/)?([^\.]+)\.[a-zA-Z0-9]+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
