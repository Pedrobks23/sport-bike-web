import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Search } from "lucide-react";

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showServiceHistory, setShowServiceHistory] = useState(false);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editedCustomer, setEditedCustomer] = useState(null);

  useEffect(() => {
    const q = collection(db, "customers");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const customersArr = [];
      querySnapshot.forEach((doc) => {
        customersArr.push({ id: doc.id, ...doc.data() });
      });
      setCustomers(customersArr);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleViewServiceHistory = async (clientId, phone) => {
    setLoading(true);
    try {
      // Nova query que busca pelo telefone no termoBusca
      const q = query(
        collection(db, "ordens"),
        where("termoBusca", ">=", phone),
        where("termoBusca", "<=", phone + "\uf8ff")
      );

      console.log("Buscando ordens para telefone:", phone);

      const querySnapshot = await getDocs(q);
      const history = [];

      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() });
      });

      console.log("Total de ordens encontradas:", history.length);
      setServiceHistory(history);
      setShowServiceHistory(true);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const ServiceHistoryModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Histórico de Serviços
          </h2>
          <button
            onClick={() => setShowServiceHistory(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            Fechar
          </button>
        </div>

        {loading ? (
          <p>Carregando...</p>
        ) : serviceHistory.length === 0 ? (
          <p className="text-gray-600">
            Nenhum serviço encontrado para este cliente.
          </p>
        ) : (
          <div className="space-y-4">
            {serviceHistory.map((ordem) => (
              <div key={ordem.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">OS #{ordem.sequencial}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium 
                    ${
                      ordem.status === "Concluído"
                        ? "bg-green-100 text-green-800"
                        : ordem.status === "Em andamento"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {ordem.status || "Pendente"}
                  </span>
                </div>

                <p className="text-gray-600 mb-1">
                  Data:{" "}
                  {ordem.dataCriacao
                    ? new Date(ordem.dataCriacao).toLocaleDateString()
                    : "N/A"}
                </p>

                {ordem.termoBusca && (
                  <p className="text-gray-700">Cliente: {ordem.termoBusca}</p>
                )}

                {ordem.bicicletas && ordem.bicicletas.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Bicicletas:</p>
                    <ul className="list-disc list-inside">
                      {ordem.bicicletas.map((bike, index) => (
                        <li key={index} className="text-gray-600">
                          {bike}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ordem.valorTotal && (
                  <p className="text-gray-600 mt-2 font-medium">
                    Valor total: R$ {ordem.valorTotal}
                  </p>
                )}

                {ordem.totalBikes && (
                  <p className="text-gray-600">
                    Total de bicicletas: {ordem.totalBikes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Carregar clientes
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

  // Filtrar clientes
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.telefone?.includes(searchTerm)
  );

  // Atualizar cliente
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

  // Remover cliente
  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm("Tem certeza que deseja remover este cliente?")) return;

    try {
      await deleteDoc(doc(db, "clientes", customerId));
      await loadCustomers();
      setSelectedCustomer(null);
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
        {/* Campo de busca */}
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

        {/* Lista de clientes */}
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

                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      handleViewServiceHistory(customer.id, customer.telefone)
                    }
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                  >
                    Histórico
                  </button>
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

      {/* Modais */}
      {showServiceHistory && <ServiceHistoryModal />}
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
    </div>
  );
};

export default CustomerList;
