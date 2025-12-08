// @ts-nocheck
import { Sparkles } from "lucide-react"

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const DEFAULT_BG_PUBLIC_ID = "v1765170667/background_natalG_rt61qo"

function buildHeroUrl() {
  if (!CLOUD_NAME) return null
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,c_fill,g_auto,w_1920,h_480/${DEFAULT_BG_PUBLIC_ID}.png`
}

export default function ProductsXmasHero({ onSeeDeals }) {
  const heroUrl = buildHeroUrl()
  const fallbackGradient = "linear-gradient(120deg, #0f5132 0%, #198754 40%, #b42318 100%)"

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-red-700 p-8 text-white shadow-xl">
      <div
        className="absolute inset-0 opacity-70"
        style={{ backgroundImage: heroUrl ? `url(${heroUrl})` : fallbackGradient, backgroundSize: "cover", backgroundPosition: "center" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-emerald-800/70 to-red-900/70" aria-hidden />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_45%)]" aria-hidden />

      <div className="relative z-10 grid gap-6 md:grid-cols-1 md:items-center">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-amber-200">
            <Sparkles className="h-4 w-4" /> Natal Sport Bike
          </p>
          <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
            Ofertas de Natal 🎁
          </h1>
          <p className="max-w-2xl text-lg text-emerald-50">
            Seleção especial de bikes e acessórios com vantagens natalinas. Ative o clima natalino para entrar na atmosfera festiva e aproveitar.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onSeeDeals}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-800 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-emerald-800"
            >
              Ver ofertas de Natal
            </button>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-amber-100 ring-1 ring-white/30">
              <span role="img" aria-label="Neve">❄️</span> Flocos suaves e cores especiais
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
