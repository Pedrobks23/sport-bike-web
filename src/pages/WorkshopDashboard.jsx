import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import {
  getOrders,
  updateOrderStatus,
  addServiceToBike,
  addPartToBike,
  addObservation,
  removeOrder,
  updateOrderService,
  removeOrderService,
  removeOrderPart,
  updateOrderPart,
  getOrder,
  getServices, // Novo: buscar tabela de serviços
} from "../services/orderService";

const WorkshopDashboard = () => {
  const navigate = useNavigate();

  // Estados principais
  const [orders, setOrders] = useState({
    pending: [],
    inProgress: [],
    done: [],
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para modais e seleção
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [showEditPartModal, setShowEditPartModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBikeIndex, setSelectedBikeIndex] = useState(null);
  const [selectedPeca, setSelectedPeca] = useState(null);

  // Novo: estado para tabela de serviços
  const [serviceTable, setServiceTable] = useState({});

  // Carregar ordens e tabela de serviços ao montar o componente
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        const [ordersData, servicesData] = await Promise.all([
          getOrders(),
          getServices(),
        ]);

        setOrders(ordersData);
        setServiceTable(servicesData);
      } catch (err) {
        console.error("Erro ao inicializar:", err);
        setError("Erro ao carregar dados. Por favor, recarregue a página.");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error("Erro ao carregar ordens:", err);
      setError("Erro ao carregar ordens");
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para formatação de moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  // Função para verificar se um serviço é da tabela padrão
  const isDefaultService = (serviceName) => {
    return serviceTable.hasOwnProperty(serviceName);
  };

  // Função para obter valor padrão de um serviço
  const getDefaultServiceValue = (serviceName) => {
    return serviceTable[serviceName] || null;
  };

  // Atualização de ordem
  const handleOrderUpdate = async () => {
    try {
      await loadOrders();
      if (selectedOrder) {
        const updatedOrder = await getOrder(selectedOrder.id);
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error);
      setError("Erro ao atualizar ordem");
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/admin/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      setError("Erro ao fazer logout");
    }
  };

  // Filtro de ordens baseado na busca
  const filteredOrders = {
    pending: orders.pending.filter(
      (order) =>
        order.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.cliente?.telefone?.includes(searchTerm)
    ),
    inProgress: orders.inProgress.filter(
      (order) =>
        order.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.cliente?.telefone?.includes(searchTerm)
    ),
    done: orders.done.filter(
      (order) =>
        order.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.cliente?.telefone?.includes(searchTerm)
    ),
  };
  // Manipulador de drag and drop
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;

    if (sourceColumn === destColumn) return;

    try {
      // Atualização local primeiro para UI responsiva
      const newOrders = { ...orders };
      const movedOrder = orders[sourceColumn].find(
        (order) => order.id === draggableId
      );

      newOrders[sourceColumn] = orders[sourceColumn].filter(
        (order) => order.id !== draggableId
      );
      newOrders[destColumn] = [
        ...orders[destColumn],
        { ...movedOrder, status: destColumn },
      ];

      setOrders(newOrders);

      // Mapeamento de colunas para status
      const statusMap = {
        pending: "Pendente",
        inProgress: "Em Andamento",
        done: "Pronto",
      };

      const newStatus = statusMap[destColumn];
      if (!newStatus) {
        throw new Error(`Status inválido: ${destColumn}`);
      }

      await updateOrderStatus(draggableId, newStatus);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      // Rollback em caso de erro
      loadOrders();
      setError("Erro ao atualizar status da ordem");
    }
  };

  // Componente OrderCard
  const OrderCard = ({ order }) => {
    const [showStatusMenu, setShowStatusMenu] = useState(false);

    // Calcula o total dos serviços considerando descontos
    const calculateServiceTotal = (bike) => {
      if (!bike.services || !bike.serviceValues) return 0;

      return Object.entries(bike.services).reduce(
        (total, [serviceName, quantity]) => {
          const serviceValue = bike.serviceValues[serviceName];
          if (!serviceValue) return total;

          const valorFinal = serviceValue.valorFinal || 0;
          return total + valorFinal * quantity;
        },
        0
      );
    };

    // Calcula o total das peças
    const calculatePartsTotal = (bike) => {
      if (!bike.pecas) return 0;
      return bike.pecas.reduce(
        (total, peca) => total + (parseFloat(peca.valor) || 0),
        0
      );
    };

    // Calcula o total geral da ordem
    const calculateOrderTotal = () => {
      if (!order.bicicletas) return 0;
      return order.bicicletas.reduce((total, bike) => {
        const serviceTotal = calculateServiceTotal(bike);
        const partsTotal = calculatePartsTotal(bike);
        return total + serviceTotal + partsTotal;
      }, 0);
    };

    const handleStatusChange = async (newStatus) => {
      try {
        setShowStatusMenu(false);
        await updateOrderStatus(order.id, newStatus);
        await handleOrderUpdate();
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
        setError("Erro ao atualizar status da ordem");
      }
    };

    const handleRemove = async () => {
      const isConfirmed = window.confirm(
        `Tem certeza que deseja remover a OS ${order.codigo}?\nEsta ação não pode ser desfeita.`
      );

      if (isConfirmed) {
        try {
          await removeOrder(order.id);
          await handleOrderUpdate();
        } catch (error) {
          console.error("Erro ao remover ordem:", error);
          setError("Erro ao remover a ordem de serviço");
        }
      }
    };

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm mb-3 cursor-pointer hover:shadow-md transition-shadow relative">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg">{order.codigo}</span>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusMenu(!showStatusMenu);
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              •••
            </button>
            {showStatusMenu && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1" role="menu">
                  <button
                    onClick={() => handleStatusChange("Pendente")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Pendente
                  </button>
                  <button
                    onClick={() => handleStatusChange("Em Andamento")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Em Andamento
                  </button>
                  <button
                    onClick={() => handleStatusChange("Pronto")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Pronto
                  </button>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={handleRemove}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Remover OS
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          onClick={() => {
            setSelectedOrder(order);
            setShowModal(true);
          }}
        >
          <div className="flex flex-col gap-1">
            <p className="text-gray-700 text-sm">
              <strong>Data:</strong>{" "}
              {new Date(order.dataCriacao).toLocaleDateString()}
            </p>
            {order.dataAgendamento && (
              <p className="text-gray-600 text-sm">
                <strong>Agendamento:</strong>{" "}
                {new Date(order.dataAgendamento).toLocaleDateString()}
              </p>
            )}
            <p className="text-gray-600 text-sm">
              <strong>Total:</strong> {formatCurrency(calculateOrderTotal())}
            </p>
          </div>

          <div className="mt-2">
            {order.bicicletas?.map((bike, index) => (
              <div key={index} className="text-xs text-gray-500">
                {bike.marca} {bike.modelo} ({bike.cor})
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-2 text-sm">
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                order.status === "Pendente"
                  ? "bg-yellow-100 text-yellow-800"
                  : order.status === "Em Andamento"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {order.status}
            </span>
            <span>{order.cliente?.telefone}</span>
          </div>
        </div>
      </div>
    );
  };
  // Componente OrderDetails
  const OrderDetails = ({ order, onUpdate, onClose }) => {
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [showPartModal, setShowPartModal] = useState(false);
    const [showObsModal, setShowObsModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [localOrder, setLocalOrder] = useState(order);

    // Atualiza estado local quando a ordem muda
    useEffect(() => {
      setLocalOrder(order);
    }, [order]);

    // Função auxiliar para calcular valor com desconto
    const calculateServiceValue = (serviceName, serviceData, quantity) => {
      if (!serviceData) return 0;

      if (serviceData.custom) {
        return serviceData.valorFinal * quantity;
      }

      const valorBase = serviceData.valorPadrao * quantity;
      const desconto = serviceData.desconto || 0;
      return valorBase - valorBase * (desconto / 100);
    };

    // Função auxiliar para atualizar estado local e propagar mudanças
    const updateLocalAndParent = async (callback) => {
      try {
        setLoading(true);
        await callback();
        if (onUpdate) {
          await onUpdate();
        }
      } catch (error) {
        console.error("Erro na operação:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    };

    // Manipulador de edição de serviço
    const handleEditService = async (
      bikeIndex,
      oldServiceName,
      updatedService
    ) => {
      console.log("Início handleEditService", {
        bikeIndex,
        oldServiceName,
        updatedService,
      });

      try {
        const serviceToUpdate = {
          ...updatedService,
          nome: updatedService.nome,
          quantidade: parseInt(updatedService.quantidade),
          valor: parseFloat(updatedService.valor || 0),
          valorFinal: parseFloat(updatedService.valor || 0),
        };

        console.log("serviceToUpdate:", serviceToUpdate);

        await updateLocalAndParent(async () => {
          console.log("Iniciando updateOrderService");
          await updateOrderService(
            localOrder.id,
            bikeIndex,
            oldServiceName,
            serviceToUpdate
          );
          console.log("updateOrderService concluído");

          // Atualiza estado local
          const updatedOrder = { ...localOrder };
          console.log("Order antes da atualização:", updatedOrder);

          const bike = updatedOrder.bicicletas[bikeIndex];

          // Remove serviço antigo se nome mudou
          if (oldServiceName !== serviceToUpdate.nome) {
            delete bike.services[oldServiceName];
            if (bike.serviceValues) {
              delete bike.serviceValues[oldServiceName];
            }
          }

          // Adiciona serviço atualizado
          bike.services[serviceToUpdate.nome] = serviceToUpdate.quantidade;
          if (!bike.serviceValues) {
            bike.serviceValues = {};
          }
          bike.serviceValues[serviceToUpdate.nome] = {
            valorFinal: serviceToUpdate.valor,
            valor: serviceToUpdate.valor,
          };

          console.log("Order depois da atualização:", updatedOrder);
          setLocalOrder(updatedOrder);
        });

        console.log("Fechando modal");
        setShowEditServiceModal(false);
      } catch (error) {
        console.error("Erro ao editar serviço:", error);
        alert("Erro ao editar serviço. Por favor, tente novamente.");
      }
    };

    // Manipulador de adição de serviço
    const handleAddService = async (bikeIndex, serviceData) => {
      try {
        await updateLocalAndParent(async () => {
          const serviceName = serviceData.nome;
          const isDefaultService = serviceTable.hasOwnProperty(serviceName);

          const serviceToAdd = {
            ...serviceData,
            custom: serviceName === "custom" || !isDefaultService,
          };

          if (isDefaultService) {
            // Para serviços da tabela
            const valorPadrao = serviceTable[serviceName];
            serviceToAdd.valorPadrao = valorPadrao;
            serviceToAdd.valorFinal = valorPadrao;
            serviceToAdd.valor = valorPadrao; // Adiciona também o valor base
            serviceToAdd.desconto = 0;
          } else {
            // Para serviços personalizados
            serviceToAdd.valorFinal = parseFloat(serviceData.valor);
            serviceToAdd.valor = parseFloat(serviceData.valor);
          }

          await addServiceToBike(localOrder.id, bikeIndex, serviceToAdd);

          // Atualiza estado local
          const updatedOrder = { ...localOrder };
          if (!updatedOrder.bicicletas[bikeIndex].services) {
            updatedOrder.bicicletas[bikeIndex].services = {};
          }
          updatedOrder.bicicletas[bikeIndex].services[serviceToAdd.nome] =
            serviceToAdd.quantidade;

          if (!updatedOrder.bicicletas[bikeIndex].serviceValues) {
            updatedOrder.bicicletas[bikeIndex].serviceValues = {};
          }
          updatedOrder.bicicletas[bikeIndex].serviceValues[serviceToAdd.nome] =
            {
              valorPadrao: serviceToAdd.valorPadrao,
              valorFinal: serviceToAdd.valorFinal,
              custom: serviceToAdd.custom,
              desconto: serviceToAdd.desconto,
            };

          setLocalOrder(updatedOrder);
        });
        setShowServiceModal(false);
      } catch (error) {
        console.error("Erro ao adicionar serviço:", error);
        alert("Erro ao adicionar serviço. Por favor, tente novamente.");
      }
    };
    // Continuação do OrderDetails

    // Manipulador de remoção de serviço
    const handleRemoveService = async (bikeIndex, serviceName) => {
      if (!window.confirm(`Remover o serviço ${serviceName}?`)) return;

      try {
        await updateLocalAndParent(async () => {
          await removeOrderService(localOrder.id, bikeIndex, serviceName);

          // Atualiza estado local
          const updatedOrder = { ...localOrder };
          const bike = updatedOrder.bicicletas[bikeIndex];

          delete bike.services[serviceName];
          if (bike.serviceValues) {
            delete bike.serviceValues[serviceName];
          }

          setLocalOrder(updatedOrder);
        });
      } catch (error) {
        console.error("Erro ao remover serviço:", error);
        alert("Erro ao remover serviço. Por favor, tente novamente.");
      }
    };

    // Manipulador de adição de peça
    const handleAddPart = async (bikeIndex, partData) => {
      try {
        await updateLocalAndParent(async () => {
          await addPartToBike(localOrder.id, bikeIndex, partData);

          // Atualiza estado local
          const updatedOrder = { ...localOrder };
          if (!updatedOrder.bicicletas[bikeIndex].pecas) {
            updatedOrder.bicicletas[bikeIndex].pecas = [];
          }
          updatedOrder.bicicletas[bikeIndex].pecas.push({
            ...partData,
            valor: parseFloat(partData.valor),
          });
          setLocalOrder(updatedOrder);
        });
        setShowPartModal(false);
      } catch (error) {
        console.error("Erro ao adicionar peça:", error);
        alert("Erro ao adicionar peça. Por favor, tente novamente.");
      }
    };

    // Manipulador de remoção de peça
    const handleRemovePart = async (bikeIndex, partIndex) => {
      const peca = localOrder.bicicletas[bikeIndex].pecas[partIndex];
      if (!window.confirm(`Remover a peça ${peca.nome}?`)) return;

      try {
        await updateLocalAndParent(async () => {
          await removeOrderPart(localOrder.id, bikeIndex, partIndex);

          // Atualiza estado local
          const updatedOrder = { ...localOrder };
          updatedOrder.bicicletas[bikeIndex].pecas = updatedOrder.bicicletas[
            bikeIndex
          ].pecas.filter((_, idx) => idx !== partIndex);
          setLocalOrder(updatedOrder);
        });
      } catch (error) {
        console.error("Erro ao remover peça:", error);
        alert("Erro ao remover peça. Por favor, tente novamente.");
      }
    };

    // Manipulador de edição de peça
    const handleEditPart = async (bikeIndex, partIndex, updatedPart) => {
      try {
        await updateLocalAndParent(async () => {
          await updateOrderPart(
            localOrder.id,
            bikeIndex,
            partIndex,
            updatedPart
          );

          // Atualiza estado local
          const updatedOrder = { ...localOrder };
          updatedOrder.bicicletas[bikeIndex].pecas[partIndex] = {
            ...updatedPart,
            valor: parseFloat(updatedPart.valor),
          };
          setLocalOrder(updatedOrder);
        });
        setShowEditPartModal(false);
      } catch (error) {
        console.error("Erro ao atualizar peça:", error);
        alert("Erro ao atualizar peça. Por favor, tente novamente.");
      }
    };

    // Manipulador de adição/edição de observação
    const handleAddObservation = async (observation) => {
      try {
        setLoading(true);
        await addObservation(localOrder.id, observation);

        // Atualiza estado local
        const updatedOrder = { ...localOrder };
        updatedOrder.observacoes = observation;
        setLocalOrder(updatedOrder);

        await onUpdate();
        setShowObsModal(false);
      } catch (error) {
        console.error("Erro ao adicionar observação:", error);
        alert("Erro ao adicionar observação. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    // Calcula o total de uma bicicleta
    const calculateBikeTotal = (bike) => {
      let total = 0;

      // Soma serviços
      if (bike.services) {
        Object.entries(bike.services).forEach(([serviceName, quantity]) => {
          if (bike.serviceValues?.[serviceName]) {
            const valor = parseFloat(
              bike.serviceValues[serviceName].valor ||
                bike.serviceValues[serviceName].valorFinal ||
                0
            );
            total += valor * quantity;
          }
        });
      }

      // Soma peças
      if (bike.pecas) {
        total += bike.pecas.reduce(
          (sum, peca) => sum + parseFloat(peca.valor || 0),
          0
        );
      }

      return total;
    };

    // Calcula o total geral da ordem
    const calculateOrderTotal = () => {
      return (
        localOrder.bicicletas?.reduce((total, bike) => {
          const bikeTotal = calculateBikeTotal(bike);
          return total + bikeTotal;
        }, 0) || 0
      );
    };

    // Verifica se um serviço pode ter seu valor editado
    const canEditServiceValue = (serviceName) => {
      return !serviceTable.hasOwnProperty(serviceName);
    };

    // Continuação do OrderDetails - Renderização
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
          <div className="p-6">
            {/* Cabeçalho */}
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">{order.codigo}</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Informações do Cliente */}
            <div className="mb-6">
              <h3 className="font-bold mb-2">Cliente</h3>
              <p>
                <strong>Nome:</strong> {order.cliente?.nome}
              </p>
              <p>
                <strong>Telefone:</strong> {order.cliente?.telefone}
              </p>
              <p>
                <strong>Data de Criação:</strong>{" "}
                {new Date(order.dataCriacao).toLocaleString()}
              </p>
              {order.dataAgendamento && (
                <p>
                  <strong>Agendamento:</strong>{" "}
                  {new Date(order.dataAgendamento).toLocaleString()}
                </p>
              )}
            </div>

            {/* Lista de Bicicletas */}
            <div className="mb-6">
              <h3 className="font-bold mb-4">Bicicletas</h3>
              {order.bicicletas?.map((bike, bikeIndex) => (
                <div key={bikeIndex} className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-bold mb-2">Bike {bikeIndex + 1}</h4>
                  <p>
                    <strong>Marca:</strong> {bike.marca}
                  </p>
                  <p>
                    <strong>Modelo:</strong> {bike.modelo}
                  </p>
                  <p>
                    <strong>Cor:</strong> {bike.cor}
                  </p>

                  {/* Lista de Serviços */}
                  <div className="mt-3">
                    <p className="font-bold mb-1">Serviços:</p>
                    <ul className="list-disc list-inside">
                      {bike.services &&
                        Object.entries(bike.services).map(
                          ([serviceName, quantity]) => (
                            <li
                              key={serviceName}
                              className="flex items-center justify-between py-1"
                            >
                              <div>
                                <span className="font-medium">
                                  {serviceName}
                                </span>{" "}
                                - {quantity}x
                                <span className="ml-2 text-gray-600">
                                  {formatCurrency(
                                    bike.serviceValues?.[serviceName]
                                      ?.valorFinal || 0
                                  )}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedService({
                                      nome: serviceName,
                                      quantidade: quantity,
                                      valor:
                                        bike.serviceValues?.[serviceName]
                                          ?.valor ||
                                        bike.serviceValues?.[serviceName]
                                          ?.valorFinal ||
                                        0,
                                      isCustom: true, // Agora todos os serviços são editáveis
                                    });
                                    setSelectedBikeIndex(bikeIndex);
                                    setShowEditServiceModal(true);
                                  }}
                                  className="text-blue-500 hover:text-blue-600 text-sm"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() =>
                                    handleRemoveService(bikeIndex, serviceName)
                                  }
                                  className="text-red-500 hover:text-red-600 text-sm"
                                >
                                  Remover
                                </button>
                              </div>
                            </li>
                          )
                        )}
                    </ul>
                  </div>

                  {/* Subtotal de Serviços */}
                  {bike.services && Object.keys(bike.services).length > 0 && (
                    <div className="mt-2 text-right text-sm text-gray-600">
                      Subtotal Serviços:{" "}
                      {formatCurrency(calculateBikeTotal(bike))}
                    </div>
                  )}

                  {/* Lista de Peças */}
                  <div className="mt-3">
                    <p className="font-bold mb-1">Peças:</p>
                    <ul className="list-disc list-inside">
                      {bike.pecas?.map((peca, pecaIndex) => (
                        <li
                          key={pecaIndex}
                          className="flex items-center justify-between py-1"
                        >
                          <span>
                            {peca.nome} - {formatCurrency(peca.valor)}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedPeca({ ...peca, index: pecaIndex });
                                setSelectedBikeIndex(bikeIndex);
                                setShowEditPartModal(true);
                              }}
                              className="text-blue-500 hover:text-blue-600 text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() =>
                                handleRemovePart(bikeIndex, pecaIndex)
                              }
                              className="text-red-500 hover:text-red-600 text-sm"
                            >
                              Remover
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Subtotal de Peças */}
                  {bike.pecas && bike.pecas.length > 0 && (
                    <div className="mt-2 text-right text-sm text-gray-600">
                      Subtotal Peças:{" "}
                      {formatCurrency(
                        bike.pecas.reduce(
                          (total, peca) => total + parseFloat(peca.valor || 0),
                          0
                        )
                      )}
                    </div>
                  )}

                  {/* Botões de Adicionar */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setSelectedBikeIndex(bikeIndex);
                        setShowServiceModal(true);
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      + Serviço
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBikeIndex(bikeIndex);
                        setShowPartModal(true);
                      }}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      + Peça
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Continuação do OrderDetails - Rodapé e Modais */}

            {/* Rodapé com Total e Observações */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Total da OS:</h3>
                <p className="text-xl font-bold">
                  {formatCurrency(calculateOrderTotal())}
                </p>
              </div>
              {order.observacoes && (
                <div className="mb-4">
                  <h3 className="font-bold mb-2">Observações:</h3>
                  <p className="text-gray-700">{order.observacoes}</p>
                </div>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowObsModal(true)}
                  className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600"
                >
                  {order.observacoes
                    ? "Editar Observação"
                    : "Adicionar Observação"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Edição de Serviço */}
        {showEditServiceModal && selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">
                  {selectedService.isFixed
                    ? "Aplicar Desconto"
                    : "Editar Serviço"}
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    console.log("Valores do formulário:", {
                      nome: formData.get("nome"),
                      quantidade: formData.get("quantidade"),
                      valor: formData.get("valor"),
                    });
                    const updatedService = {
                      nome: formData.get("nome"),
                      quantidade: parseInt(formData.get("quantidade")),
                      valor: parseFloat(formData.get("valor")),
                    };
                    console.log("Serviço atualizado:", updatedService);
                    handleEditService(
                      selectedBikeIndex,
                      selectedService.nome,
                      updatedService
                    );
                  }}
                >
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Nome do Serviço
                    </label>
                    <input
                      type="text"
                      name="nome"
                      defaultValue={selectedService.nome}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      name="quantidade"
                      defaultValue={selectedService.quantidade}
                      min="1"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {selectedService.isFixed ? (
                    <>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Valor Padrão
                        </label>
                        <input
                          type="text"
                          value={formatCurrency(selectedService.valorPadrao)}
                          className="w-full px-3 py-2 border rounded bg-gray-100"
                          disabled
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Desconto (%)
                        </label>
                        <input
                          type="number"
                          name="desconto"
                          min="0"
                          max="100"
                          step="0.1"
                          defaultValue="0"
                          onChange={(e) => {
                            const desconto = parseFloat(e.target.value);
                            const valorComDesconto =
                              selectedService.valorPadrao *
                              (1 - desconto / 100);
                            document.querySelector(
                              'input[name="valor"]'
                            ).value = valorComDesconto.toFixed(2);
                          }}
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  ) : null}

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {selectedService.isFixed
                        ? "Valor Final"
                        : "Valor Unitário"}{" "}
                      (R$)
                    </label>
                    <input
                      type="number"
                      name="valor"
                      defaultValue={selectedService.valor}
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        selectedService.isFixed ? "bg-gray-50" : ""
                      }`}
                      readOnly={selectedService.isFixed}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditServiceModal(false);
                        setSelectedService(null);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {loading ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Adição de Serviço */}
        {showServiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Adicionar Serviço</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const serviceData = {
                      nome: formData.get("nome"),
                      quantidade: parseInt(formData.get("quantidade")),
                      valor: parseFloat(formData.get("valor")),
                    };
                    handleAddService(selectedBikeIndex, serviceData);
                  }}
                >
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Serviço
                    </label>
                    <input
                      type="text"
                      name="nome"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite o nome do serviço"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      name="quantidade"
                      defaultValue={1}
                      min="1"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Valor Unitário (R$)
                    </label>
                    <input
                      type="number"
                      name="valor"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setShowServiceModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                    >
                      {loading ? "Salvando..." : "Adicionar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {/* Modal de Edição de Peça */}
        {showEditPartModal && selectedPeca && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Editar Peça</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const updatedPart = {
                      nome: formData.get("nome"),
                      valor: parseFloat(formData.get("valor")),
                    };
                    handleEditPart(
                      selectedBikeIndex,
                      selectedPeca.index,
                      updatedPart
                    );
                  }}
                >
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Nome da Peça
                    </label>
                    <input
                      type="text"
                      name="nome"
                      defaultValue={selectedPeca.nome}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Valor (R$)
                    </label>
                    <input
                      type="number"
                      name="valor"
                      defaultValue={selectedPeca.valor}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditPartModal(false);
                        setSelectedPeca(null);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                    >
                      {loading ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Adição de Peça */}
        {showPartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Adicionar Peça</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const partData = {
                      nome: formData.get("nome"),
                      valor: parseFloat(formData.get("valor")),
                    };
                    handleAddPart(selectedBikeIndex, partData);
                  }}
                >
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Nome da Peça
                    </label>
                    <input
                      type="text"
                      name="nome"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Valor (R$)
                    </label>
                    <input
                      type="number"
                      name="valor"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setShowPartModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                    >
                      {loading ? "Salvando..." : "Adicionar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Observações */}
        {showObsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">
                  {order.observacoes
                    ? "Editar Observação"
                    : "Adicionar Observação"}
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleAddObservation(formData.get("observacao"));
                  }}
                >
                  <div className="mb-6">
                    <textarea
                      name="observacao"
                      defaultValue={order.observacoes}
                      className="w-full px-3 py-2 border rounded h-32 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Digite a observação..."
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setShowObsModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600"
                    >
                      {loading ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderização final do WorkshopDashboard
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <>
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-lg">Carregando...</p>
            </div>
          </div>
        )}

        <div className="min-h-screen bg-[#f5f5f5]">
          <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src="/assets/Logo.png"
                  alt="Sport & Bike"
                  className="h-10"
                />
                <h1 className="ml-4 text-xl font-bold text-[#333]">
                  Ordens de Serviço
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/admin")}
                  className="text-gray-600 hover:text-[#FFC107] transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-[#FFC107] transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="mb-6">
              <input
                type="text"
                placeholder="Buscar OS ou cliente..."
                className="w-full max-w-md px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(filteredOrders).map(([status, orders]) => (
                <div key={status}>
                  <h2 className="text-lg font-bold mb-4 flex items-center">
                    <span
                      className={`w-3 h-3 rounded-full mr-2 ${
                        status === "pending"
                          ? "bg-yellow-400"
                          : status === "inProgress"
                          ? "bg-blue-400"
                          : "bg-green-400"
                      }`}
                    ></span>
                    {status === "pending"
                      ? "Pendente"
                      : status === "inProgress"
                      ? "Em Andamento"
                      : "Pronto"}{" "}
                    ({orders.length})
                  </h2>
                  <Droppable droppableId={status}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="bg-gray-50 p-4 rounded-lg min-h-[200px]"
                      >
                        {orders.map((order, index) => (
                          <Draggable
                            key={order.id}
                            draggableId={order.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <OrderCard order={order} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </main>

          {showModal && selectedOrder && (
            <OrderDetails
              order={selectedOrder}
              onUpdate={handleOrderUpdate}
              onClose={() => setShowModal(false)}
            />
          )}
        </div>
      </>
    </DragDropContext>
  );
};

export default WorkshopDashboard;
