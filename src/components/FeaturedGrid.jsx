import React, { useEffect, useMemo, useRef, useState } from "react";
import { listenFeatured } from "../services/featured";

function fmtBRL(n) { return Number(n || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

function SkeletonCard() {
  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <header className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-extrabold">Produtos em Destaque</h2>
        <p className="text-neutral-600 dark:text-neutral-300 mt-2">Confira nossa seleção especial de bikes e acessórios</p>
      </header>
      <div className="relative rounded-3xl p-6 md:p-10 bg-gradient-to-br from-amber-300 to-amber-400 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div className="aspect-video rounded-2xl overflow-hidden bg-white/40">
            <div className="w-full h-full animate-pulse bg-white/60" />
          </div>
          <div className="text-white space-y-3">
            <div className="h-8 w-3/4 bg-white/60 rounded animate-pulse" />
            <div className="h-8 w-1/3 bg-white/60 rounded animate-pulse" />
            <div className="space-y-2 pt-2">
              <div className="h-3 w-2/3 bg-white/50 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-white/50 rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-white/50 rounded animate-pulse" />
            </div>
            <div className="h-10 w-44 bg-white/80 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function FeaturedGrid() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    const unsub = listenFeatured((list) => {
      setItems(list);
      setLoading(false);
    }, true);
    return () => unsub();
  }, []);

  const count = items.length;
  const current = useMemo(() => (count ? items[index % count] : null), [items, index, count]);

  useEffect(() => {
    clearInterval(timer.current);
    if (count > 1) {
      timer.current = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    }
    return () => clearInterval(timer.current);
  }, [count]);

  if (loading) return <SkeletonCard />;
  if (!count) {
    return (
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <header className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-extrabold">Produtos em Destaque</h2>
          <p className="text-neutral-600 dark:text-neutral-300 mt-2">Confira nossa seleção especial de bikes e acessórios</p>
        </header>
        <div className="text-center text-neutral-500">Nenhum produto em destaque no momento.</div>
      </section>
    );
  }

  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 py-10">
      <header className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-extrabold">Produtos em Destaque</h2>
        <p className="text-neutral-600 dark:text-neutral-300 mt-2">Confira nossa seleção especial de bikes e acessórios</p>
      </header>

      <div
        className="relative rounded-3xl p-6 md:p-10 bg-gradient-to-br from-amber-400 to-amber-500 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]"
        onMouseEnter={() => clearInterval(timer.current)}
        onMouseLeave={() => { if (count > 1) timer.current = setInterval(() => setIndex((i) => (i + 1) % count), 6000); }}
      >
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div className="aspect-video rounded-2xl overflow-hidden bg-white/20">
            <img
              src={current.imageUrlCard || current.imageUrl}
              alt={current.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

        <div className="text-white">
            <h3 className="text-3xl md:text-4xl font-extrabold">{current.title}</h3>
            <div className="text-3xl md:text-4xl font-extrabold mt-2">{fmtBRL(current.price)}</div>
            {current.description && (
              <ul className="mt-4 space-y-1">
                {String(current.description).split(/\n|;|,|•/).slice(0,6).map((line, i) => (
                  <li key={i} className="opacity-90">• {line.trim()}</li>
                ))}
              </ul>
            )}
            <button
              className="mt-6 btn bg-white text-amber-700 border-white hover:bg-neutral-100"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            >
              🛒 Tenho Interesse
            </button>
          </div>
        </div>

        {count > 1 && (
          <>
            <button aria-label="Anterior" onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full grid place-items-center bg-white text-amber-700 shadow">‹</button>
            <button aria-label="Próximo" onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full grid place-items-center bg-white text-amber-700 shadow">›</button>
          </>
        )}

        {count > 1 && (
          <div className="mt-6 flex gap-2 justify-center">
            {items.map((_, i) => (
              <button key={i} onClick={() => setIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition ${i === index ? "bg-white" : "bg-white/50"}`}
                aria-label={`Slide ${i+1}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
