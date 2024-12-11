import React, { useState, useEffect } from 'react';
import { PlusCircle, ArrowLeft, Edit, Trash, Clock, DollarSign, FileText } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, deleteField } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

const ServicesManagement = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

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
          const valorNumerico = parseFloat(valor.replace(/['"]/g, ''));
          
          servicesData.push({
            id: `${doc.id}_${nome}`,
            nome: nome,
            descricao: nome,
            valor: valorNumerico,
            tempoEstimado: 30 // valor padrão
          });
        });
      });
  
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
        alert('O nome do serviço é obrigatório');
        return;
      }
  
      // Pegar o documento existente
      const servicesRef = collection(db, "servicos");
      const snapshot = await getDocs(servicesRef);
      let docRef;
      
      if (snapshot.empty) {
        // Se não existir documento, criar um novo
        docRef = await addDoc(servicesRef, {
          [serviceData.nome]: serviceData.valor.toString()
        });
      } else {
        // Se existir, atualizar o primeiro documento
        docRef = doc(db, "servicos", snapshot.docs[0].id);
        await updateDoc(docRef, {
          [serviceData.nome]: serviceData.valor.toString()
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
          [serviceData.nome]: serviceData.valor.toString() // Adiciona o novo
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
      nome: isEdit && selectedService ? selectedService.nome : '',
      descricao: isEdit && selectedService ? selectedService.descricao : '',
      valor: isEdit && selectedService ? selectedService.valor.toString() : '0',
      tempoEstimado: isEdit && selectedService ? selectedService.tempoEstimado.toString() : '0'
    });
   
    useEffect(() => {
      if (isEdit && selectedService) {
        setFormData({
          nome: selectedService.nome,
          descricao: selectedService.descricao,
          valor: selectedService.valor.toString(),
          tempoEstimado: selectedService.tempoEstimado.toString()
        });
      }
    }, [isEdit, selectedService]);
   
    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(formData);
    };
   
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };
   
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">
              {isEdit ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
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
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
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
                  <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
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
                  <label className="block text-sm font-medium text-gray-700">Tempo Estimado (minutos)</label>
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
                  {isEdit ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
   };

  const handleDeleteService = async (service) => {
    if (window.confirm(`Tem certeza que deseja excluir o serviço "${service.nome}"?`)) {
      try {
        const servicesRef = collection(db, "servicos");
        const snapshot = await getDocs(servicesRef);
        
        if (!snapshot.empty) {
          const docRef = doc(db, "servicos", snapshot.docs[0].id);
          
          // Criar um objeto com o campo a ser removido
          const updates = {
            [service.nome]: deleteField()
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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="mr-4 text-gray-600 hover:text-gray-900 flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Serviços</h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Novo Serviço
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div>Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                    <div
                        key={service.id}
                        className="bg-white overflow-hidden shadow rounded-lg"
                    >
                        <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-medium text-gray-900">
                            {service.nome || 'Sem nome'}
                            </h3>
                            <div className="flex gap-2">
                            <button
                                onClick={() => {
                                setSelectedService(service);
                                setShowEditModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => handleDeleteService(service)}
                                className="text-red-600 hover:text-red-800"
                            >
                                <Trash className="w-5 h-5" />
                            </button>
                            </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            {service.descricao || 'Sem descrição'}
                        </p>
                        <div className="mt-4">
                            <span className="text-xl font-semibold">
                            R$ {(parseFloat(service.valor || 0)).toFixed(2)}
                            </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                            Tempo estimado: {service.tempoEstimado || 0} minutos
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