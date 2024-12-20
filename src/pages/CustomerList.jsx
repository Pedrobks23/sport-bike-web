import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Search, Bike } from "lucide-react";

// Componente BikeEditModal
const BikeEditModal = React.memo(
  ({ selectedBike, onUpdate, onClose, onChange }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Editar Bicicleta</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca
            </label>
            <input
              type="text"
              value={selectedBike?.marca || ""}
              onChange={(e) =>
                onChange({ ...selectedBike, marca: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modelo
            </label>
            <input
              type="text"
              value={selectedBike?.modelo || ""}
              onChange={(e) =>
                onChange({ ...selectedBike, modelo: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cor
            </label>
            <input
              type="text"
              value={selectedBike?.cor || ""}
              onChange={(e) =>
                onChange({ ...selectedBike, cor: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={onUpdate}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
);
const CustomerList = () => {
  const navigate = useNavigate();

  // Estados
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editedCustomer, setEditedCustomer] = useState(null);
  const [isEditingBike, setIsEditingBike] = useState(false);
  const [selectedBike, setSelectedBike] = useState(null);
  const [customerBikes, setCustomerBikes] = useState({});
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [showAddBikeModal, setShowAddBikeModal] = useState(false);
  const [newBike, setNewBike] = useState({
    marca: "",
    modelo: "",
    cor: "",
  });

  // Funções para manipulação de bicicletas
  const handleAddBike = async (customerId) => {
    try {
      const bikesRef = collection(db, `clientes/${customerId}/bikes`);
      await addDoc(bikesRef, {
        ...newBike,
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      });

      // Atualiza a lista de bikes do cliente
      const querySnapshot = await getDocs(bikesRef);
      const bikes = [];
      querySnapshot.forEach((doc) => {
        bikes.push({ id: doc.id, ...doc.data() });
      });

      setCustomerBikes((prev) => ({
        ...prev,
        [customerId]: bikes,
      }));

      setShowAddBikeModal(false);
      setNewBike({ marca: "", modelo: "", cor: "" });
    } catch (error) {
      console.error("Erro ao adicionar bicicleta:", error);
      alert("Erro ao adicionar bicicleta. Tente novamente.");
    }
  };

  const handleDeleteBike = async (customerId, bikeId) => {
    if (!window.confirm("Tem certeza que deseja remover esta bicicleta?"))
      return;

    try {
      const bikeRef = doc(db, `clientes/${customerId}/bikes`, bikeId);
      await deleteDoc(bikeRef);

      setCustomerBikes((prev) => ({
        ...prev,
        [customerId]: prev[customerId].filter((bike) => bike.id !== bikeId),
      }));
    } catch (error) {
      console.error("Erro ao remover bicicleta:", error);
      alert("Erro ao remover bicicleta. Tente novamente.");
    }
  };

  const handleUpdateBike = async () => {
    if (!selectedBike || !selectedCustomer) return;

    try {
      const bikeRef = doc(
        db,
        `clientes/${selectedCustomer.id}/bikes`,
        selectedBike.id
      );
      await updateDoc(bikeRef, {
        marca: selectedBike.marca,
        modelo: selectedBike.modelo,
        cor: selectedBike.cor,
        dataAtualizacao: new Date(),
      });

      const updatedBikes = customerBikes[selectedCustomer.id].map((bike) =>
        bike.id === selectedBike.id ? selectedBike : bike
      );
      setCustomerBikes((prev) => ({
        ...prev,
        [selectedCustomer.id]: updatedBikes,
      }));

      setIsEditingBike(false);
      setSelectedBike(null);
    } catch (error) {
      console.error("Erro ao atualizar bicicleta:", error);
      alert("Erro ao atualizar bicicleta. Tente novamente.");
    }
  };

  // Hook personalizado e useEffects
  const usePrevious = (value) => {
    const ref = React.useRef();
    React.useEffect(() => {
      ref.current = value;
    }, [value]);
    return ref.current;
  };

  const prevIsEditingBike = usePrevious(isEditingBike);
  useEffect(() => {
    if (!isEditingBike && prevIsEditingBike) {
      setSelectedBike(null);
    }
  }, [isEditingBike, prevIsEditingBike]);
  // Funções para carregar dados
  const loadCustomerBikes = async (customerId) => {
    try {
      if (expandedCustomer === customerId) {
        setExpandedCustomer(null);
        return;
      }

      if (customerBikes[customerId]) {
        setExpandedCustomer(customerId);
        return;
      }

      const bikesRef = collection(db, `clientes/${customerId}/bikes`);
      const querySnapshot = await getDocs(bikesRef);
      const bikes = [];
      querySnapshot.forEach((doc) => {
        bikes.push({ id: doc.id, ...doc.data() });
      });

      setCustomerBikes((prev) => ({
        ...prev,
        [customerId]: bikes,
      }));
      setExpandedCustomer(customerId);
    } catch (error) {
      console.error("Erro ao carregar bicicletas:", error);
    }
  };

  const loadCustomers = async () => {
    try {
      const customersRef = collection(db, "clientes");
      const q = query(customersRef);
      const querySnapshot = await getDocs(q);

      const clientesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCustomers(clientesData);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleUpdateCustomer = async () => {
    if (!editedCustomer || !selectedCustomer) return;

    try {
      const customerRef = doc(db, "clientes", selectedCustomer.id);
      await updateDoc(customerRef, {
        ...editedCustomer,
        dataAtualizacao: new Date(),
      });

      await loadCustomers();
      setIsEditing(false);
      setSelectedCustomer(null);
      setEditedCustomer(null);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      alert("Erro ao atualizar cliente. Tente novamente.");
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm("Tem certeza que deseja remover este cliente?")) return;

    try {
      await deleteDoc(doc(db, "clientes", customerId));
      await loadCustomers();
      setSelectedCustomer(null);

      setCustomerBikes((prev) => {
        const updated = { ...prev };
        delete updated[customerId];
        return updated;
      });
    } catch (error) {
      console.error("Erro ao remover cliente:", error);
      alert("Erro ao remover cliente. Tente novamente.");
    }
  };
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/admin")}
              className="text-gray-600 hover:text-[#FFC107] transition-colors mr-4"
            >
              Voltar
            </button>
            <h1 className="text-xl font-bold text-[#333]">
              Gerenciar Clientes
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers
            .filter(
              (customer) =>
                customer.nome
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                customer.telefone?.includes(searchTerm)
            )
            .map((customer) => (
              <div
                key={customer.id}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-bold text-[#333] mb-2">
                  {customer.nome}
                </h3>
                <p className="text-gray-600 mb-1">
                  Telefone: {customer.telefone}
                </p>
                <p className="text-gray-600 mb-4">Email: {customer.email}</p>
                <p className="text-gray-600 mb-4">
                  Endereço: {customer.endereco || "-"}
                </p>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800 flex items-center">
                      <Bike className="w-4 h-4 mr-2" />
                      Bicicletas
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowAddBikeModal(true);
                        }}
                        className="text-sm text-green-600 hover:text-green-800"
                      >
                        Adicionar
                      </button>
                      <button
                        onClick={() => loadCustomerBikes(customer.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {expandedCustomer === customer.id
                          ? "Ocultar bikes"
                          : "Ver bikes"}
                      </button>
                    </div>
                  </div>
                  {expandedCustomer === customer.id &&
                    customerBikes[customer.id]?.map((bike) => (
                      <div
                        key={bike.id}
                        className="bg-gray-50 p-3 rounded-md mb-2 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">
                            {bike.marca} {bike.modelo}
                          </p>
                          <p className="text-sm text-gray-600">
                            Cor: {bike.cor}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setSelectedBike(bike);
                              setIsEditingBike(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteBike(customer.id, bike.id)
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setEditedCustomer(customer);
                      setIsEditing(true);
                    }}
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer.id)}
                    className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {isEditingBike && (
        <BikeEditModal
          selectedBike={selectedBike}
          onChange={setSelectedBike}
          onClose={() => {
            setIsEditingBike(false);
            setSelectedBike(null);
          }}
          onUpdate={handleUpdateBike}
        />
      )}

      {isEditing && editedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">Editar Cliente</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={editedCustomer.nome || ""}
                  onChange={(e) =>
                    setEditedCustomer({
                      ...editedCustomer,
                      nome: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={editedCustomer.telefone || ""}
                  onChange={(e) =>
                    setEditedCustomer({
                      ...editedCustomer,
                      telefone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editedCustomer.email || ""}
                  onChange={(e) =>
                    setEditedCustomer({
                      ...editedCustomer,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={editedCustomer.endereco || ""}
                  onChange={(e) =>
                    setEditedCustomer({
                      ...editedCustomer,
                      endereco: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                className="px-4 py-2 text-red-600 hover:text-red-700"
              >
                Excluir
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedCustomer(null);
                  setEditedCustomer(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateCustomer}
                className="px-6 py-2 bg-blue-500 text-white rounded-md
                    hover:bg-blue-600 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddBikeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Adicionar Bicicleta</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  value={newBike.marca}
                  onChange={(e) =>
                    setNewBike({ ...newBike, marca: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo
                </label>
                <input
                  type="text"
                  value={newBike.modelo}
                  onChange={(e) =>
                    setNewBike({ ...newBike, modelo: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor
                </label>
                <input
                  type="text"
                  value={newBike.cor}
                  onChange={(e) =>
                    setNewBike({ ...newBike, cor: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowAddBikeModal(false);
                  setNewBike({ marca: "", modelo: "", cor: "" });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAddBike(selectedCustomer.id)}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
