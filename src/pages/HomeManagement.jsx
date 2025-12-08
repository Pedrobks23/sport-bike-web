// src/pages/HomeManagement.jsx
"use client";
import { cldFill } from "@/utils/cloudinaryUrl";
import { deriveFeaturesPayload, getProductFeatures } from "@/utils/productFeatures";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bike,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Star,
  LayoutGrid,
  Wrench,
} from "lucide-react";

import ProductImagesManager from "@/components/products/ProductImagesManager";

import {
  listAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleVisibility,
} from "@/services/productsService";
import { getHomeSettings, updateHomeSettings } from "@/services/homeService";

const emptyProduct = {
  name: "",
  category: "",
  price: "",
  description: "",
  features: [],
  featuresText: "",
  // suporte a múltiplas imagens
  images: [],
  image: null,
  isFeatured: false,
  visible: true,
};

const ProductModal = ({ isEdit, onClose, onSave, product }) => {
  const [formData, setFormData] = useState({
    ...emptyProduct,
    ...product,
    visible: product?.visible ?? true,
    features: product?.features || [],
    featuresText: product?.featuresText || "",
    // normaliza imagens antigas
    images:
      Array.isArray(product?.images) && product.images.length
        ? product.images
        : product?.image
          ? [
              typeof product.image === "string"
                ? { id: "legacy", url: product.image, publicId: null }
                : { id: "legacy", ...product.image },
            ]
          : [],
    image:
      product?.image && typeof product.image === "string"
        ? { url: product.image, publicId: null }
        : product?.image || null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const featurePreview = getProductFeatures(formData, 20);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const sanitizedImages = Array.isArray(formData.images)
        ? formData.images.map(({ objectPosition, ...rest }) => rest)
        : []
      const { features, featuresText } = deriveFeaturesPayload(
        formData.features && formData.features.length
          ? formData.features
          : formData.featuresText,
        formData.featuresText
      )
      const payload = {
        ...formData,
        features,
        featuresText,
        images: sanitizedImages,
        image: sanitizedImages?.[0] || formData.image || null,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar produto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4 overscroll-contain">
      <div className="relative flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 max-h-[90vh] md:max-h-[85vh]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold">{isEdit ? "Editar Produto" : "Novo Produto"}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Marque <b>“Aparecer no carrossel de destaque”</b> para exibir na seção de Destaques. Use
            <b> “Produto visível”</b> para ocultar o card do produto na Home (Destaques e/ou Produtos).
          </p>
        </div>

        <form onSubmit={submit} className="flex h-full flex-col">
          <div
            data-slot="modal-body"
            className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 md:px-6 md:py-6"
          >
            <div className="grid min-h-0 grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-h-0 space-y-3">
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                />
              </div>

              <div className="min-h-0 max-h-[40vh] overflow-y-auto pr-1">
                <label className="block text-sm font-medium mb-1">Características (uma por linha)</label>
                <textarea
                  name="featuresText"
                  value={formData.featuresText}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 min-h-[160px] resize-y"
                  rows={6}
                  placeholder={"Quadro alumínio 6061\n24 marchas indexadas\nAro 29 tubeless-ready"}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Uma característica por linha. Máx. 20 itens. ({featurePreview.length} válidas)
                </p>
                {featurePreview.length > 0 && (
                  <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                    <p className="font-semibold mb-2">Pré-visualização</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {featurePreview.map((feat, idx) => (
                        <li key={idx}>{feat}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={!!formData.isFeatured}
                    onChange={handleChange}
                  />
                  <span>
                    Aparecer no carrossel de <b>destaque</b>
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="visible"
                    checked={formData.visible !== false}
                    onChange={handleChange}
                  />
                  <span>
                    Produto <b>visível</b> (exibe o card na Home)
                  </span>
                </label>
              </div>
            </div>

            <div className="min-h-0 space-y-3">
              <div className="min-h-0 max-h-[50vh] overflow-y-auto pr-1">
                <label className="block text-sm font-medium mb-1">Imagens (capa é a primeira)</label>
                <ProductImagesManager
                  value={formData.images}
                  onChange={(imgs) =>
                    setFormData((prev) => ({
                      ...prev,
                      images: imgs,
                      image: imgs?.[0] || prev.image || null,
                    }))
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Envie várias imagens, reordene para definir a capa (primeira posição) e preencha o texto alternativo.
                </p>
              </div>
            </div>
          </div>
          </div>

          <div
            data-slot="modal-footer"
            className="sticky bottom-0 z-10 flex justify-end gap-3 border-t border-gray-100 bg-white/90 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90"
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              disabled={isSubmitting}
              className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              {isEdit ? "Atualizar" : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function HomeManagement() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [products, setProducts] = useState([]);

  // Toggles de seção salvos em /home/settings
  const [settings, setSettings] = useState({
    showFeaturedProducts: true, // seção "Produtos em destaque"
    showProductsSection: true, // seção "Produtos" (grid) -> ocultar seção inteira
    showServicesSection: true, // seção "Serviços"
  });

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    const [prods, s] = await Promise.all([listAllProducts(), getHomeSettings()]);
    setProducts(prods);
    setSettings({
      showFeaturedProducts: s.showFeaturedProducts ?? true,
      showProductsSection: s.showProductsSection ?? true,
      showServicesSection: s.showServicesSection ?? true,
    });
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const filtered = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      if (!t) return true;
      return (
        (p.name || "").toLowerCase().includes(t) ||
        (p.category || "").toLowerCase().includes(t) ||
        (p.description || "").toLowerCase().includes(t)
      );
    });
  }, [products, searchTerm]);

  // CRUD handlers
  const handleAdd = async (data) => {
    // data.image já é objeto Cloudinary ou null
    const saved = await createProduct(data);
    setProducts((prev) => [saved, ...prev]);
  };

  const handleUpdate = async (data) => {
    await updateProduct(editProduct.id, data);
    setProducts((prev) => prev.map((p) => (p.id === editProduct.id ? { ...p, ...data } : p)));
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este produto?")) return;
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleProductVisibility = async (id, visibleNow) => {
    await toggleVisibility(id, !visibleNow);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, visible: !visibleNow } : p)));
  };

  // Salvar toggles de seção
  const handleSettingToggle = async (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await updateHomeSettings(next);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin")}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:opacity-90"
                title="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-amber-400 to-amber-600 p-2 rounded-full">
                  <Bike className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Gerenciar Home</h1>
                  <p className="text-xs text-gray-500">
                    Destaques, Produtos (grid) e Serviços — com opção de ocultar seção inteira e card individual.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 shadow"
            >
              <div className="inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Novo Produto</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Switches de Seção (Home) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border shadow-sm mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.showFeaturedProducts}
                onChange={() => handleSettingToggle("showFeaturedProducts")}
              />
              <span className="inline-flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Exibir seção <b>Destaques</b> (carrossel)
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.showProductsSection}
                onChange={() => handleSettingToggle("showProductsSection")}
              />
              <span className="inline-flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-blue-500" />
                Exibir seção <b>Produtos</b> (grid) — <i>oculta a seção inteira</i>
              </span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.showServicesSection}
                onChange={() => handleSettingToggle("showServicesSection")}
              />
              <span className="inline-flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-600" />
                Exibir seção <b>Serviços</b>
              </span>
            </label>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Dica: para <b>ocultar o card de um produto específico</b>, use o botão de olho no card ou desmarque “Produto visível” ao editar.
          </p>
        </div>

        {/* Barra de busca / resumo */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  placeholder="Buscar por nome, categoria, descrição"
                  className="pl-10 pr-3 py-2 rounded border w-72"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total: <b>{products.length}</b> produto(s)
            </div>
          </div>
        </div>

        {/* Lista de produtos */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {!loading &&
            filtered.map((product) => {
              // Fallback: suporta itens antigos (image string) e novos (image objeto)
              const url = cldFill(
                typeof product.image === "string" ? { url: product.image } : product.image,
                { w: 640, h: 480 } // ajuste esses números ao tamanho do seu card
              );
              return (
                <div
                  key={product.id}
                  className="group bg-white dark:bg-gray-800 rounded-xl border overflow-hidden shadow hover:shadow-lg transition"
                >
                  <div className="relative">
                    {url && (
                      <img
                        src={url}
                        alt={product.name}
                        className="w-full h-60 object-cover object-center" // <- object-center
                        loading="lazy"
                      />
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 space-y-2">
                      {product.isFeatured ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-500/90 text-white px-2 py-1 rounded">
                          <Star className="w-3 h-3" /> Destaque
                        </span>
                      ) : null}
                      {product.visible === false && (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-500/90 text-white px-2 py-1 rounded">
                          Oculto
                        </span>
                      )}
                    </div>

                    {/* Ações do card */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        onClick={() =>
                          handleToggleProductVisibility(product.id, product.visible !== false)
                        }
                        className={`p-2 rounded-full ${
                          product.visible !== false
                            ? "bg-amber-500 text-white"
                            : "bg-white/90 text-gray-800"
                        }`}
                        title={
                          product.visible !== false
                            ? "Ocultar este card de produto"
                            : "Exibir este card de produto"
                        }
                      >
                        {product.visible !== false ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setEditProduct(product);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-full bg-blue-100 hover:bg-blue-200"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 rounded-full bg-red-100 hover:bg-red-200"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-xs text-gray-500">{product.category || "Sem categoria"}</div>
                    <div className="font-semibold">{product.name || "Sem nome"}</div>
                    <div className="text-amber-600 font-bold">{product.price || "—"}</div>
                    {product.description && (
                      <div className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {product.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <Bike className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">Nenhum produto encontrado</h3>
            <p className="text-gray-500">Tente ajustar a busca ou adicione produtos</p>
          </div>
        )}
      </main>

      {showModal && (
        <ProductModal
          isEdit={!!editProduct}
          product={editProduct || emptyProduct}
          onClose={() => {
            setShowModal(false);
            setEditProduct(null);
          }}
          onSave={editProduct ? handleUpdate : handleAdd}
        />
      )}
    </div>
  );
}
