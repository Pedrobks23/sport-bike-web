/**
 * Cloudinary service (client-side, Vite)
 *
 * ENV necessárias (client):
 * - VITE_CLOUDINARY_CLOUD_NAME=SEU_CLOUD_NAME
 * - VITE_CLOUDINARY_UPLOAD_PRESET=SEU_PRESET_UNSIGNED
 *
 * Observações:
 * - Upload é UNSIGNED (apenas cloud_name + upload_preset).
 * - NÃO usa API secret no front.
 * - optimizeCloudinaryUrl injeta transformações após /upload/.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

function ensureEnv() {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "[Cloudinary] Variáveis de ambiente ausentes. Defina VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET."
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

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`[Cloudinary] Falha no upload: ${res.status} ${res.statusText} ${txt}`);
  }

  const json = await res.json();
  if (!json?.secure_url || !json?.public_id) {
    throw new Error("[Cloudinary] Resposta inválida no upload (secure_url/public_id ausentes).");
  }

  return {
    secureUrl: json.secure_url as string,
    publicId: json.public_id as string,
  };
}

export function optimizeCloudinaryUrl(secureUrl: string, width = 800): string {
  try {
    const u = new URL(secureUrl);
    // Só transforma se for Cloudinary
    if (!u.hostname.includes("res.cloudinary.com")) return secureUrl;

    // Injeta f_auto,q_auto,w_{width} depois de /upload/
    // Casos com transformações prévias continuarão válidos; aqui forçamos nosso preset básico como primeira transformação.
    const marker = "/upload/";
    const i = u.pathname.indexOf(marker);
    if (i === -1) return secureUrl;

    const before = u.pathname.slice(0, i + marker.length); // inclui "/upload/"
    const after = u.pathname.slice(i + marker.length);     // resto

    const injection = `f_auto,q_auto,w_${width}/`;

    // Evitar duplicar se já houve injeção igual
    if (after.startsWith("f_auto") || after.startsWith("q_auto") || after.startsWith("w_")) {
      return secureUrl; // já tem alguma transformação no começo
    }

    u.pathname = `${before}${injection}${after}`;
    return u.toString();
  } catch {
    return secureUrl;
  }
}

export function isCloudinaryUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes("res.cloudinary.com");
  } catch {
    return false;
  }
}

/**
 * Tentativa best-effort de extrair public_id de uma URL Cloudinary:
 * Formatos típicos:
 *  - /image/upload/v1712345678/folder/subfolder/my_public_id.jpg
 *  - /image/upload/f_auto,q_auto,w_800/v1712345678/my_public_id.png
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("res.cloudinary.com")) return null;

    const parts = u.pathname.split("/").filter(Boolean); // remove vazios
    // Procurar pelo índice de "upload"
    const idxUpload = parts.findIndex((p) => p === "upload");
    if (idxUpload === -1) return null;

    // Tudo depois de "upload" pode conter transformações e/ou versão (v123...)
    const tail = parts.slice(idxUpload + 1);

    // Remove transformações (começam com letras e underline, ex: f_auto,q_auto,w_800)
    // e remove "versão" (v\d+)
    const cleaned = tail.filter((seg) => !/^v\d+$/i.test(seg) && !/^[a-z_]/i.test(seg));

    if (cleaned.length === 0) return null;

    // O(s) último(s) segmento(s) representam o public_id com pasta. Precisamos remover extensão.
    const last = cleaned[cleaned.length - 1];
    const withoutExt = last.replace(/\.[a-z0-9]+$/i, "");

    // Se existem pastas (folder/my_id), devemos incluí-las:
    if (cleaned.length > 1) {
      const folder = cleaned.slice(0, cleaned.length - 1).join("/");
      return `${folder}/${withoutExt}`;
    }
    return withoutExt;
  } catch {
    return null;
  }
}

