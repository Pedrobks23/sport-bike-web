import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Instagram, Menu, MessageCircle, X } from "lucide-react"
import ResponsiveContainer from "../ResponsiveContainer"
import { useUI } from "@/contexts/UIContext"

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || "558532677425"

function buildWhatsappUrl(message = "Olá! Vim pelo site da Giilberto Bike.") {
  return `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(
    message,
  )}&type=phone_number&app_absent=0`
}

export default function MainNavbar({ isScrolled = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isDarkMode, toggleDarkMode } = useUI()

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  const navItems = useMemo(
    () => [
      { label: "Serviços", id: "servicos" },
      { label: "FAQ", id: "faq" },
      { label: "Contato", id: "contato" },
      { label: "Produtos", to: "/produtos" },
    ],
    [],
  )

  const scrollToId = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const goToSection = (id) => {
    // se estiver fora da Home, navega pra Home e depois rola
    if (location.pathname !== "/") {
      navigate("/")
      setTimeout(() => scrollToId(id), 80)
      return
    }
    scrollToId(id)
  }

  const isProductsActive = location.pathname.startsWith("/produtos")

  const handleConsult = () => navigate("/consulta")

  return (
    // ✅ sticky (no fluxo) -> NÃO precisa do spacer h-24 -> remove o espaço branco
    <header
      className={`sticky top-0 inset-x-0 z-50 w-full border-b border-white/20 dark:border-white/10 supports-[backdrop-filter]:bg-white/30 supports-[backdrop-filter]:dark:bg-neutral-950/30 bg-white/70 dark:bg-neutral-950/60 backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 ${
        isScrolled ? "shadow-lg" : "shadow"
      }`}
    >
      <ResponsiveContainer className="py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2" aria-label="Voltar para a Home">
            <img src="/assets/Logo.png" alt="Giilberto Bike" className="w-12 h-12" />
            <span className="text-2xl font-bold text-gray-800 dark:text-white">Sport &amp; Bike</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              if (item.to) {
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={isProductsActive ? "page" : undefined}
                    className={`text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors ${
                      isProductsActive ? "font-semibold" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToSection(item.id)}
                  className="text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors"
                >
                  {item.label}
                </button>
              )
            })}

            <div className="flex items-center space-x-3">
              <a
                href={buildWhatsappUrl("Olá! Vim através do site.")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-600 transition-colors"
                title="WhatsApp"
                aria-label="Abrir conversa no WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/sportbike_fortaleza/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-500 hover:text-pink-600 transition-colors"
                title="Instagram"
                aria-label="Abrir Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="Alternar tema"
              aria-label="Alternar tema claro/escuro"
              type="button"
            >
              {isDarkMode ? "🌞" : "🌙"}
            </button>

            <button
              onClick={handleConsult}
              className="bg-amber-500 text-white px-6 py-2 rounded-full hover:bg-amber-600 transition-colors font-medium"
              type="button"
            >
              Consultar O.S.
            </button>
          </nav>

          <button className="md:hidden" onClick={() => setIsMenuOpen((v) => !v)} aria-label="Alternar menu" type="button">
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-800 dark:text-white" />
            ) : (
              <Menu className="w-6 h-6 text-gray-800 dark:text-white" />
            )}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700" aria-label="Menu móvel">
            <div className="flex flex-col space-y-4 pt-4">
              {navItems.map((item) => {
                if (item.to) {
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      goToSection(item.id)
                      setIsMenuOpen(false)
                    }}
                    className="text-left text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors"
                  >
                    {item.label}
                  </button>
                )
              })}

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={buildWhatsappUrl("Olá! Vim através do site.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-600 transition-colors"
                  aria-label="Abrir conversa no WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>

                <a
                  href="https://www.instagram.com/sportbike_fortaleza/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-500 hover:text-pink-600 transition-colors"
                  aria-label="Abrir Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>

                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  aria-label="Alternar tema claro/escuro"
                  type="button"
                >
                  {isDarkMode ? "🌞" : "🌙"}
                </button>
              </div>

              <button
                onClick={() => {
                  handleConsult()
                  setIsMenuOpen(false)
                }}
                className="bg-amber-500 text-white px-6 py-2 rounded-full hover:bg-amber-600 transition-colors font-medium w-fit"
                type="button"
              >
                Consultar O.S.
              </button>
            </div>
          </nav>
        )}
      </ResponsiveContainer>
    </header>
  )
}
