import React, { useState, useEffect } from "react";

const MechanicModal = ({ isOpen, onClose, onSave, mechanic }) => {
  const [form, setForm] = useState({ nome: "", telefone: "" });

  useEffect(() => {
    if (mechanic) {
      setForm({ nome: mechanic.nome || "", telefone: mechanic.telefone || "" });
    } else {
      setForm({ nome: "", telefone: "" });
    }
  }, [mechanic]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md">
        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">
          {mechanic ? "Editar Mecânico" : "Novo Mecânico"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Nome</label>
            <input
              name="nome"
              value={form.nome}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Telefone</label>
            <input
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MechanicModal;
