/*
  HomeManagement - manage featured items with Cloudinary.
  Env vars required in .env and Vercel:
  VITE_CLOUDINARY_CLOUD_NAME=SEU_CLOUD_NAME
  VITE_CLOUDINARY_UPLOAD_PRESET=SEU_PRESET_UNSIGNED
  VITE_ADMIN_API_TOKEN=TOKEN (matches server ADMIN_API_TOKEN)
  Serverless (.vercel): CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, ADMIN_API_TOKEN
*/

import React, { useEffect, useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadImageToCloudinary, optimizeCloudinaryUrl, isCloudinaryUrl, extractPublicIdFromUrl } from '../services/cloudinary';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_API_TOKEN;

const emptyForm = {
  title: '',
  description: '',
  price: '',
  imageUrlInput: '',
  visible: true,
};

const parsePrice = (str) => {
  const normalized = String(str).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
};

const formatPrice = (num) =>
  Number(num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function deleteImageFromCloudinary(publicId) {
  if (!publicId || !ADMIN_TOKEN) return;
  try {
    await fetch('/api/cloudinary-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({ publicId }),
    });
  } catch (err) {
    console.error('Erro ao deletar imagem do Cloudinary', err);
  }
}

export default function HomeManagement() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'featured'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Optional backfill of publicId for existing Cloudinary URLs
  useEffect(() => {
    items.forEach((it) => {
      if (!it.publicId && isCloudinaryUrl(it.imageUrl)) {
        const pid = extractPublicIdFromUrl(it.imageUrl);
        if (pid) {
          updateDoc(doc(db, 'featured', it.id), { publicId: pid }).catch(() => {});
        }
      }
    });
  }, [items]);

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      let imageUrl = form.imageUrlInput;
      let imageUrlCard = form.imageUrlInput;
      let publicId = null;

      if (imageFile) {
        const { secureUrl, publicId: pid } = await uploadImageToCloudinary(imageFile);
        imageUrl = secureUrl;
        imageUrlCard = optimizeCloudinaryUrl(secureUrl);
        publicId = pid;
      } else if (form.imageUrlInput) {
        imageUrl = form.imageUrlInput;
        if (isCloudinaryUrl(imageUrl)) {
          imageUrlCard = optimizeCloudinaryUrl(imageUrl);
          publicId = extractPublicIdFromUrl(imageUrl);
        }
      }

      const baseData = {
        title: form.title,
        description: form.description,
        price: parsePrice(form.price),
        visible: form.visible,
        imageUrl,
        imageUrlCard: imageUrlCard || imageUrl,
        publicId: publicId || null,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        const original = items.find((i) => i.id === editingId);
        if (original) {
          const imageChanged =
            imageFile || form.imageUrlInput !== original.imageUrl;
          if (imageChanged && original.publicId) {
            await deleteImageFromCloudinary(original.publicId);
          }
          // If switched to external URL, ensure publicId null
          if (imageChanged && !imageFile && form.imageUrlInput && !isCloudinaryUrl(form.imageUrlInput)) {
            baseData.publicId = null;
            baseData.imageUrlCard = form.imageUrlInput;
          }
        }
        await updateDoc(doc(db, 'featured', editingId), baseData);
      } else {
        await addDoc(collection(db, 'featured'), {
          ...baseData,
          createdAt: serverTimestamp(),
        });
      }
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      description: item.description || '',
      price: String(item.price).replace('.', ','),
      imageUrlInput: item.imageUrl || '',
      visible: item.visible ?? true,
    });
    setImageFile(null);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Remover este item?')) return;
    if (item.publicId) {
      await deleteImageFromCloudinary(item.publicId);
    }
    await deleteDoc(doc(db, 'featured', item.id));
  };

  const toggleVisible = async (item) => {
    await updateDoc(doc(db, 'featured', item.id), {
      visible: !item.visible,
      updatedAt: serverTimestamp(),
    });
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Destaques da Home</h1>
      <form onSubmit={handleSubmit} className="space-y-2 mb-8">
        <input
          className="w-full border px-3 py-2"
          placeholder="Título"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          className="w-full border px-3 py-2"
          placeholder="Descrição"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          className="w-full border px-3 py-2"
          placeholder="Preço"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          className="w-full border px-3 py-2"
          placeholder="URL da imagem"
          value={form.imageUrlInput}
          onChange={(e) => setForm({ ...form, imageUrlInput: e.target.value })}
        />
        <input
          type="file"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={form.visible}
            onChange={(e) => setForm({ ...form, visible: e.target.checked })}
          />
          <span>Visível</span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="bg-amber-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          {editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {editingId ? 'Atualizar' : 'Adicionar'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="ml-2 px-4 py-2 border rounded"
          >
            Cancelar
          </button>
        )}
      </form>

      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="border p-4 rounded flex items-center space-x-4">
            <img
              src={item.imageUrlCard || item.imageUrl}
              alt={item.title}
              className="w-24 h-24 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
              <p className="font-semibold">{formatPrice(item.price)}</p>
            </div>
            <button
              onClick={() => toggleVisible(item)}
              className="p-2"
            >
              {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button onClick={() => startEdit(item)} className="p-2">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={() => handleDelete(item)} className="p-2 text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
