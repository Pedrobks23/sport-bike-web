<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFeaturedProducts,
  createFeaturedProduct,
  updateFeaturedProduct,
  deleteFeaturedProduct,
  getHomeSettings,
  updateHomeSettings,

} from "../services/homeService"
import { uploadImage } from "../services/uploadImage"

const normalizeDriveUrl = (url) => {
  if (!url) return url
  const file = url.match(/https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (file) return `https://drive.google.com/uc?export=view&id=${file[1]}`
  const open = url.match(/https?:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
  if (open) return `https://drive.google.com/uc?export=view&id=${open[1]}`
  const uc = url.match(/https?:\/\/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/)
  if (uc) return `https://drive.google.com/uc?export=view&id=${uc[1]}`
  return url
}

const emptyProduct = { name: "", price: "", image: "", category: "" }

const ProductModal = ({ isEdit, onClose, onSave, product }) => {
  const [formData, setFormData] = useState(product || emptyProduct)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(product?.image || "")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleUrlChange = (e) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, image: value }))
    setPreview(normalizeDriveUrl(value))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...formData, imageFile })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          {isEdit ? "Editar" : "Novo"} Produto
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preço</label>
            <input
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <input
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />

          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link da Imagem (Google Drive)</label>
            <input
              name="image"
              value={formData.image}
              onChange={handleUrlChange}
              className="w-full border rounded px-3 py-2 mb-2"
              placeholder="https://drive.google.com/..."
            />
            <label className="block text-sm font-medium mb-1">Upload da Imagem</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full" />
<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
            {preview && (
              <img src={preview} alt="Pré-visualização" className="mt-2 w-full h-40 object-cover rounded" />
            )}
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded">Salvar</button>

          </div>
        </form>
      </div>
    </div>
<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
  );
};

const HomeManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [showFeatured, setShowFeatured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const loadData = async () => {
    const [prods, settings] = await Promise.all([
      getFeaturedProducts(),
      getHomeSettings(),
    ]);
    setProducts(prods);
    setShowFeatured(settings.showFeaturedProducts ?? true);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (data) => {
    let imageUrl = data.image ? normalizeDriveUrl(data.image) : "";
    if (data.imageFile) {
      imageUrl = await uploadImage(data.imageFile);
    }
    await createFeaturedProduct({ ...data, image: imageUrl });
    setShowModal(false);
    loadData();
  };

  const handleUpdate = async (data) => {
    let imageUrl = editProduct.image;
    if (data.imageFile) {
      imageUrl = await uploadImage(data.imageFile);
    } else if (data.image) {
      imageUrl = normalizeDriveUrl(data.image);
    }
    await updateFeaturedProduct(editProduct.id, { ...data, image: imageUrl });
    setEditProduct(null);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Excluir produto?")) {
      await deleteFeaturedProduct(id);
      loadData();
    }
  };

  const toggleVisibility = async () => {
    const newValue = !showFeatured;
    setShowFeatured(newValue);
    await updateHomeSettings({ showFeaturedProducts: newValue });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <button onClick={() => navigate("/admin")} className="mr-4 text-gray-600 flex items-center">
              <ArrowLeft className="w-5 h-5 mr-2" />Voltar
            </button>
            <h1 className="text-2xl font-bold">Gerenciar Home</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-blue-500 text-white px-4 py-2 rounded flex items-center">
            <PlusCircle className="w-5 h-5 mr-2" />Novo Produto
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4">
        {loading ? (
          <div>Carregando...</div>
        ) : (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <input type="checkbox" checked={showFeatured} onChange={toggleVisibility} id="toggle" />
              <label htmlFor="toggle">Exibir seção de produtos em destaque</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="bg-white shadow rounded p-4">
                  <img src={p.image} alt={p.name} className="w-full h-40 object-cover rounded" />
                  <h3 className="mt-2 font-bold">{p.name}</h3>
                  <p className="text-sm text-gray-600">{p.category}</p>
                  <p className="font-semibold">{p.price}</p>
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => { setEditProduct(p); setShowModal(true); }} className="text-blue-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600"><Trash className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <ProductModal
          isEdit={!!editProduct}
          product={editProduct || emptyProduct}
<<<<< ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
          onClose={() => { setShowModal(false); setEditProduct(null); }}

          onSave={editProduct ? handleUpdate : handleAdd}
        />
      )}
    </div>
<<<<<ipwvt1-codex/aplicar-novo-modelo-de-home-com-logo-e-fluxo-atual
  );
};

export default HomeManagement;

