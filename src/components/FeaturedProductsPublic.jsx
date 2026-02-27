// src/components/FeaturedProductsPublic.jsx
import { useEffect, useState } from "react";
import { normalizeProductImages } from "@/utils/productImage";
import { ProductImage } from "@/components/shared/ProductImage";
import { listPublicProducts } from "@/services/productsService";

export default function FeaturedProductsPublic() {
  const [items, setItems] = useState(null); // null = carregando, [] = vazio

  useEffect(() => {
    (async () => {
      try {
        const all = await listPublicProducts();
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
        {items.map((p, idx) => {
          const images = normalizeProductImages(p?.images || (p?.image ? [p.image] : []));
          const cover = images[0];
          return (
            <article
              key={p.id || idx}
              className="flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow dark:border-gray-800 dark:bg-neutral-900"
            >
              <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <ProductImage
                  publicId={cover?.publicId}
                  secureUrl={cover?.secureUrl}
                  alt={p.name}
                  role="card"
                />
              </div>
              <div className="p-4 space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">{p.category || "Sem categoria"}</div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-50">{p.name}</h3>
                <div className="text-blue-600 font-bold">{p.price || "—"}</div>
                {p.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">{p.description}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
