// @ts-nocheck

export default function ProductsSideFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceChange,
  brands,
  selectedBrands,
  onToggleBrand,
  colors,
  selectedColors,
  onToggleColor,
  sizes,
  selectedSizes,
  onToggleSize,
  onClear,
}) {
  const formatCurrency = (v) =>
    Number(String(v ?? "").toString().replace(/[^\d,.-]/g, "").replace(",", ".") || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })

  const parsePrice = (value) => {
    if (typeof value === "number") return value
    const cleaned = String(value || "")
      .replace(/R\$/gi, "")
      .replace(/\./g, "")
      .replace(",", ".")
    const num = Number(cleaned)
    return Number.isNaN(num) ? 0 : num
  }

  const minPrice = priceRange?.min ?? 0
  const maxPrice = priceRange?.max ?? 0

  const renderCheckboxList = (items, selected, toggleFn) => (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <label key={item} className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={selected?.includes(item)}
            onChange={() => toggleFn(item)}
            className="rounded border-gray-300 text-amber-500 focus:ring-amber-400"
          />
          <span>{item}</span>
        </label>
      ))}
    </div>
  )

  return (
    <aside className="hidden lg:block space-y-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Filtros</h3>
        <button
          onClick={onClear}
          className="text-sm font-medium text-amber-700 hover:text-amber-600"
        >
          Limpar
        </button>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-800">Categoria</h4>
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                selectedCategory === cat
                  ? "bg-amber-100 text-amber-800"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-800">Preço</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => onPriceChange({ ...priceRange, min: parsePrice(e.target.value) })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-300"
            aria-label="Preço mínimo"
          />
          <span className="text-sm text-gray-500">até</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => onPriceChange({ ...priceRange, max: parsePrice(e.target.value) })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-300"
            aria-label="Preço máximo"
          />
        </div>
        <p className="text-xs text-gray-500">{formatCurrency(minPrice)} — {formatCurrency(maxPrice)}</p>
      </div>

      {brands?.length ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-800">Marca</h4>
          {renderCheckboxList(brands, selectedBrands, onToggleBrand)}
        </div>
      ) : null}

      {sizes?.length ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-800">Tamanho / Aro</h4>
          {renderCheckboxList(sizes, selectedSizes, onToggleSize)}
        </div>
      ) : null}

      {colors?.length ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-800">Cor</h4>
          {renderCheckboxList(colors, selectedColors, onToggleColor)}
        </div>
      ) : null}
    </aside>
  )
}
