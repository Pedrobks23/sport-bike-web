import { useMemo } from "react"
import { X } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface XmasPromoCardProps {
  onClose: () => void
  onActivateXmas?: () => void
  onSeeDeals?: () => void
  imagePublicId?: string
}

const getGlobalXmasToggle = () => {
  const globalObj: any = typeof window !== "undefined" ? window : globalThis
  if (typeof globalObj?.toggleXmas === "function") return globalObj.toggleXmas as () => void
  if (typeof globalObj?.enableXmas === "function") return globalObj.enableXmas as () => void
  return undefined
}

const buildSantaUrl = (publicId?: string) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const santaId = publicId || import.meta.env.VITE_XMAS_SANTA_ID
  if (!cloudName || !santaId) return null

  const sanitizedId = String(santaId).replace(/^\/+/, "")
  const transformations = "f_auto,q_auto,c_fill,g_auto,w_640,h_420"
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${sanitizedId}.png`
}

export default function XmasPromoCard({
  onClose,
  onActivateXmas,
  onSeeDeals,
  imagePublicId,
}: XmasPromoCardProps) {
  const navigate = useNavigate()

  const santaImageUrl = useMemo(() => buildSantaUrl(imagePublicId), [imagePublicId])

  const handleActivate = () => {
    const resolver = onActivateXmas || getGlobalXmasToggle()
    if (resolver) {
      resolver()
    }
    if (onClose) {
      onClose()
    }
  }

  const handleSeeDeals = () => {
    if (onSeeDeals) {
      onSeeDeals()
      return
    }
    navigate("/produtos?natal=1")
  }

  return (
    <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-amber-400 to-green-600 shadow-2xl">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute right-3 top-3 z-20 rounded-full bg-white/90 p-2 text-red-600 shadow hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-400 transition"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">
        <div className="relative overflow-hidden bg-white/10">
          {santaImageUrl ? (
            <img
              src={santaImageUrl}
              alt="Papai Noel pedalando uma bicicleta"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full min-h-[240px] w-full bg-gradient-to-br from-amber-200 via-red-200 to-green-200" aria-hidden />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-red-600/25 via-transparent to-green-500/20" />
        </div>
        <div className="flex flex-col justify-between bg-white/90 p-6 sm:p-8">
          <div className="space-y-3 text-gray-800">
            <p className="text-sm uppercase tracking-[0.2em] text-red-600 font-semibold">Especial de Natal</p>
            <h3 className="text-3xl font-bold text-gray-900">Ative o clima natalino</h3>
            <p className="text-lg leading-relaxed text-gray-700">
              Ative o clima natalino, para entrar no clima de natal e aproveitar com um toque especial nossas ofertas.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
            <button
              type="button"
              onClick={handleActivate}
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
            >
              Ativar clima natalino
            </button>
            <button
              type="button"
              onClick={handleSeeDeals}
              className="inline-flex items-center justify-center rounded-xl border-2 border-red-500 px-4 py-3 text-base font-semibold text-red-600 transition hover:border-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300"
            >
              Ver ofertas de Natal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
