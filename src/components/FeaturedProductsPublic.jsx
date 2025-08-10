// src/components/FeaturedProductsPublic.jsx
import { useEffect, useState } from "react";
import { cldFill } from "@/utils/cloudinaryUrl";
import { listAllProducts } from "@/services/productsService";

export default function FeaturedProductsPublic() {
  const [items, setItems] = useState(null); // null = carregando, [] = vazio

  useEffect(() => {
    (async () => {
      try {
        const all = await listAllProducts();
        const featured = (all || []).filter(
          (p) => p?.isFeatured === true && p?.visible !== false
        );
        setItems(featured);
      } catch (e) {
        console.error(e);
        setItems([]);
      }
    })();
  }, []);

  if (items === null) {
    return (
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-extrabold text-center">Produtos em Destaque</h2>
        <p className="text-gray-500 text-center mt-2">Carregando...</p>
      </section>
    );
  }

  if (!items.length) {
    return null; // Sem destaques, não exibe a seção
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-4xl font-extrabold text-center">Produtos em Destaque</h2>
      <p className="text-gray-500 text-center mt-2">
        Confira nossa seleção especial de bikes e acessórios
      </p>

      {/* Grid simples (pode trocar por seu carrossel depois) */}
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((p) => {
          const url = cldFill(
            typeof p.image === "string" ? { url: p.image } : p.image,
            { w: 640, h: 480 }
          );
          return (
            <article key={p.id} className="bg-white rounded-xl border overflow-hidden shadow">
              {url && (
                <img
                  src={url}
                  alt={p.name}
                  className="w-full h-56 object-cover object-center"
                  loading="lazy"
                />
              )}
              <div className="p-4">
                <div className="text-xs text-gray-500">{p.category || "Sem categoria"}</div>
                <h3 className="font-semibold">{p.name}</h3>
                <div className="text-amber-600 font-bold">
                  {p.price || "—"}
                </div>
                {p.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{p.description}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
