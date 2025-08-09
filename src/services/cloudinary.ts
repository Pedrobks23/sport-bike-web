/**
 * Cloudinary service (client-side)
 *
 * ENV (client):
 * - VITE_CLOUDINARY_CLOUD_NAME
 * - VITE_CLOUDINARY_UPLOAD_PRESET  (unsigned preset)
 *
 * Upload é UNSIGNED: sem secret no front.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

function ensureEnv() {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "[Cloudinary] Defina VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET nas envs."
    );
  }
}

export type UploadResult = {
  secureUrl: string;
  publicId: string;
};

export async function uploadImageToCloudinary(file: File): Promise<UploadResult> {
  ensureEnv();

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET!);

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`[Cloudinary] Falha no upload: ${res.status} ${res.statusText} ${txt}`);
  }

  const json = await res.json();
  if (!json?.secure_url || !json?.public_id) {
    throw new Error("[Cloudinary] Resposta inválida (secure_url/public_id ausentes).");
  }

  return { secureUrl: json.secure_url as string, publicId: json.public_id as string };
}

/** Injeta f_auto,q_auto,w_{width} após /upload/ em URLs Cloudinary */
export function optimizeCloudinaryUrl(secureUrl: string, width = 800): string {
  try {
    const u = new URL(secureUrl);
    if (!u.hostname.includes("res.cloudinary.com")) return secureUrl;

    const marker = "/upload/";
    const i = u.pathname.indexOf(marker);
    if (i === -1) return secureUrl;

    const before = u.pathname.slice(0, i + marker.length);
    const after = u.pathname.slice(i + marker.length);

    if (after.startsWith("f_auto") || after.startsWith("q_auto") || after.startsWith("w_")) {
      return secureUrl; // já possui transformações
    }

    u.pathname = `${before}f_auto,q_auto,w_${width}/${after}`;
    return u.toString();
  } catch {
    return secureUrl;
  }
}

export function isCloudinaryUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes("res.cloudinary.com");
  } catch {
    return false;
  }
}

/** Tenta extrair public_id de URL Cloudinary: /image/upload/.../folder/my_id.jpg → folder/my_id */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("res.cloudinary.com")) return null;

    const parts = u.pathname.split("/").filter(Boolean);
    const idxUpload = parts.findIndex((p) => p === "upload");
    if (idxUpload === -1) return null;

    const tail = parts.slice(idxUpload + 1);
    const cleaned = tail.filter((seg) => !/^v\d+$/i.test(seg) && !/^[a-z_]/i.test(seg));
    if (cleaned.length === 0) return null;

    const last = cleaned[cleaned.length - 1].replace(/\.[a-z0-9]+$/i, "");
    if (cleaned.length > 1) {
      const folder = cleaned.slice(0, -1).join("/");
      return `${folder}/${last}`;
    }
    return last;
  } catch {
    return null;
  }
}
