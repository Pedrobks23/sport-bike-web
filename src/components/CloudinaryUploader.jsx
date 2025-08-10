// src/components/CloudinaryUploader.jsx
import { useState } from "react";
import { uploadToCloudinary, destroyFromCloudinary } from "@/utils/cloudinary";

export default function CloudinaryUploader({ value, onChange, folder = "sportbike/featured" }) {
  // value: { url, publicId, width, height } | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      const res = await uploadToCloudinary(file, { folder });
      onChange?.({
        url: res.secure_url,
        publicId: res.public_id,
        width: res.width,
        height: res.height,
      });
    } catch (err) {
      setError(err.message || "Falha no upload");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (!value?.publicId) {
      onChange?.(null);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await destroyFromCloudinary(value.publicId);
      onChange?.(null);
    } catch (err) {
      setError(err.message || "Falha ao remover");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {value?.url ? (
        <div className="flex items-center gap-4">
          <img
            src={value.url}
            alt="Preview"
            className="h-24 w-24 object-cover rounded-lg border"
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-2 rounded-lg bg-red-600 text-white hover:opacity-90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Removendo..." : "Remover imagem"}
            </button>
            <p className="text-xs text-gray-500 break-all">{value.publicId}</p>
          </div>
        </div>
      ) : (
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white hover:opacity-90 cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={loading} />
          {loading ? "Enviando..." : "Enviar imagem"}
        </label>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
