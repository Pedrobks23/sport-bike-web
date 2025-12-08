// @ts-nocheck
import ProductCard from "./ProductCard"
import { ChevronLeft, ChevronRight } from "lucide-react"

function SkeletonCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="h-64 w-full animate-pulse bg-gradient-to-br from-gray-200 to-gray-300" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-200" />
        <div className="h-10 w-full rounded bg-gray-200" />
      </div>
    </div>
  )
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = []
  const push = (n) => pages.push(n)
  const addRange = (s, e) => {
    for (let i = s; i <= e; i++) push(i)
  }

  if (totalPages <= 7) {
    addRange(1, totalPages)
  } else {
    const left = Math.max(2, page - 1)
    const right = Math.min(totalPages - 1, page + 1)
    push(1)
    if (left > 2) push("...")
    addRange(left, right)
    if (right < totalPages - 1) push("...")
    push(totalPages)
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        className="inline-flex items-center gap-1 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm hover:border-gray-300 disabled:opacity-50"
        disabled={page === 1}
      >
        <ChevronLeft className="h-4 w-4" /> Anterior
      </button>

      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={`e-${idx}`} className="px-2 text-gray-500">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-9 w-9 rounded-xl text-sm font-semibold transition ${
              p === page ? "bg-amber-400 text-black" : "text-gray-700 hover:border-gray-300"
            }`}
            style={{
              border: "1px solid #e5e7eb",
              boxShadow: p === page ? "0 1px 2px rgba(0,0,0,.06)" : "none",
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        className="inline-flex items-center gap-1 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm hover:border-gray-300 disabled:opacity-50"
        disabled={page === totalPages}
      >
        Próxima <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function ProductsGrid({
  products,
  loading,
  isXmas,
  page,
  totalPages,
  onPageChange,
  prefersReducedMotion = false,
  onOpenQuickView,
}) {
  if (loading) {
    return (
      <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
        {Array.from({ length: 8 }).map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    )
  }

  if (!products?.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800">Nenhum produto encontrado</h3>
        <p className="mt-2 text-sm text-gray-600">Ajuste os filtros ou limpe a busca para ver mais itens.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(340px,1fr))]">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            isXmas={isXmas}
            prefersReducedMotion={prefersReducedMotion}
            onOpenQuickView={onOpenQuickView}
          />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </div>
  )
}
