import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchAllPublic } from "@/services/publicProducts";
import { getHomeSettings } from "@/services/homeService";
import {
  Search,
  Star,
  MessageCircle,
  Tag,
  Sparkles,
  LayoutGrid,
  Rows2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from "lucide-react";

const logo = "/assets/Logo.png"; // usando imagem no public
const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || "";
const BRAND_YELLOW = "#FFD600";

const fmtBRL = (v) =>
  Number(String(v ?? "").toString().replace(/[^\d,.-]/g, "").replace(",", ".") || 0)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function buildWhatsappLink(product) {
  if (!WHATSAPP_PHONE) return "#";
  const msg =
    `Olá! Tenho interesse no produto:\n` +
    `- Nome: ${product?.name || "—"}\n` +
    `- Preço: ${fmtBRL(product?.price || 0)}\n` +
    `- Categoria: ${product?.category || "—"}\n\n` +
    `Poderia me passar mais detalhes?`;
  return `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(
    msg
  )}&type=phone_number&app_absent=0`;
}

export default function ProductsPublic() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ showProductsSection: true });
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("recentes");

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    document.title = "Produtos | Sport Bike";
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [prods, s] = await Promise.all([fetchAllPublic(), getHomeSettings()]);
        setSettings({ showProductsSection: s?.showProductsSection !== false });
        setItems(prods || []);
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((i) => i.category && set.add(i.category));
    return ["todas", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    let arr = items.filter((p) => {
      const byCat = category === "todas" || (p.category || "") === category;
      if (!t) return byCat;
      const hay = `${p.name || ""} ${p.category || ""} ${p.description || ""}`.toLowerCase();
      return byCat && hay.includes(t);
    });

    arr = arr.slice();
    const ts = (x) => x?.updatedAt?.toMillis?.() ?? x?.updatedAt?.seconds ?? 0;
    if (sort === "recentes") arr.sort((a, b) => ts(b) - ts(a));
    if (sort === "menor") arr.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sort === "maior") arr.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    if (sort === "nome")
      arr.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    return arr;
  }, [items, search, category, sort]);

  useEffect(() => setPage(1), [search, category, sort, view]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = filtered.slice(start, end);

  if (!settings.showProductsSection) {
    return (
      <section className="container mx-auto px-4 py-20">
        <Header />
        <div className="mt-8 rounded-2xl border bg-white/80 p-8 text-center shadow-sm">
          <p className="text-gray-700">A seção de produtos está temporariamente indisponível.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-black text-white shadow">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Sport Bike" className="h-10 w-auto" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-500"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para Home
          </Link>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, #fff 0%, #fff 60%, ${BRAND_YELLOW}0F 100%)`,
        }}
      />
      <div className="relative container mx-auto px-4 py-14">
        <Header />

        {/* filtros */}
        <div className="mt-10 grid gap-4 md:grid-cols-12 md:items-center">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              className="w-full rounded-xl border bg-white px-10 py-2 shadow-sm outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Buscar por nome, categoria ou descrição"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="md:col-span-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-sm text-gray-700">
              <Tag className="h-4 w-4" /> Categoria:
            </span>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition
                    ${
                      category === c
                        ? "border-yellow-500 bg-yellow-400 text-black shadow"
                        : "border-gray-200 bg-white hover:border-yellow-400"
                    }`}
                >
                  {c[0].toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none rounded-xl border bg-white px-3 py-2 pr-8 text-sm shadow-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
              >
                <option value="recentes">Mais recentes</option>
                <option value="menor">Menor preço</option>
                <option value="maior">Maior preço</option>
                <option value="nome">Nome (A→Z)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
            </div>

            <div className="inline-flex rounded-xl border bg-white p-1 shadow-sm">
              <button
                onClick={() => setView("grid")}
                className={`rounded-lg px-2 py-1 ${
                  view === "grid" ? "bg-yellow-400 text-black" : "text-gray-700"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded-lg px-2 py-1 ${
                  view === "list" ? "bg-yellow-400 text-black" : "text-gray-700"
                }`}
              >
                <Rows2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* grid/list */}
        {loading ? (
          <SkeletonGrid />
        ) : filtered.length ? (
          <>
            {view === "grid" ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pageItems.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                {pageItems.map((p) => (
                  <ProductRow key={p.id} product={p} />
                ))}
              </div>
            )}
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={(n) => setPage(n)}
              brandYellow={BRAND_YELLOW}
            />
          </>
        ) : (
          <div className="mt-16 text-center text-gray-600">Nenhum produto encontrado.</div>
        )}
      </div>
    </section>
  );
}

/* ====== HEADER ====== */
function Header() {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-3">
        <img src={logo} alt="Sport Bike" className="h-10 w-auto" />
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-black shadow-sm"
          style={{ backgroundColor: BRAND_YELLOW }}
        >
          <Sparkles className="h-3.5 w-3.5" /> nossa seleção
        </div>
      </div>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Produtos</h1>
      <p className="mt-2 text-gray-700">Veja nossa seleção completa disponível na loja.</p>
    </div>
  );
}

/* ====== PRODUCT CARD ====== */
function ProductCard({ product }) {
  const url = product.imageUrl || "/images/placeholder-product.png";

  return (
    <article className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-2xl hover:border-yellow-400">
      {/* Imagem */}
      <div className="relative h-56 w-full overflow-hidden">
        <img
          src={url}
          alt={product.name}
          className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
        />

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
          {product.isFeatured && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-black shadow"
              style={{ backgroundColor: BRAND_YELLOW }}
            >
              <Star className="h-3.5 w-3.5" /> Destaque
            </span>
          )}
          {product.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs text-gray-800 shadow">
              <Tag className="h-3.5 w-3.5" /> {product.category}
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="space-y-1 p-4">
        <h3 className="line-clamp-1 text-lg font-semibold">{product.name || "Sem nome"}</h3>
        <div className="text-lg font-extrabold" style={{ color: BRAND_YELLOW }}>
          {fmtBRL(product.price) || "—"}
        </div>
        {product.description && (
          <p className="line-clamp-2 text-sm text-gray-700">{product.description}</p>
        )}

        {/* CTA — verde WhatsApp */}
        <div className="pt-3">
          <a
            href={buildWhatsappLink(product)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <MessageCircle className="h-4 w-4" />
            Tenho interesse
          </a>
        </div>
      </div>
    </article>
  );
}

/* ====== PRODUCT ROW ====== */
function ProductRow({ product }) {
  const url = product.imageUrl || "/images/placeholder-product.png";

  return (
    <article className="flex flex-col gap-4 rounded-2xl border bg-white p-3 shadow-sm transition hover:shadow-xl hover:border-yellow-400 sm:flex-row">
      <div className="relative h-44 w-full overflow-hidden rounded-xl sm:h-40 sm:w-64">
        <img
          src={url}
          alt={product.name}
          className="h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
        />
        {product.isFeatured && (
          <span
            className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-black shadow"
            style={{ backgroundColor: BRAND_YELLOW }}
          >
            <Star className="h-3.5 w-3.5" /> Destaque
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-1">
        <div>
          {product.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
              <Tag className="h-3.5 w-3.5" /> {product.category}
            </span>
          )}
          <h3 className="mt-1 line-clamp-1 text-xl font-semibold">{product.name}</h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-700">{product.description}</p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xl font-extrabold" style={{ color: BRAND_YELLOW }}>
            {fmtBRL(product.price) || "—"}
          </div>
          <a
            href={buildWhatsappLink(product)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <MessageCircle className="h-4 w-4" />
            Tenho interesse
          </a>
        </div>
      </div>
    </article>
  );
}

/* ====== PAGINAÇÃO ====== */
function Pagination({ page, totalPages, onChange, brandYellow }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const push = (n) => pages.push(n);
  const addRange = (s, e) => { for (let i = s; i <= e; i++) push(i); };

  if (totalPages <= 7) {
    addRange(1, totalPages);
  } else {
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    push(1);
    if (left > 2) push("...");
    addRange(left, right);
    if (right < totalPages - 1) push("...");
    push(totalPages);
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
          <span key={`e-${idx}`} className="px-2 text-gray-500">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-9 w-9 rounded-xl text-sm font-semibold transition ${
              p === page
                ? "text-black"
                : "text-gray-700 hover:border-gray-300"
            }`}
            style={{
              backgroundColor: p === page ? brandYellow : "white",
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
  );
}

/* ====== SKELETON ====== */
function SkeletonGrid() {
  const cells = Array.from({ length: 8 });
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cells.map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="h-56 w-full bg-gray-200" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-16 rounded bg-gray-200" />
            <div className="h-4 w-2/3 rounded bg-gray-200" />
            <div className="h-5 w-28 rounded bg-gray-200" />
            <div className="h-9 w-full rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
