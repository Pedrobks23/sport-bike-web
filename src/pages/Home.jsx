// src/pages/Home.jsx
"use client"

import { useEffect, useState } from "react"
import {
  Phone,
  MapPin,
  Clock,
  Instagram,
  MessageCircle,
  Bike,
  Wrench,
  Trophy,
  Settings,
  Star,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShoppingCart,
  Award,
  Truck,
  CreditCard,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { auth } from "../config/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getFeaturedProducts, getHomeSettings } from "../services/homeService"
import { getAllServicesOrdered } from "../services/serviceService"
import ResponsiveContainer from "../components/ResponsiveContainer"
import Silk from "../components/Silk"
import { cldFill } from "@/utils/cloudinaryUrl" // <<< novo helper para montar URL Cloudinary
import { Link } from "react-router-dom"
import Snowfall from "react-snowfall"


export default function Home() {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [currentProduct, setCurrentProduct] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOfficeModalOpen, setIsOfficeModalOpen] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSnowing, setIsSnowing] = useState(false)

  // agora cada item já vem com .displayUrl (URL transformada) para usar no carrossel
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [showFeatured, setShowFeatured] = useState(true)

  const services = [
    {
      icon: <Bike className="w-8 h-8" />,
      title: "Vendas de Bikes",
      description: "Bikes de alta qualidade para todos os perfis e modalidades",
    },
    {
      icon: <Wrench className="w-8 h-8" />,
      title: "Oficina Especializada",
      description: "Manutenção e reparo com 25 anos de experiência",
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Aluguel de Bikes",
      description: "Alugue bikes premium para suas aventuras",
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: "Peças e Acessórios",
      description: "Componentes originais e acessórios de qualidade",
    },
  ]

  const testimonials = [
    {
      name: "Mauricio Fontenele",
      text: "Resolvem o problema, dizem exatamente o que precisa fazer e tem boas peças de reposição",
      rating: 5,
    },
    {
      name: "Pedro Lobato",
      text: "Curti bastante a loja. Gostei muito do atendimento deles, comprei uma bike lá e estou satisfeito.",
      rating: 5,
    },
    {
      name: "Patricia",
      text: "Fui super bem atendida pelo seu Gilberto e esposa e seus filhos e todos que trabalham lá. Excelente atendimento, parabéns seu Gilberto, o senhor anda com profissionais no ramo da Bike.",
      rating: 5,
    },
  ]

  const benefits = [
    { icon: <Truck className="w-5 h-5" />, text: "Frete Grátis Fortaleza" },
    { icon: <Shield className="w-5 h-5" />, text: "Garantia" },
    { icon: <CreditCard className="w-5 h-5" />, text: "12x Sem Juros" },
    { icon: <Award className="w-5 h-5" />, text: "25 Anos de Experiência" },
  ]

  const faqData = [
    {
      question: "Como funciona o aluguel de bikes?",
      answer: "Oferecemos aluguel por dia, semana e mensal. Reservas podem ser feitas via WhatsApp ou presencialmente. ",
    },
    {
      question: "Qual a garantia dos produtos?",
      answer:
        "Bikes novas de alumínio tem 5 anos para quadro e 3 meses para componentes. Peças e acessórios seguem garantia do fabricante. Oferecemos suporte técnico completo.",
    },
    {
      question: "Fazem revisão de bikes?",
      answer:
        "Sim! Nossa oficina atende bikes de qualquer modelo ou marca. Temos 25 anos de experiência e técnicos especializados em todas as modalidades.",
    },
    {
      question: "Posso parcelar minha compra?",
      answer:
        "Sim! Aceitamos cartão em até 12x sem juros para bikes. Também trabalhamos com PIX à vista com desconto especial.",
    },
  ]

  const [officeServices, setOfficeServices] = useState([])

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getAllServicesOrdered()
        setOfficeServices(data.map((s) => s.nome))
      } catch (err) {
        console.error("Erro ao carregar serviços:", err)
      }
    }
    fetchServices()
  }, [])

  // access admin area shortcut
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === "A") {
        event.preventDefault()
        onAuthStateChanged(auth, (user) => {
          if (user) {
            navigate("/admin")
          } else {
            navigate("/admin/login")
          }
        })
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigate])

  // restore dark theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  // carrega destaques (usa Cloudinary quando houver)
  useEffect(() => {
    const fetchData = async () => {
      const normalizeProducts = (list = []) =>
        (list || [])
          .filter((p) => p && p.visible !== false) // respeita visibilidade
          .map((p) => {
            const imgObj = typeof p.image === "string" ? { url: p.image } : p.image
            const displayUrl = cldFill(imgObj, { w: 800, h: 600 })
            return { ...p, displayUrl }
          })

      try {
        const prods = await getFeaturedProducts() // pode retornar todos os 'featured'
        const settings = await getHomeSettings()

        const normalized = normalizeProducts(prods)
        setFeaturedProducts(normalized)
        setShowFeatured(settings.showFeaturedProducts ?? true)
      } catch (e) {
        console.error(e)
        setFeaturedProducts([])
        setShowFeatured(true)
      }
    }
    fetchData()
  }, [])

  // Preload das imagens dos destaques
  useEffect(() => {
    featuredProducts.forEach((p) => {
      if (p?.displayUrl) {
        const img = new Image()
        img.src = p.displayUrl
      }
    })
  }, [featuredProducts])

  // header scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // auto rotate testimonials and products
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
      if (featuredProducts.length > 0) {
        setCurrentProduct((prev) => (prev + 1) % featuredProducts.length)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonials.length, featuredProducts.length])

  useEffect(() => {
    if (featuredProducts.length > 0) {
      setCurrentProduct(0)
    }
  }, [featuredProducts.length])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    if (!isDarkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  const handleConsultarOS = () => {
    navigate("/consulta")
  }

  const handleWhatsApp = (message) => {
    const baseUrl = "https://api.whatsapp.com/send/?phone=558532677425&text="
    const url = `${baseUrl}${encodeURIComponent(message)}&type=phone_number&app_absent=0`
    window.open(url, "_blank")
  }

  const handleServiceClick = (serviceType) => {
    const messages = {
      vendas: "Olá! Gostaria de saber sobre os modelos de bikes disponíveis para venda.",
      aluguel: "Olá! Tenho interesse em alugar uma bike. Podem me informar sobre disponibilidade e preços?",
      pecas: "Olá! Estou procurando peças e acessórios para minha bike. Podem me ajudar?",
    }
    if (serviceType === "oficina") {
      setIsOfficeModalOpen(true)
    } else {
      handleWhatsApp(messages[serviceType])
    }
  }

  const handleOfficeServiceClick = (service) => {
    const message = `Olá! Gostaria de fazer ${service.toLowerCase()} na minha bicicleta. Podem me ajudar?`
    handleWhatsApp(message)
    setIsOfficeModalOpen(false)
  }

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 overflow-x-hidden ${isDarkMode ? "dark" : ""}`}>
      {isSnowing && (
        <Snowfall
          style={{ position: "fixed", width: "100vw", height: "100vh", zIndex: 60, pointerEvents: "none" }}
          snowflakeCount={180}
        />
      )}
      <div className="bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Benefits Bar */}
        <div className="bg-amber-500 dark:bg-amber-600 text-white py-2 overflow-hidden">
          <ResponsiveContainer>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 animate-pulse">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm font-medium">
                  {benefit.icon}
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </ResponsiveContainer>
        </div>

        {/* Header */}
        <header
          className={`fixed top-0 w-full z-50 transition-all duration-300 ${
            isScrolled
              ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border-b border-white/20 dark:border-gray-700/20 mt-0"
              : "bg-transparent mt-10"
          }`}
        >
          <ResponsiveContainer className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img src="/assets/Logo.png" alt="Sport & Bike" className="w-12 h-12" />
                <span className="text-2xl font-bold text-gray-800 dark:text-white">Sport & Bike</span>
              </div>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#servicos" className="text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors">
                  Serviços
                </a>
                <a href="#faq" className="text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors">
                  FAQ
                </a>
                <a href="#contato" className="text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors">
                  Contato
                </a>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleWhatsApp("Olá! Vim através do site.")}
                    className="text-green-500 hover:text-green-600 transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => window.open("https://www.instagram.com/sportbike_fortaleza/", "_blank")}
                    className="text-pink-500 hover:text-pink-600 transition-colors"
                    title="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => setIsSnowing((prev) => !prev)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-colors shadow-sm ${
                    isSnowing
                      ? "bg-white text-amber-600 shadow-amber-200/60"
                      : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  }`}
                >
                  <span>Clima natalina</span>
                  <span>{isSnowing ? "❄️" : ""}</span>
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  title="Alternar tema"
                >
                  {isDarkMode ? "🌞" : "🌙"}
                </button>
                <button
                  onClick={handleConsultarOS}
                  className="bg-amber-500 text-white px-6 py-2 rounded-full hover:bg-amber-600 transition-colors font-medium"
                >
                  Consultar O.S.
                </button>
              </nav>
              {/* Mobile Menu Button */}
              <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? (
                  <X className="w-6 h-6 text-gray-800 dark:text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-800 dark:text-white" />
                )}
              </button>
            </div>
            {isMenuOpen && (
              <nav className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col space-y-4 pt-4">
                  <a
                    href="#servicos"
                    className="text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors"
                  >
                    Serviços
                  </a>
                  <a href="#faq" className="text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors">
                    FAQ
                  </a>
                  <a
                    href="#contato"
                    className="text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors"
                  >
                    Contato
                  </a>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleWhatsApp("Olá! Vim através do site.")}
                      className="text-green-500 hover:text-green-600 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => window.open("https://www.instagram.com/sportbike_fortaleza/", "_blank")}
                      className="text-pink-500 hover:text-pink-600 transition-colors"
                    >
                      <Instagram className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIsSnowing((prev) => !prev)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-colors shadow-sm ${
                        isSnowing
                          ? "bg-white text-amber-600 shadow-amber-200/60"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      }`}
                    >
                      <span>Clima natalina</span>
                      <span>{isSnowing ? "❄️" : ""}</span>
                    </button>
                    <button
                      onClick={toggleDarkMode}
                      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      {isDarkMode ? "🌞" : "🌙"}
                    </button>
                  </div>
                  <button
                    onClick={handleConsultarOS}
                    className="bg-amber-500 text-white px-6 py-2 rounded-full hover:bg-amber-600 transition-colors font-medium w-fit"
                  >
                    Consultar O.S.
                  </button>
                </div>
              </nav>
            )}
          </ResponsiveContainer>
        </header>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 pointer-events-none">
              <Silk
                className="h-full w-full"
                color="#f59e0b"
                noiseIntensity={0}
                rotation={0}
                scale={1.05}
                speed={0.75}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/90 via-amber-500/90 to-amber-600/90 z-10"></div>
          </div>
          <div className="absolute top-20 right-10 sm:right-20 w-48 h-48 sm:w-72 sm:h-72 bg-white/20 rounded-full blur-xl animate-pulse z-10"></div>
          <div className="absolute bottom-20 left-10 sm:left-20 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-2xl animate-bounce z-10"></div>
          <div className="relative z-20 container mx-auto px-4 text-center text-white">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              25 Anos de
              <span className="block bg-gradient-to-r from-amber-300 to-white bg-clip-text text-transparent">
                Paixão por Bikes
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Loja de bicicletas desde 1999. Vendas de bicicleta e artigos esportivos, oficina especializada e aluguéis
              de bikes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleConsultarOS}
                className="bg-white text-gray-800 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
              >
                Consultar Ordem de Serviço
              </button>
              <button
                onClick={() => handleWhatsApp("Olá! Gostaria de alugar uma bike.")}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-gray-800 transition-all transform hover:scale-105"
              >
                Alugue sua Bike Hoje
              </button>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
            <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </section>
        {/* Featured Products Carousel */}
        {showFeatured && (
          <section className="py-20 bg-white dark:bg-gray-800">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
                  Produtos em Destaque
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Confira nossa seleção especial de bikes e acessórios
                </p>
              </div>
              <div className="relative max-w-4xl mx-auto">
                {featuredProducts.length > 0 ? (
                  <div className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl p-8 shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div>
                        <img
                          src={featuredProducts[currentProduct].displayUrl || ""}
                          alt={featuredProducts[currentProduct].name}
                          className="w-full h-64 object-cover object-center rounded-lg"
                          loading="lazy"
                        />
                      </div>
                      <div className="text-white">
                        {featuredProducts[currentProduct].category && (
                          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                            {featuredProducts[currentProduct].category}
                          </span>
                        )}
                        <h3 className="text-2xl font-bold mt-4 mb-2">
                          {featuredProducts[currentProduct].name}
                        </h3>
                        <p className="text-3xl font-bold mb-2">
                          {featuredProducts[currentProduct].price}
                        </p>
                        {featuredProducts[currentProduct].description && (
                          <p className="mb-4 text-white/90 whitespace-pre-line">
                            {featuredProducts[currentProduct].description}
                          </p>
                        )}
                        <button
                          onClick={() =>
                            handleWhatsApp(
                              `Olá! Tenho interesse na ${featuredProducts[currentProduct].name}. Podem me dar mais informações?`,
                            )
                          }
                          className="bg-white text-amber-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          <span>Tenho Interesse</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-600 dark:text-gray-300">Carregando...</div>
                )}
                {featuredProducts.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentProduct((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length)
                      }
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => setCurrentProduct((prev) => (prev + 1) % featuredProducts.length)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                  </>
                )}
                <div className="flex justify-center mt-8 space-x-2">
                  {featuredProducts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentProduct(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentProduct ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Botão para todos os produtos */}
              <div className="mt-12 flex justify-center">
                <Link
                  to="/produtos"
                  className="inline-flex items-center gap-3 rounded-full bg-amber-500 text-white px-6 py-3 font-semibold shadow-lg hover:bg-amber-600 hover:scale-105 transform transition-all duration-300 animate-pulse"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Ver todos os produtos
                </Link>
              </div>
            </div>
          </section>
        )}
        {/* Services Section */}
        <section id="servicos" className="py-20 bg-gray-50 dark:bg-gray-900">
          <ResponsiveContainer>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">Nossos Serviços</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Soluções completas para todos os tipos de ciclistas
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((service, index) => (
                <div
                  key={index}
                  onClick={() =>
                    handleServiceClick(
                      index === 0 ? "vendas" : index === 1 ? "oficina" : index === 2 ? "aluguel" : "pecas",
                    )
                  }
                  className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer"
                >
                  <div className="text-amber-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{service.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{service.description}</p>
                </div>
              ))}
            </div>
          </ResponsiveContainer>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
                Perguntas Frequentes
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Tire suas dúvidas sobre nossos serviços
              </p>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqData.map((faq, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded-lg"
                  >
                    <span className="font-semibold text-gray-800 dark:text-white">{faq.question}</span>
                    {expandedFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-amber-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-amber-500" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
                O que nossos clientes dizem
              </h2>
            </div>
            <div className="max-w-4xl mx-auto relative">
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-center mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-current" />
                  ))}
                </div>
                <p className="text-xl md:text-2xl text-center mb-6 italic">
                  &quot;{testimonials[currentTestimonial].text}&quot;
                </p>
                <p className="text-center font-bold text-lg">- {testimonials[currentTestimonial].name}</p>
              </div>
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
              >
                <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentTestimonial ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Rental Banner */}
        <section className="py-20 bg-gradient-to-r from-green-500 to-green-600">
          <div className="container mx-auto px-4 text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Aluguel de Bikes</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">Explore Fortaleza com nossas bikes.</p>
            <button
              onClick={() => handleWhatsApp("Olá! Gostaria de informações sobre aluguel de bikes.")}
              className="bg-white text-green-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl inline-flex items-center space-x-2"
            >
              <MessageCircle className="w-6 h-6" />
              <span>Fale Conosco no WhatsApp</span>
            </button>
          </div>
        </section>

        {/* Map & Contact Section */}
        <section id="contato" className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">Visite Nossa Loja</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">Estamos localizados próximos à Aldeota</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden h-[400px]">
                <iframe
                  src="https://www.google.com/maps?q=-3.7315374,-38.4851501&hl=pt-BR&z=19&output=embed"
                  className="w-full h-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localização Sport & Bike"
                ></iframe>
              </div>
              <div className="space-y-8">
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center space-x-4 mb-4">
                    <MapPin className="w-6 h-6 text-amber-500" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Endereço</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">R. Ana Bilhar, 1680 - Varjota, Fortaleza - CE</p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center space-x-4 mb-4">
                    <Phone className="w-6 h-6 text-amber-500" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Telefones</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    (85) 3267-7425 | (85) 3122-5874
                    <br />
                    WhatsApp: (85) 3267-7425
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center space-x-4 mb-4">
                    <Clock className="w-6 h-6 text-amber-500" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Horário</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Segunda a Sexta: 8h às 18h
                    <br />
                    Sábado: 8h às 15h
                    <br />
                    Domingo: Fechado
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleWhatsApp("Olá! Vim através do site.")}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-full hover:shadow-lg transition-all transform hover:scale-110"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => window.open("https://www.instagram.com/sportbike_fortaleza/", "_blank")}
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-4 rounded-full hover:shadow-lg transition-all transform hover:scale-110"
                  >
                    <Instagram className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WhatsApp Floating Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => handleWhatsApp("Olá! Preciso de ajuda.")}
            className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 animate-pulse"
            title="Fale conosco no WhatsApp"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Office Services Modal */}
        {isOfficeModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Serviços da Oficina</h3>
                  <button
                    onClick={() => setIsOfficeModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Clique no serviço desejado para solicitar via WhatsApp
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {officeServices.map((service, index) => (
                    <button
                      key={index}
                      onClick={() => handleOfficeServiceClick(service)}
                      className="text-left p-4 bg-gray-50 dark:bg-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 hover:border-amber-300 dark:hover:border-amber-600"
                    >
                      <div className="flex items-center space-x-3">
                        <Wrench className="w-5 h-5 text-amber-500" />
                        <span className="text-gray-800 dark:text-gray-200 font-medium">{service}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-gray-800 dark:bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <img src="/assets/Logo.png" alt="Sport & Bike" className="w-12 h-12" />
                  <span className="text-2xl font-bold">Sport & Bike</span>
                </div>
                <p className="text-gray-400">Desde 1999 oferecendo o melhor do ciclismo em Fortaleza.</p>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4">Contato</h4>
                <div className="space-y-2 text-gray-400">
                  <p>(85) 3267-7425 | (85) 3122-5874</p>
                  <p>WhatsApp: (85) 3267-7425</p>
                  <p>comercialsportbike@gmail.com</p>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4">Redes Sociais</h4>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleWhatsApp("Olá! Vim através do site.")}
                    className="bg-green-500 p-3 rounded-full hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => window.open("https://www.instagram.com/sportbike_fortaleza/", "_blank")}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full hover:opacity-80 transition-opacity"
                  >
                    <Instagram className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center">
              <p className="text-gray-400 mb-4">
                © {new Date().getFullYear()} Sport & Bike. Todos os direitos reservados.
              </p>
              <button
                onClick={() => {
                  onAuthStateChanged(auth, (user) => {
                    if (user) {
                      navigate("/admin")
                    } else {
                      navigate("/admin/login")
                    }
                  })
                }}
                className="text-amber-500 hover:text-amber-400 transition-colors text-sm"
              >
                Acesso Funcionários
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
