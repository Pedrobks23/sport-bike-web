import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Correção para o ícone do marcador do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LOJA_COORDENADAS = {
  lat: -3.7335843,
  lng: -38.4817359
}

const Home = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        navigate('/admin');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  const services = [
    {
      title: "Vendas de Bicicletas",
      description: "Bicicletas e artigos esportivos de qualidade",
      icon: "🚴"
    },
    {
      title: "Oficina Especializada",
      description: "Manutenção profissional para sua bike",
      icon: "🛠️"
    },
    {
      title: "Aluguel de Bikes",
      description: "Alugue uma bike e aproveite seu passeio",
      icon: "🚲"
    },
    {
      title: "Experiência",
      description: "Mais de 20 anos no mesmo lugar",
      icon: "⭐"
    }
  ]

  return (
    <div className="min-h-screen bg-[#f5f5f5] relative overflow-x-hidden">
      {/* Gradientes de fundo */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] 
        bg-[#FFC107] rounded-full opacity-20 blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] 
        bg-[#FFC107] rounded-full opacity-20 blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Header */}
      <header className="relative z-10 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <img src="/assets/Logo.png" alt="Sport & Bike" className="h-20 sm:h-24 md:h-32" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-center sm:text-left">
            <a 
              href="tel:8532677425" 
              className="flex items-center justify-center sm:justify-start gap-2 text-[#333] hover:text-[#FFC107] transition-colors text-sm sm:text-base"
            >
              📞 (85) 3267-7425
            </a>
            <a 
              href="https://www.instagram.com/sportbike_fortaleza/" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center sm:justify-start gap-2 text-[#333] hover:text-[#FFC107] transition-colors text-sm sm:text-base"
            >
              📸 @sportbike_fortaleza
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-10 sm:py-20 bg-gradient-to-b from-white to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-[#333] mb-6">
              Sport & Bike
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-4">
              Desde 1999 - Há mais de 20 anos no mesmo lugar
            </p>
            <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-12">
              Sua loja especializada em bikes em Fortaleza
            </p>
            <button 
              onClick={() => navigate('/consulta')}
              className="w-full sm:w-auto btn bg-[#FFC107] text-[#333] px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"
            >
              Consultar Ordem de Serviço
            </button>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section className="relative z-10 py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#333] mb-12">
            Nossos Serviços
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {services.map((service, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow p-4 sm:p-6">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{service.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold text-[#333] mb-2">
                  {service.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA WhatsApp */}
      <section className="relative z-10 py-16 sm:py-20 bg-[#FFC107]/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[#333] mb-6">
            Entre em contato pelo WhatsApp
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Tire suas dúvidas, solicite orçamentos ou agende seu serviço
          </p>
          <a 
            href={`https://wa.me/558532677425`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5C] text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg shadow-lg hover:-translate-y-1 transition-all text-base sm:text-lg w-full sm:w-auto mx-4"
          >
            <span className="text-xl sm:text-2xl">💬</span> Falar pelo WhatsApp
          </a>
        </div>
      </section>

        {/* Localização com Mapa */}
    <section className="relative z-10 py-16 sm:py-20 bg-white">
    <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-[#333] mb-12">Nossa Localização</h2>
        <div className="max-w-4xl mx-auto">
        <div className="bg-gray-100 p-4 sm:p-6 rounded-lg mb-8">
            <p className="text-lg sm:text-xl mb-4">
            <strong>📍 Endereço:</strong>
            </p>
            <p className="text-base sm:text-lg text-gray-600 mb-4">
            R. Ana Bilhar, 1680 - Varjota<br />
            Fortaleza - CE, 60160-110
            </p>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
            <strong>Telefones:</strong><br />
            (85) 3267-7425 | (85) 3122-5874
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
            <a 
                href="https://www.waze.com/ul?ll=-3.731500629550978,-38.48570288709533&navigate=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#33ccff] text-white px-6 py-2 rounded-lg hover:bg-[#28a4cc] transition-colors"
            >
                Abrir no Waze
            </a>
            <a 
                href="https://www.google.com/maps/search/?api=1&query=-3.731500629550978,-38.48570288709533"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#4285F4] text-white px-6 py-2 rounded-lg hover:bg-[#3367D6] transition-colors"
            >
                Abrir no Google Maps
            </a>
            </div>
        </div>
        
        {/* Mapa */}
        <div className="h-[400px] rounded-lg overflow-hidden shadow-lg">
            <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d995.3399646620009!2d-38.48570288709533!3d-3.731500629550978!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7c74878a1947be5%3A0x26b8517840f9b106!2sSport%20%26%20Bike!5e0!3m2!1spt-BR!2sbr!4v1733699924589!5m2!1spt-BR!2sbr" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            />
        </div>
        </div>
    </div>
    </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white border-t mt-auto">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="text-center md:text-left">
              <img src="/assets/Logo.png" alt="Sport & Bike" className="h-12 sm:h-16 mx-auto md:mx-0 mb-4" />
              <p className="text-sm sm:text-base text-gray-600">
                Loja de bicicletas desde 1999<br />
                Vendas de bicicleta e artigos esportivos<br />
                Oficina especializada<br />
                Aluguéis de bikes
              </p>
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-bold text-[#333] mb-4">Contato</h3>
              <p className="text-sm sm:text-base text-gray-600">
                📍 R. Ana Bilhar, 1680 - Varjota, Fortaleza - CE<br />
                📞 (85) 3267-7425 | (85) 3122-5874<br />
                📱 WhatsApp: (85) 3267-7425<br />
                📸 @sportbike_fortaleza
              </p>
            </div>
          </div>
          <div className="border-t mt-8 pt-8">
            <div className="flex flex-col items-center gap-4">
              <button 
                onClick={() => navigate('/admin')}
                className="text-gray-600 hover:text-[#FFC107] transition-colors px-4 py-2 rounded-lg border border-gray-200 hover:border-[#FFC107]"
              >
                Acesso Funcionários
              </button>
              <p className="text-gray-500 text-sm">
              </p>
            </div>
            <p className="text-center text-gray-600 mt-4">
              © {new Date().getFullYear()} Sport & Bike. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home