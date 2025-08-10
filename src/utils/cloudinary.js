// src/lib/cloudinary.js
export async function signUpload({ folder }) {
  const resp = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  if (!resp.ok) throw new Error("Falha ao assinar upload");
  return resp.json();
}

/**
 * Faz upload de arquivo para o Cloudinary.
 * Retorna o JSON do Cloudinary (secure_url, public_id, width, height, etc).
 */
export async function uploadToCloudinary(file, { folder } = {}) {
  const { timestamp, signature, cloudName, apiKey, folder: signedFolder } = await signUpload({ folder });

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", signedFolder);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const resp = await fetch(endpoint, { method: "POST", body: form });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Cloudinary upload error: ${err}`);
  }
  return resp.json();
}

export async function destroyFromCloudinary(publicId) {
  const resp = await fetch("/api/cloudinary/destroy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Falha ao deletar no Cloudinary: ${err}`);
  }
  return resp.json();
}
