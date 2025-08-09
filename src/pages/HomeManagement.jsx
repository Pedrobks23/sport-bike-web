/**
 * HomeManagement.jsx
 *
 * - CRUD de "featured" no Firestore.
 * - Imagem por arquivo (upload Cloudinary unsigned) OU URL colada.
 * - Salva: title, description, price (number), visible (boolean),
 *          imageUrl, imageUrlCard, publicId, createdAt, updatedAt.
 * - Ao editar e trocar imagem: se tinha publicId antigo, deleta via /api/cloudinary-delete.
 * - Ao remover item: se tiver publicId, deleta via /api/cloudinary-delete e depois apaga o doc.
 *
 * ENV (client):
 * - VITE_CLOUDINARY_CLOUD_NAME
 * - VITE_CLOUDINARY_UPLOAD_PRESET
 * - VITE_ADMIN_API_TOKEN (opcional; para Authorization da deleção)
 *
 * IMPORTANTE: Remover totalmente o uso de Firebase Storage nesta tela.
 */

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  uploadImageToCloudinary,
  optimizeCloudinaryUrl,
  isCloudinaryUrl,
  extractPublicIdFromUrl,
} from "../services/cloudinary";

const ADMIN_API_TOKEN = import.meta.env.VITE_ADMIN_API_TOKEN; // opcional

function fmtBRL(n) {
  const v = Number(n || 0);
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parsePrice(input) {
  if (typeof input === "number") return input;
  const norm = String(input || "").replace(/\./g, "").replace(",", ".");
  const num = Number(norm);
  return Number.isFinite(num) ? num : 0;
}

export default function HomeManagement() {
  const [items, setItems] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [visible, setVisible] = useState(true);

  const [imageMode, setImageMode] = useState("file"); // "file" | "url"
  const [file, setFile] = useState(null);
  const [urlInput, setUrlInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const q = query(collection(db, "featured"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDesc("");
    setPriceInput("");
    setVisible(true);
    setImageMode("file");
    setFile(null);
    setUrlInput("");
    setErr("");
  }

  async function callDeleteOnServer(publicId) {
    if (!publicId) return { ok: true };
    const res = await fetch("/api/cloudinary-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ADMIN_API_TOKEN ? { Authorization: `Bearer ${ADMIN_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ publicId }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Falha ao deletar no Cloudinary: ${res.status} ${res.statusText} ${t}`);
    }
    return res.json();
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    setErr("");
    setLoading(true);
    try {
      const price = parsePrice(priceInput);

      let imageUrl = "";
      let imageUrlCard = "";
      let publicId = null;

      if (imageMode === "file") {
        if (!file) throw new Error("Selecione um arquivo de imagem.");
        const { secureUrl, publicId: pid } = await uploadImageToCloudinary(file);
        imageUrl = secureUrl;
        imageUrlCard = optimizeCloudinaryUrl(secureUrl, 800);
        publicId = pid;
      } else {
        if (!urlInput.trim()) throw new Error("Informe a URL da imagem.");
        imageUrl = urlInput.trim();
        if (isCloudinaryUrl(imageUrl)) {
          imageUrlCard = optimizeCloudinaryUrl(imageUrl, 800);
          publicId = extractPublicIdFromUrl(imageUrl); // best-effort
        } else {
          imageUrlCard = imageUrl; // fallback
          publicId = null;
        }
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        price,
        visible: !!visible,
        imageUrl,
        imageUrlCard: imageUrlCard || imageUrl,
        publicId: publicId || null,
        updatedAt: serverTimestamp(),
      };

      if (!editingId) {
        await addDoc(collection(db, "featured"), { ...payload, createdAt: serverTimestamp() });
      } else {
        const current = items.find((it) => it.id === editingId);
        const changingImage =
          (imageMode === "file" && file) ||
          (imageMode === "url" && urlInput.trim() && urlInput.trim() !== current?.imageUrl);

        if (changingImage && current?.publicId) {
          await callDeleteOnServer(current.publicId);
        }
        await updateDoc(doc(db, "featured", editingId), payload);
      }

      resetForm();
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(it) {
    setEditingId(it.id);
    setTitle(it.title || "");
    setDesc(it.description || "");
    setPriceInput(typeof it.price === "number" ? String(it.price).replace(".", ",") : (it.price ?? ""));
    setVisible(!!it.visible);
    setImageMode("url");
    setUrlInput(it.imageUrl || "");
    setFile(null);
    setErr("");
  }

  async function handleDelete(it) {
    if (!confirm(`Remover "${it.title}"?`)) return;
    setLoading(true);
    setErr("");
    try {
      if (it.publicId) await callDeleteOnServer(it.publicId);
      await deleteDoc(doc(db, "featured", it.id));
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Erro ao remover.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleVisibility(it) {
    try {
      await updateDoc(doc(db, "featured", it.id), {
        visible: !it.visible,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Erro ao alternar visibilidade.");
    }
  }

  // (Opcional) backfill publicId quando a URL for Cloudinary mas o doc não tiver publicId salvo
  useEffect(() => {
    (async () => {
      const ops = items
        .filter((it) => !it.publicId && it.imageUrl && isCloudinaryUrl(it.imageUrl))
        .map(async (it) => {
          const pid = extractPublicIdFromUrl(it.imageUrl);
          if (!pid) return;
          try {
            await updateDoc(doc(db, "featured", it.id), { publicId: pid, updatedAt: serverTimestamp() });
          } catch {
            // ignore
          }
        });
      await Promise.allSettled(ops);
    })();
  }, [items]);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gerenciar Destaques (Home)</h1>

      <form onSubmit={handleSubmit} className="grid gap-4 p-4 rounded-xl border border-neutral-800">
        {err && <div className="text-red-500 text-sm">{err}</div>}

        <div className="grid gap-2">
          <label className="text-sm font-medium">Título</label>
          <input
            className="border rounded-lg px-3 py-2 bg-neutral-900 border-neutral-700"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Revisão Completa"
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Descrição</label>
          <textarea
            className="border rounded-lg px-3 py-2 bg-neutral-900 border-neutral-700 min-h-[90px]"
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Detalhes do serviço/produto"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Preço</label>
          <input
            className="border rounded-lg px-3 py-2 bg-neutral-900 border-neutral-700"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            placeholder="Ex.: 120,50"
            inputMode="decimal"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Imagem</label>

          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={() => setImageMode("file")}
              className={`px-3 py-1 rounded-lg border ${imageMode === "file" ? "border-blue-500" : "border-neutral-700"}`}
            >
              Arquivo
            </button>
            <button
              type="button"
              onClick={() => setImageMode("url")}
              className={`px-3 py-1 rounded-lg border ${imageMode === "url" ? "border-blue-500" : "border-neutral-700"}`}
            >
              URL
            </button>
          </div>

          {imageMode === "file" ? (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="border rounded-lg px-3 py-2 bg-neutral-900 border-neutral-700"
            />
          ) : (
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="border rounded-lg px-3 py-2 bg-neutral-900 border-neutral-700"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <input id="visible" type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          <label htmlFor="visible" className="text-sm">Visível na Home</label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {editingId ? (loading ? "Salvando..." : "Salvar alterações") : (loading ? "Criando..." : "Criar destaque")}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-neutral-700">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Itens</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <div key={it.id} className="border border-neutral-800 rounded-xl overflow-hidden">
              <div className="aspect-video bg-neutral-900">
                {(it.imageUrlCard || it.imageUrl) ? (
                  <img
                    src={it.imageUrlCard || it.imageUrl}
                    alt={it.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-neutral-500 text-sm">Sem imagem</div>
                )}
              </div>
              <div className="p-3 grid gap-2">
                <div className="font-medium">{it.title}</div>
                <div className="text-sm text-neutral-300 line-clamp-2">{it.description}</div>
                <div className="text-sm">{fmtBRL(it.price)}</div>

                <div className="flex gap-2 pt-1">
                  <button className="px-3 py-1 rounded-lg border border-neutral-700" onClick={() => startEdit(it)}>
                    Editar
                  </button>
                  <button className="px-3 py-1 rounded-lg border border-neutral-700" onClick={() => toggleVisibility(it)}>
                    {it.visible ? "Ocultar" : "Exibir"}
                  </button>
                  <button
                    className="px-3 py-1 rounded-lg border border-red-800 text-red-300"
                    onClick={() => handleDelete(it)}
                  >
                    Remover
                  </button>
                </div>

                <div className="text-[11px] text-neutral-500">
                  {it.publicId ? `Cloudinary ID: ${it.publicId}` : "Sem publicId"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-sm text-neutral-400 mt-4">Nenhum item encontrado.</div>
        )}
      </div>
    </div>
  );
}
