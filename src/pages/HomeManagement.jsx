import React, { useEffect, useState } from "react";
import ProductForm from "../components/admin/ProductForm";
import ProductCard from "../components/admin/ProductCard";
import { listenFeatured, createFeatured, updateFeatured, deleteFeatured } from "../services/featured";
import { isCloudinaryUrl, extractPublicIdFromUrl } from "../services/cloudinary";

const ADMIN_API_TOKEN = import.meta.env.VITE_ADMIN_API_TOKEN; // opcional

export default function HomeManagement() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const unsub = listenFeatured(setItems, false);
    return () => unsub();
  }, []);

  async function deleteOnCloudinary(publicId) {
    if (!publicId) return;
    const res = await fetch("/api/cloudinary-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ADMIN_API_TOKEN ? { Authorization: `Bearer ${ADMIN_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ publicId })
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Falha ao deletar no Cloudinary: ${res.status} ${res.statusText} ${t}`);
    }
  }

  async function handleSubmit({ cancel, changedImage, data }) {
    if (cancel) { setEditing(null); setErr(""); return; }
    setSubmitting(true);
    setErr("");
    try {
      if (!editing) {
        await createFeatured(data);
      } else {
        const current = items.find((it) => it.id === editing.id);
        if (changedImage && current?.publicId) await deleteOnCloudinary(current.publicId);
        await updateFeatured(editing.id, data);
        setEditing(null);
      }
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Remover "${item.title}"?`)) return;
    setSubmitting(true);
    setErr("");
    try {
      if (item.publicId) await deleteOnCloudinary(item.publicId);
      await deleteFeatured(item.id);
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Erro ao remover.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleVisible(item) {
    try {
      await updateFeatured(item.id, { visible: !item.visible });
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Erro ao alternar visibilidade.");
    }
  }

  // backfill publicId para URLs Cloudinary antigas sem publicId
  useEffect(() => {
    (async () => {
      const ops = items
        .filter((it) => !it.publicId && it.imageUrl && isCloudinaryUrl(it.imageUrl))
        .map(async (it) => {
          const pid = extractPublicIdFromUrl(it.imageUrl);
          if (!pid) return;
          try { await updateFeatured(it.id, { publicId: pid }); } catch {}
        });
      await Promise.allSettled(ops);
    })();
  }, [items]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Gerenciar Produtos</h1>
      {err && <div className="mb-4 text-red-600 text-sm">{err}</div>}

      <div className="mb-8">
        <ProductForm onSubmit={handleSubmit} initial={editing} submitting={submitting} />
      </div>

      <h2 className="text-xl font-semibold mb-3">Produtos</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((it) => (
          <ProductCard
            key={it.id}
            item={it}
            onEdit={(i) => setEditing(i)}
            onToggleVisible={toggleVisible}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {items.length === 0 && <div className="text-sm text-neutral-500 mt-4">Nenhum produto cadastrado.</div>}
    </div>
  );
}
