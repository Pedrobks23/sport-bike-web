let featuredProducts = [
  { id: '1', name: 'Bike A', price: '1000', image: '', category: 'bike' },
];
let homeSettings = { showFeaturedProducts: true };

export const getFeaturedProducts = async () => featuredProducts;

export const createFeaturedProduct = async ({ imageFile, ...data }) => {
  const product = { id: Date.now().toString(), ...data };
  featuredProducts.push(product);
  return product;
};

export const updateFeaturedProduct = async (id, data) => {
  featuredProducts = featuredProducts.map((p) => (p.id === id ? { ...p, ...data } : p));
};

export const deleteFeaturedProduct = async (id) => {
  featuredProducts = featuredProducts.filter((p) => p.id !== id);
};

export const getHomeSettings = async () => homeSettings;

export const updateHomeSettings = async (data) => {
  homeSettings = { ...homeSettings, ...data };
};
