"use client";

import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  ArrowLeft,
  Edit,
  Trash,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  deleteField,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigate } from "react-router-dom";

const ServicesManagement = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const averagePrice =
    services.length > 0
      ? (
          services.reduce((sum, s) => sum + s.valor, 0) / services.length
        ).toFixed(0)
      : 0;
  const maxPrice =
    services.length > 0 ? Math.max(...services.map((s) => s.valor)) : 0;
  const averageDuration =
    services.length > 0
      ? Math.round(
          services.reduce((sum, s) => sum + (s.tempoEstimado || 0), 0) /
            services.length
        )
      : 0;

  const getServiceColor = (index) => {
    const colors = [
      "from-blue-400 to-blue-600",
      "from-green-400 to-green-600",
      "from-purple-400 to-purple-600",
      "from-red-400 to-red-600",
      "from-amber-400 to-amber-600",
      "from-indigo-400 to-indigo-600",
      "from-pink-400 to-pink-600",
      "from-teal-400 to-teal-600",
    ];
    return colors[index % colors.length];
  };

  const loadServices = async () => {
    try {
      const servicesRef = collection(db, "servicos");
      const snapshot = await getDocs(servicesRef);

      const servicesData = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        // Para cada campo no documento, criar um serviço
        Object.entries(data).forEach(([nome, valor]) => {
          // Remove as aspas do valor se existirem
          const valorNumerico = parseFloat(valor.replace(/['"]/g, ""));

          servicesData.push({
            id: `${doc.id}_${nome}`,
            nome: nome,
            descricao: nome,
            valor: valorNumerico,
            tempoEstimado: 30, // valor padrão
          });
        });
      });

      servicesData.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      console.log("Serviços carregados:", servicesData);
      setServices(servicesData);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (serviceData) => {
    try {
      if (!serviceData.nome?.trim()) {
        alert("O nome do serviço é obrigatório");
        return;
      }

      // Pegar o documento existente
      const servicesRef = collection(db, "servicos");
      const snapshot = await getDocs(servicesRef);
      let docRef;

      if (snapshot.empty) {
        // Se não existir documento, criar um novo
        docRef = await addDoc(servicesRef, {
          [serviceData.nome]: serviceData.valor.toString(),
        });
      } else {
        // Se existir, atualizar o primeiro documento
        docRef = doc(db, "servicos", snapshot.docs[0].id);
        await updateDoc(docRef, {
          [serviceData.nome]: serviceData.valor.toString(),
        });
      }

      await loadServices();
      setShowAddModal(false);
    } catch (error) {
      console.error("Erro ao adicionar serviço:", error);
      alert("Erro ao adicionar serviço");
    }
  };

  const handleEditService = async (serviceData) => {
    try {
      const servicesRef = collection(db, "servicos");
      const snapshot = await getDocs(servicesRef);

      if (!snapshot.empty) {
        const docRef = doc(db, "servicos", snapshot.docs[0].id);

        // Remover o serviço antigo e adicionar o novo
        const oldName = selectedService.nome;
        const updates = {
          [oldName]: deleteField(), // Remove o campo antigo
          [serviceData.nome]: serviceData.valor.toString(), // Adiciona o novo
        };

        await updateDoc(docRef, updates);
        await loadServices();
        setShowEditModal(false);
        setSelectedService(null);
      }
    } catch (error) {
      console.error("Erro ao editar serviço:", error);
      alert("Erro ao editar serviço");
    }
  };

  // Adicione este componente dentro do ServicesManagement, antes do return
  const ServiceModal = ({ isEdit, onClose, onSave, selectedService }) => {
    const [formData, setFormData] = useState({
      nome: isEdit && selectedService ? selectedService.nome : "",
      descricao: isEdit && selectedService ? selectedService.descricao : "",
      valor: isEdit && selectedService ? selectedService.valor.toString() : "0",
      tempoEstimado:
        isEdit && selectedService
          ? selectedService.tempoEstimado.toString()
          : "0",
    });

    useEffect(() => {
      if (isEdit && selectedService) {
        setFormData({
          nome: selectedService.nome,
          descricao: selectedService.descricao,
          valor: selectedService.valor.toString(),
          tempoEstimado: selectedService.tempoEstimado.toString(),
        });
      }
    }, [isEdit, selectedService]);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(formData);
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">
              {isEdit ? "Editar Serviço" : "Novo Serviço"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descrição
                  </label>
                  <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    name="valor"
                    value={formData.valor}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tempo Estimado (minutos)
                  </label>
                  <input
                    type="number"
                    name="tempoEstimado"
                    value={formData.tempoEstimado}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                >
                  {isEdit ? "Atualizar" : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const handleDeleteService = async (service) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o serviço "${service.nome}"?`
      )
    ) {
      try {
        const servicesRef = collection(db, "servicos");
        const snapshot = await getDocs(servicesRef);

        if (!snapshot.empty) {
          const docRef = doc(db, "servicos", snapshot.docs[0].id);

          // Criar um objeto com o campo a ser removido
          const updates = {
            [service.nome]: deleteField(),
          };

          await updateDoc(docRef, updates);
          await loadServices();
        }
      } catch (error) {
        console.error("Erro ao excluir serviço:", error);
        alert("Erro ao excluir serviço");
      }
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/admin")}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-gray-400 to-gray-600 p-2 rounded-full">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciar Serviços</h1>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-full transition-all transform hover:scale-105 shadow-lg inline-flex items-center space-x-2"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Novo Serviço</span>
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Serviços</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{services.length}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Preço Médio</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">R$ {averagePrice}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mais Caro</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">R$ {maxPrice}</p>
                </div>
                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tempo Médio</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{averageDuration} min</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div>Carregando...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <div
                  key={service.id}
                  className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className={`bg-gradient-to-r ${getServiceColor(index)} p-4 text-white`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{service.nome}</h3>
                        <p className="text-sm opacity-90">{service.descricao}</p>
                      </div>
                      <div className="flex space-x-1 ml-4">
                        <button
                          onClick={() => {
                            setSelectedService(service);
                            setShowEditModal(true);
                          }}
                          className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                          title="Editar serviço"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service)}
                          className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                          title="Excluir serviço"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <DollarSign className="w-5 h-5 text-green-500 mr-1" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Preço</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">R$ {service.valor.toFixed(2)}</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Clock className="w-5 h-5 text-blue-500 mr-1" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Tempo</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{service.tempoEstimado} min</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-xs text-gray-500 dark:text-gray-400">ID: {service.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

      {showAddModal && (
        <ServiceModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddService}
        />
      )}

      {showEditModal && selectedService && (
        <ServiceModal
          isEdit={true}
          selectedService={selectedService}
          onClose={() => {
            setShowEditModal(false);
            setSelectedService(null);
          }}
          onSave={(id, serviceData) => handleEditService(id, serviceData)}
        />
      )}

      {showDetailsModal && selectedService && (
        <ServiceDetailsModal
          service={selectedService}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
};

export default ServicesManagement;