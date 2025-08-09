/**
 * FeaturedGrid.jsx
 * Lê "featured" (visible == true), orderBy(createdAt desc).
 * Renderiza cards com imageUrlCard || imageUrl, título, descrição e preço (R$).
 */

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../config/firebase";

function fmtBRL(n) {
  const v = Number(n || 0);
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FeaturedGrid() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "featured"),
      where("visible", "==", true),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <section className="max-w-6xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Destaques</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <article key={it.id} className="border border-neutral-800 rounded-xl overflow-hidden">
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
            <div className="p-3 grid gap-1">
              <h3 className="font-medium">{it.title}</h3>
              {it.description && <p className="text-sm text-neutral-300 line-clamp-2">{it.description}</p>}
              <div className="text-sm">{fmtBRL(it.price)}</div>
            </div>
          </article>
        ))}
      </div>
      {items.length === 0 && <div className="text-sm text-neutral-400 mt-3">Nenhum destaque disponível no momento.</div>}
    </section>
  );
}
