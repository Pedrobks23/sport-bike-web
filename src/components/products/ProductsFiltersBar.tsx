// @ts-nocheck
import { useMemo } from "react"
import { Search, ChevronDown } from "lucide-react"

const sortOptions = [
  { value: "relevance", label: "Relevância" },
  { value: "best", label: "Mais vendidos" },
  { value: "price-asc", label: "Preço ↑" },
  { value: "price-desc", label: "Preço ↓" },
  { value: "newest", label: "Novidades" },
]

export default function ProductsFiltersBar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  quickFilters,
  onToggleQuick,
  topOffset = 96,
}) {
  const chips = useMemo(
    () => [
      { key: "stock", label: "Em estoque" },
      { key: "promo", label: "Promoção" },
      { key: "frete", label: "Frete grátis" },
    ],
    []
  )

  return (
    <div
      className="sticky z-30 rounded-2xl border border-gray-200 bg-white/95 shadow-sm backdrop-blur"
      style={{ top: topOffset }}
      aria-label="Barra de busca e filtros"
    >
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, categoria ou descrição"
            className="w-full rounded-xl border border-gray-200 bg-white px-10 py-2 text-sm shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-300"
            aria-label="Buscar produtos"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => onToggleQuick(chip.key)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                quickFilters?.[chip.key]
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-amber-200"
              }`}
              aria-pressed={quickFilters?.[chip.key] ? "true" : "false"}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 pr-8 text-sm font-semibold shadow-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-300"
            aria-label="Ordenar produtos"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  )
}
