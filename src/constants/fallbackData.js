// Dados padrão para uso quando a leitura do Firestore não está disponível (permissão ou offline)
export const fallbackFeaturedProducts = [
  {
    id: "fallback-bike-1",
    name: "Bike Speed Carbon",
    category: "Estrada",
    price: "R$ 15.990",
    description: "Quadro de carbono, grupo Shimano 105 e rodas leves para longas distâncias.",
    image: {
      url: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80",
    },
    visible: true,
    isFeatured: true,
  },
  {
    id: "fallback-bike-2",
    name: "Mountain Bike Trail",
    category: "MTB",
    price: "R$ 8.490",
    description: "Suspensão de 120mm, freios hidráulicos e pneus de tração para trilhas técnicas.",
    image: {
      url: "https://images.unsplash.com/photo-1529429617124-aee7e4a10a79?auto=format&fit=crop&w=1200&q=80",
    },
    visible: true,
    isFeatured: true,
  },
  {
    id: "fallback-bike-3",
    name: "Bicicleta Urbana",
    category: "Cidade",
    price: "R$ 3.290",
    description: "Modelo confortável com bagageiro e pneus 700x35 para deslocamentos diários.",
    image: {
      url: "https://images.unsplash.com/photo-1509395287392-19ef0c88b6af?auto=format&fit=crop&w=1200&q=80",
    },
    visible: true,
    isFeatured: true,
  },
];

export const fallbackServices = [
  {
    id: "srv-1",
    nome: "Revisão Completa",
    descricao: "Troca de cabos, regulagem de marchas e freios, limpeza e lubrificação.",
    valor: 350,
  },
  {
    id: "srv-2",
    nome: "Bike Fit",
    descricao: "Ajuste personalizado de posição para conforto e performance.",
    valor: 280,
  },
  {
    id: "srv-3",
    nome: "Montagem de Bike",
    descricao: "Montagem profissional de bikes novas com torque controlado.",
    valor: 420,
  },
];
