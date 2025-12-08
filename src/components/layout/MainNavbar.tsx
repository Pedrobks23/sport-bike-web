import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Instagram, Menu, MessageCircle, X } from "lucide-react"
import ResponsiveContainer from "../ResponsiveContainer"
import { useUI } from "@/contexts/UIContext"

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || "558532677425"

function buildWhatsappUrl(message = "Olá! Vim pelo site da Sport Bike.") {
  return `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(
    message
  )}&type=phone_number&app_absent=0`
}

export default function MainNavbar({ isScrolled = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isXmasMode, toggleXmas, isDarkMode, toggleDarkMode } = useUI()

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname, location.hash])

  const navItems = useMemo(
    () => [
      { label: "Serviços", to: "/#servicos" },
      { label: "FAQ", to: "/#faq" },
      { label: "Contato", to: "/#contato" },
      { label: "Produtos", to: "/produtos" },
    ],
    []
  )

  const isActive = (to) => {
    if (to === "/produtos") return location.pathname.startsWith("/produtos")
    if (to?.startsWith("/#")) return location.pathname === "/" && location.hash === to.replace("/", "")
    return location.pathname === "/"
  }

  const handleConsult = () => navigate("/consulta")

  const LinkComponent = ({ to, children }) => (
    <Link
      to={to}
      aria-current={isActive(to) ? "page" : undefined}
      className={`text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors ${
        isActive(to) ? "font-semibold" : ""
      }`}
    >
      {children}
    </Link>
  )

  return (
    <header
      className={`relative z-30 w-full border-b border-white/20 dark:border-white/10 shadow-md supports-[backdrop-filter]:bg-white/40 supports-[backdrop-filter]:dark:bg-neutral-950/40 bg-white/60 dark:bg-neutral-950/40 backdrop-blur-md transition-all duration-300 ${
        isScrolled ? "shadow-lg" : "shadow"
      }`}
    >
      <ResponsiveContainer className="py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2" aria-label="Voltar para a Home">
            <img src="/assets/Logo.png" alt="Sport & Bike" className="w-12 h-12" />
            <span className="text-2xl font-bold text-gray-800 dark:text-white">Sport & Bike</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <LinkComponent key={item.to} to={item.to}>
                {item.label}
              </LinkComponent>
            ))}

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
              onClick={toggleXmas}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-colors shadow-sm ${
                isXmasMode
                  ? "bg-white text-amber-600 shadow-amber-200/60"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }`}
              aria-pressed={isXmasMode}
            >
              <span>Clima natalino</span>
              <span aria-hidden>{isXmasMode ? "❄️" : ""}</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="Alternar tema"
              aria-label="Alternar tema claro/escuro"
            >
              {isDarkMode ? "🌞" : "🌙"}
            </button>
            <button
              onClick={handleConsult}
              className="bg-amber-500 text-white px-6 py-2 rounded-full hover:bg-amber-600 transition-colors font-medium"
            >
              Consultar O.S.
            </button>
          </nav>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Alternar menu">
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
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isActive(item.to) ? "page" : undefined}
                  className="text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3">
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
                  >
                    {isDarkMode ? "🌞" : "🌙"}
                  </button>
                </div>
                <button
                  onClick={toggleXmas}
                  className={`flex w-full items-center justify-center gap-2 px-4 py-2 rounded-full font-medium transition-colors shadow-sm ${
                    isXmasMode
                      ? "bg-white text-amber-600 shadow-amber-200/60"
                      : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  }`}
                  aria-pressed={isXmasMode}
                >
                  <span>Clima natalino</span>
                  <span aria-hidden>{isXmasMode ? "❄️" : ""}</span>
                </button>
              </div>
              <button
                onClick={handleConsult}
                className="bg-amber-500 text-white px-6 py-2 rounded-full hover:bg-amber-600 transition-colors font-medium w-fit"
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
