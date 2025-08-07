import React, { useState, useEffect } from "react";
import { ArrowLeft, PlusCircle, Edit, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MechanicModal from "../components/MechanicModal";
import { listMechanics, addMechanic, updateMechanic, deleteMechanic } from "../services/mechanicService";

const MechanicsManagement = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mechanics, setMechanics] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    loadMechanics();
  }, []);

  const loadMechanics = async () => {
    try {
      const data = await listMechanics();
      setMechanics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (form) => {
    try {
      if (editing) {
        await updateMechanic(editing.id, form);
      } else {
        await addMechanic(form);
      }
      setModalOpen(false);
      setEditing(null);
      loadMechanics();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir?")) return;
    try {
      await deleteMechanic(id);
      loadMechanics();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <header className="bg-white dark:bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => window.history.back()} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Mecânicos</h1>
          </div>
          <button onClick={() => setModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
            <PlusCircle className="w-4 h-4" />
            <span>Novo</span>
          </button>
        </header>
        <main className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mechanics.map((m) => (
              <div
                key={m.id}
                className="relative bg-white dark:bg-gray-800 p-4 rounded-xl shadow cursor-pointer"
                onClick={() => navigate(`/admin/mecanicos/${m.id}`)}
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{m.nome}</h3>
                {m.telefone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{m.telefone}</p>
                )}
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(m);
                      setModalOpen(true);
                    }}
                    className="p-1 rounded-full bg-gray-200 dark:bg-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(m.id);
                    }}
                    className="p-1 rounded-full bg-gray-200 dark:bg-gray-700"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
        <MechanicModal
          isOpen={modalOpen}
          mechanic={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default MechanicsManagement;
