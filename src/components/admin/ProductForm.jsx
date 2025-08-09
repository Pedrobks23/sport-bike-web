import React, { useState, useEffect } from "react";
import {
  uploadImageToCloudinary,
  optimizeCloudinaryUrl,
  isCloudinaryUrl,
  extractPublicIdFromUrl
} from "../../services/cloudinary";

const ADMIN_API_TOKEN = import.meta.env.VITE_ADMIN_API_TOKEN; // opcional

export default function ProductForm({ onSubmit, initial, submitting }) {
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [visible, setVisible] = useState(true);
  const [mode, setMode] = useState("file"); // file | url
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");

  // Preview da imagem
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (initial) {
      setTitle(initial.title || "");
      setDesc(initial.description || "");
      setPriceInput(
        typeof initial.price === "number" ? String(initial.price).replace(".", ",") : (initial.price ?? "")
      );
      setVisible(!!initial.visible);
      setMode("url");
      setUrl(initial.imageUrl || "");
      setFile(null);
    } else {
      setTitle(""); setDesc(""); setPriceInput(""); setVisible(true);
      setMode("file"); setFile(null); setUrl("");
    }
  }, [initial]);

  // monta/desmonta preview
  useEffect(() => {
    let revokeUrl = null;
    if (mode === "file" && file) {
      const obj = URL.createObjectURL(file);
      setPreview(obj);
      revokeUrl = obj;
    } else if (mode === "url" && url) {
      setPreview(url);
    } else if (initial?.imageUrl) {
      setPreview(initial.imageUrl);
    } else {
      setPreview("");
    }
    return () => { if (revokeUrl) URL.revokeObjectURL(revokeUrl); };
  }, [mode, file, url, initial]);

  function parsePrice(input) {
    if (typeof input === "number") return input;
    const norm = String(input || "").replace(/\./g, "").replace(",", ".");
    const num = Number(norm);
    return Number.isFinite(num) ? num : 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const price = parsePrice(priceInput);

    let imageUrl = initial?.imageUrl || "";
    let imageUrlCard = initial?.imageUrlCard || "";
    let publicId = initial?.publicId ?? null;
    let changedImage = false;

    if (mode === "file") {
      if (!file && !initial) throw new Error("Selecione um arquivo de imagem.");
      if (file) {
        const { secureUrl, publicId: pid } = await uploadImageToCloudinary(file);
        imageUrl = secureUrl;
        imageUrlCard = optimizeCloudinaryUrl(secureUrl, 800);
        publicId = pid;
        changedImage = true;
      }
    } else {
      if (!url.trim()) throw new Error("Informe a URL da imagem.");
      if (url.trim() !== initial?.imageUrl) changedImage = true;
      imageUrl = url.trim();
      if (isCloudinaryUrl(imageUrl)) {
        imageUrlCard = optimizeCloudinaryUrl(imageUrl, 800);
        publicId = extractPublicIdFromUrl(imageUrl);
      } else {
        imageUrlCard = imageUrl;
        publicId = null;
      }
    }

    onSubmit({
      changedImage,
      data: {
        title: title.trim(),
        description: description.trim(),
        price,
        visible,
        imageUrl,
        imageUrlCard,
        publicId: publicId || null,
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">{initial ? "Editar produto" : "Novo produto"}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Título</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Bicicleta Aro 29"
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Preço</label>
          <input
            className="input"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            placeholder="Ex.: 1200,00"
            inputMode="decimal"
          />
        </div>

        <div className="grid gap-2 md:col-span-2">
          <label className="text-sm font-medium">Descrição</label>
          <textarea
            className="input min-h-[90px]"
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Detalhes do produto"
          />
        </div>

        <div className="grid gap-2 md:col-span-2">
          <label className="text-sm font-medium">Imagem</label>

          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("file")}
              className={`btn ${mode === "file" ? "btn-primary" : "btn-outline"}`}>Arquivo</button>
            <button type="button" onClick={() => setMode("url")}
              className={`btn ${mode === "url" ? "btn-primary" : "btn-outline"}`}>URL</button>
          </div>

          {mode === "file" ? (
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input" />
          ) : (
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="input" />
          )}

          {/* Preview */}
          <div className="mt-3 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-800">
            <div className="aspect-video">
              {preview ? (
                <img src={preview} alt="Pré-visualização" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-neutral-500 text-sm">Sem pré-visualização</div>
              )}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          <span className="text-sm">Visível na Home</span>
        </label>
      </div>

      <div className="flex gap-3 mt-5">
        <button type="submit" disabled={submitting} className="btn btn-success">
          {initial ? (submitting ? "Salvando..." : "Salvar alterações") : (submitting ? "Criando..." : "Criar produto")}
        </button>
        {initial && <button type="button" className="btn btn-ghost" onClick={() => onSubmit({ cancel: true })}>Cancelar</button>}
      </div>
    </form>
  );
}

/* Tailwind helpers (adicione no CSS global, se ainda não estiverem):
.input { @apply border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring focus:ring-blue-500/30; }
.btn { @apply px-3 py-2 rounded-xl border transition; }
.btn-outline { @apply border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800; }
.btn-primary { @apply border-blue-600 bg-blue-600 text-white hover:bg-blue-700; }
.btn-success { @apply border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700; }
.btn-ghost { @apply border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800; }
*/
