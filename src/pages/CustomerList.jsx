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
import { db, consultarOS } from "../config/firebase";
import {
  ArrowLeft,
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Bike,
} from "lucide-react";

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

  const [isDarkMode, setIsDarkMode] = useState(false);

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
  const [customerOrders, setCustomerOrders] = useState({});
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [showAddBikeModal, setShowAddBikeModal] = useState(false);
  const [newBike, setNewBike] = useState({
    marca: "",
    modelo: "",
    cor: "",
  });
  const [sortConfig, setSortConfig] = useState({ key: "nome", direction: "asc" });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

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
  const toggleCustomer = async (customer) => {
    const customerId = customer.id;
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
      return;
    }

    if (!customerBikes[customerId]) {
      try {
        const bikesRef = collection(db, `clientes/${customerId}/bikes`);
        const querySnapshot = await getDocs(bikesRef);
        const bikes = [];
        querySnapshot.forEach((doc) => {
          bikes.push({ id: doc.id, ...doc.data() });
        });
        setCustomerBikes((prev) => ({ ...prev, [customerId]: bikes }));
      } catch (error) {
        console.error("Erro ao carregar bicicletas:", error);
      }
    }

    if (!customerOrders[customerId]) {
      try {
        const ordens = await consultarOS("historico", customer.telefone || "");
        setCustomerOrders((prev) => ({ ...prev, [customerId]: ordens }));
      } catch (error) {
        console.error("Erro ao carregar ordens:", error);
      }
    }

    setExpandedCustomer(customerId);
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
      const bikesMap = {};
      await Promise.all(
        clientesData.map(async (c) => {
          const bikesRef = collection(db, `clientes/${c.id}/bikes`);
          const bikeSnap = await getDocs(bikesRef);
          const bikes = [];
          bikeSnap.forEach((b) => {
            bikes.push({ id: b.id, ...b.data() });
          });
          bikesMap[c.id] = bikes;
        })
      );

      setCustomers(clientesData);
      setCustomerBikes(bikesMap);
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
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };
  const filteredCustomers = customers
    .filter(
      (c) =>
        c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefone?.includes(searchTerm)
    )

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const aVal =
      sortConfig.key === "bikes"
        ? customerBikes[a.id]?.length || 0
        : a[sortConfig.key] || "";
    const bVal =
      sortConfig.key === "bikes"
        ? customerBikes[b.id]?.length || 0
        : b[sortConfig.key] || "";
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalClients = customers.length;
  const activeClients = customers.filter(
    (c) => c.telefone && c.telefone !== "0"
  ).length;
  const clientsWithAddress = customers.filter(
    (c) => c.endereco && c.endereco.trim() !== ""
  ).length;
  return (
    <>
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
        <div className="bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/admin')}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-400 to-purple-600 p-2 rounded-full">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciar Clientes</h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Clientes</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalClients}</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{activeClients}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Com Endereço</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{clientsWithAddress}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                  <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </div>

        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => toggleCustomer(customer)}
                className="group cursor-pointer bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {customer.nome}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">ID: {customer.id}</span>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(customer);
                        setEditedCustomer(customer);
                        setIsEditing(true);
                      }}
                      className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Editar cliente"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomer(customer.id);
                      }}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Excluir cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 mr-2" />
                    <span className="text-sm truncate">{customer.telefone || 'Não informado'}</span>
                  </div>

                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="text-sm truncate">{customer.email || 'Não informado'}</span>
                  </div>

                  <div className="flex items-start text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                    <span className="text-sm line-clamp-2">{customer.endereco || 'Não informado'}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Bike className="w-4 h-4 mr-2" />
                      <span className="text-sm">Bicicletas: {customerBikes[customer.id]?.length || 0}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowAddBikeModal(true);
                        }}
                        className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                      >
                        Adicionar
                    </button>
                    </div>
                  {expandedCustomer === customer.id && (
                    <div className="mt-4 space-y-2">
                      {customerBikes[customer.id]?.map((bike) => (
                        <div key={bike.id} className="flex items-center justify-between text-sm">
                          <span>{bike.marca} {bike.modelo} - {bike.cor}</span>
                          <div className="space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCustomer(customer);
                                setSelectedBike(bike);
                                setIsEditingBike(true);
                              }}
                              className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBike(customer.id, bike.id);
                              }}
                              className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )) || (
                        <p className="text-sm text-gray-500">Nenhuma bicicleta cadastrada</p>
                      )}
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-sm">
                        {(() => {
                          const orders = customerOrders[customer.id] || [];
                          const last = orders[0];
                          const total = orders.reduce((acc, o) => acc + (parseFloat(o.valorTotal) || 0), 0);
                          return (
                            <>
                              <p>Última OS: {last ? new Date(last.dataCriacao).toLocaleDateString("pt-BR") : "-"}</p>
                              <p>Total gasto: R$ {total.toFixed(2)}</p>
                              <p>Serviços realizados: {orders.length}</p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sortedCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">Nenhum cliente encontrado</h3>
              <p className="text-gray-500 dark:text-gray-500">Tente ajustar os filtros ou adicione novos clientes</p>
            </div>
          )}
        </div>
          <button
            onClick={() => navigate('/admin/customers/new')}
            className="fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
          </button>

        </main>
      </div>
    </div>

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
    </>
  );
};

export default CustomerList;
