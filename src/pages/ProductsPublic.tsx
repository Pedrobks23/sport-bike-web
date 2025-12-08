// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Snowfall from "react-snowfall"
import MainNavbar from "@/components/layout/MainNavbar"
import ProductsXmasHero from "@/components/products/ProductsXmasHero"
import ProductsFiltersBar from "@/components/products/ProductsFiltersBar"
import ProductsSideFilters from "@/components/products/ProductsSideFilters"
import ProductsGrid from "@/components/products/ProductsGrid"
import ProductQuickView from "@/components/products/ProductQuickView"
import { listPublicProducts } from "@/services/productsService"
import { getHomeSettings } from "@/services/homeService"
import { useUI } from "@/contexts/UIContext"

const PAGE_SIZE = 12

const isOnSale = (product) => {
  const promoPrice = product?.promoPrice ?? product?.salePrice
  const hasPromoFlag = product?.promo === true || product?.promoNatal === true || product?.tags?.includes?.("natal")
  return Boolean(hasPromoFlag || (promoPrice && Number(promoPrice) < Number(product?.price || promoPrice)))
}

export default function ProductsPublic() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const natalParam = searchParams.get("natal") === "1"

  const { isXmasMode, prefersReducedMotion, enableXmas } = useUI()
  const isXmas = isXmasMode

  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({ showProductsSection: true })
  const [items, setItems] = useState([])
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sort, setSort] = useState("relevance")
  const [selectedCategory, setSelectedCategory] = useState("Todas")
  const [selectedBrands, setSelectedBrands] = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [selectedSizes, setSelectedSizes] = useState([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 })
  const [page, setPage] = useState(1)
  const [quickViewId, setQuickViewId] = useState(searchParams.get("p"))
  const syncingRef = useRef(false)

  useEffect(() => {
    document.title = "Produtos | Sport Bike"
  }, [])

  useEffect(() => {
    if (natalParam && !isXmasMode) {
      enableXmas()
    }
  }, [natalParam, isXmasMode, enableXmas])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    ;(async () => {
      try {
        const [prods, s] = await Promise.all([listPublicProducts(), getHomeSettings()])
        const visibleItems = (prods || []).filter((p) => p && p.visible !== false)
        setItems(visibleItems)
        setSettings({ showProductsSection: s?.showProductsSection !== false })

      } catch (e) {
        console.error(e)
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => setPage(1), [debouncedSearch, selectedCategory, sort, selectedBrands, selectedColors, selectedSizes, priceRange])

  const categories = useMemo(() => {
    const set = new Set()
    items.forEach((i) => i.category && set.add(i.category))
    return ["Todas", ...Array.from(set)]
  }, [items])

  const brands = useMemo(() => {
    const set = new Set()
    items.forEach((i) => {
      if (i.brand) set.add(i.brand)
      if (i.marca) set.add(i.marca)
    })
    return Array.from(set)
  }, [items])

  const colors = useMemo(() => {
    const set = new Set()
    items.forEach((i) => {
      if (i.color) set.add(i.color)
      if (i.cor) set.add(i.cor)
    })
    return Array.from(set)
  }, [items])

  const sizes = useMemo(() => {
    const set = new Set()
    items.forEach((i) => {
      if (i.size) set.add(i.size)
      if (i.aro) set.add(i.aro)
    })
    return Array.from(set)
  }, [items])

  const parsePriceNumber = (val) => {
    const cleaned = String(val ?? "")
      .replace(/R\$/gi, "")
      .replace(/\./g, "")
      .replace(",", ".")
    const num = Number(cleaned)
    return Number.isNaN(num) ? 0 : num
  }

  const priceLimits = useMemo(() => {
    const prices = items
      .map((p) => parsePriceNumber(p.price || p.promoPrice || 0))
      .filter((n) => !Number.isNaN(n))
    const min = prices.length ? Math.max(0, Math.min(...prices)) : 0
    const max = prices.length ? Math.max(...prices, min + 500) : 5000
    return { min, max }
  }, [items])

  useEffect(() => {
    setPriceRange((prev) => ({
      min: prev.min || priceLimits.min,
      max: prev.max || priceLimits.max,
    }))
  }, [priceLimits.min, priceLimits.max])

  const handleClearFilters = () => {
    setSelectedCategory("Todas")
    setSelectedBrands([])
    setSelectedColors([])
    setSelectedSizes([])
    setPriceRange(priceLimits)
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get("q") || ""
    const sortParam = params.get("sort") || "relevance"
    const cat = params.get("cat") || "Todas"
    const brandsParam = params.get("brand") || ""
    const aroParam = params.get("aro") || ""
    const minParam = params.get("min")
    const maxParam = params.get("max")
    const colorsParam = params.get("color") || ""
    const sizesParam = params.get("size") || ""
    const quickId = params.get("p")

    setSearchInput(q)
    setDebouncedSearch(q)
    setSort(sortParam)
    setSelectedCategory(cat || "Todas")
    setSelectedBrands(
      brandsParam
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean)
    )
    setSelectedSizes(
      (aroParam || sizesParam)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
    setSelectedColors(
      colorsParam
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    )
    setPriceRange({
      min: minParam ? parsePriceNumber(minParam) : priceLimits.min,
      max: maxParam ? parsePriceNumber(maxParam) : priceLimits.max,
    })
    setQuickViewId(quickId)
  }, [location.search, priceLimits.min, priceLimits.max])

  useEffect(() => {
    if (syncingRef.current) return
    const params = new URLSearchParams(location.search)
    if (searchInput) params.set("q", searchInput)
    else params.delete("q")

    if (sort && sort !== "relevance") params.set("sort", sort)
    else params.delete("sort")

    if (selectedCategory && selectedCategory !== "Todas") params.set("cat", selectedCategory)
    else params.delete("cat")

    if (selectedBrands.length) params.set("brand", selectedBrands.join(","))
    else params.delete("brand")

    if (selectedSizes.length) params.set("aro", selectedSizes.join(","))
    else params.delete("aro")

    if (selectedColors.length) params.set("color", selectedColors.join(","))
    else params.delete("color")

    if (priceRange.min && priceRange.min !== priceLimits.min) params.set("min", String(priceRange.min))
    else params.delete("min")
    if (priceRange.max && priceRange.max !== priceLimits.max) params.set("max", String(priceRange.max))
    else params.delete("max")

    if (quickViewId) params.set("p", quickViewId)
    else params.delete("p")

    syncingRef.current = true
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
    setTimeout(() => {
      syncingRef.current = false
    }, 0)
  }, [searchInput, sort, selectedCategory, selectedBrands, selectedSizes, selectedColors, priceRange, quickViewId, navigate, location.pathname, priceLimits.min, priceLimits.max])

  const getTimestamp = (p) => {
    const ts = p?.updatedAt || p?.createdAt
    if (ts?.toMillis) return ts.toMillis()
    if (ts?.seconds) return ts.seconds * 1000
    if (typeof ts === "number") return ts
    return 0
  }

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase()
    let arr = items.slice()

    arr = arr.filter((p) => {
      const byCat = selectedCategory === "Todas" || (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      if (!byCat) return false

      if (selectedBrands.length && !selectedBrands.includes(p.brand || p.marca)) return false
      if (selectedColors.length && !selectedColors.includes(p.color || p.cor)) return false
      if (selectedSizes.length && !selectedSizes.includes(p.size || p.aro)) return false

      const price = parsePriceNumber(p.price || p.promoPrice || 0)
      if (priceRange.min && price < priceRange.min) return false
      if (priceRange.max && price > priceRange.max) return false

      if (!term) return true
      const haystack = `${p.name || ""} ${p.category || ""} ${p.description || ""}`.toLowerCase()
      return haystack.includes(term)
    })

    const score = (p) => {
      if (!term) return 1
      const hay = `${p.name || ""} ${p.description || ""}`.toLowerCase()
      return hay.includes(term) ? 2 : 1
    }

    const ts = (p) => getTimestamp(p)
    if (sort === "price-asc") arr.sort((a, b) => parsePriceNumber(a.price || 0) - parsePriceNumber(b.price || 0))
    if (sort === "price-desc") arr.sort((a, b) => parsePriceNumber(b.price || 0) - parsePriceNumber(a.price || 0))
    if (sort === "newest") arr.sort((a, b) => ts(b) - ts(a))
    if (sort === "best") arr.sort((a, b) => (Number(b.sold || b.sales || 0) - Number(a.sold || a.sales || 0)))
    if (sort === "relevance") arr.sort((a, b) => score(b) - score(a) || ts(b) - ts(a))

    return arr
  }, [items, debouncedSearch, selectedCategory, sort, selectedBrands, selectedColors, selectedSizes, priceRange])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const start = (page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  const pageItems = filtered.slice(start, end)

  const quickCategories = categories.slice(1, 6)
  const quickBrands = brands.slice(0, 5)
  const quickSizes = sizes.slice(0, 4)

  const quickProduct = useMemo(() => filtered.find((p) => p.id === quickViewId) || items.find((p) => p.id === quickViewId), [filtered, items, quickViewId])

  const handleOpenQuickView = (prod) => {
    setQuickViewId(prod?.id)
  }

  const handleCloseQuickView = () => setQuickViewId(null)

  useEffect(() => {
    if (quickViewId && !quickProduct && !loading) {
      setQuickViewId(null)
    }
  }, [quickViewId, quickProduct, loading])

  const topBg = isXmas
    ? "bg-gradient-to-b from-emerald-900/60 via-emerald-800/30 to-white"
    : "bg-gradient-to-b from-gray-100 via-white to-white"

  return (
    <div className={`relative min-h-screen ${topBg}`}>
      {isXmas && !prefersReducedMotion && (
        <Snowfall
          style={{ position: "fixed", width: "100vw", height: "100vh", zIndex: 30, pointerEvents: "none" }}
          snowflakeCount={120}
        />
      )}

      <MainNavbar isScrolled />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-12">
        {isXmas ? (
          <ProductsXmasHero onSeeDeals={() => navigate("/produtos?natal=1")} />
        ) : (
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-extrabold text-gray-900">Produtos</h1>
            <p className="mt-2 text-gray-600">Veja nossa seleção completa disponível na loja.</p>
          </section>
        )}

        <div className="mt-6 flex gap-3 overflow-x-auto pb-3" aria-label="Categorias">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                selectedCategory === cat
                  ? isXmas
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-amber-400 bg-amber-100 text-amber-800"
                  : "border-gray-200 bg-white text-gray-700 hover:border-amber-200"
              }`}
              aria-pressed={selectedCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        <ProductsFiltersBar
          search={searchInput}
          onSearchChange={(value) => setSearchInput(value)}
          sort={sort}
          onSortChange={setSort}
          quickCategories={quickCategories}
          quickBrands={quickBrands}
          quickSizes={quickSizes}
          selectedCategory={selectedCategory}
          selectedBrands={selectedBrands}
          selectedSizes={selectedSizes}
          onSelectCategory={setSelectedCategory}
          onSelectBrand={(brand) =>
            setSelectedBrands((prev) =>
              prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
            )
          }
          onSelectSize={(size) =>
            setSelectedSizes((prev) =>
              prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
            )
          }
          topOffset={isXmas ? 96 : 88}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px,1fr]">
          <ProductsSideFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            brands={brands}
            selectedBrands={selectedBrands}
            onToggleBrand={(brand) =>
              setSelectedBrands((prev) =>
                prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
              )
            }
            colors={colors}
            selectedColors={selectedColors}
            onToggleColor={(color) =>
              setSelectedColors((prev) =>
                prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
              )
            }
            sizes={sizes}
            selectedSizes={selectedSizes}
            onToggleSize={(size) =>
              setSelectedSizes((prev) =>
                prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
              )
            }
            onClear={handleClearFilters}
          />

          <section className="space-y-4">
            {settings.showProductsSection ? (
              <ProductsGrid
                products={pageItems}
                loading={loading}
                isXmas={isXmas}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                prefersReducedMotion={prefersReducedMotion}
                onOpenQuickView={handleOpenQuickView}
              />
            ) : (
              <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
                <p className="text-gray-700">A seção de produtos está temporariamente indisponível.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {quickProduct ? (
        <ProductQuickView
          product={quickProduct}
          isXmas={isXmas}
          prefersReducedMotion={prefersReducedMotion}
          onClose={handleCloseQuickView}
        />
      ) : null}
    </div>
  )
}
