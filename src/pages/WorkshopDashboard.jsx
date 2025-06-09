"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  ArrowLeft,
  Wrench,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  User,
  Phone,
  Calendar,
  DollarSign,
} from "lucide-react";
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
  getServices,
} from "../services/orderService";

// -------- ADAPTAÇÃO: Importação para PDF (sem remover nada do seu código) --------
import { jsPDF } from "jspdf";
import "jspdf-autotable";
// ---------------------------------------------------------------------------------

const PortalAwareDraggable = ({ children, ...props }) => (
  <Draggable {...props}>
    {(provided, snapshot) => {
      const child = (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            margin: 0,
            zIndex: snapshot.isDragging ? 999 : "auto",
          }}
        >
          {children}
        </div>
      );
      return snapshot.isDragging ? createPortal(child, document.body) : child;
    }}
  </Draggable>
);

const WorkshopDashboard = () => {
  const navigate = useNavigate();

  // Estados principais
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  // Estados para filtro de ordens prontas
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [daysToShow, setDaysToShow] = useState(3);

  // Estados para modais e seleção
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [showEditPartModal, setShowEditPartModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBikeIndex, setSelectedBikeIndex] = useState(null);
  const [selectedPeca, setSelectedPeca] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPartModal, setShowPartModal] = useState(false);
  const [serviceTable, setServiceTable] = useState({});

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Função para verificar se uma data está dentro do período
  const isWithinPeriod = (date, days) => {
    const orderDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() - days);
    return orderDate >= limit;
  };

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

  const getStatusColor = (status) => {
    switch (status) {
      case "Pendente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Em Andamento":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Pronto":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
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
    done: orders.done
      .filter(
        (order) =>
          (order.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.cliente?.nome
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            order.cliente?.telefone?.includes(searchTerm)) &&
          (showAllCompleted || isWithinPeriod(order.dataCriacao, daysToShow))
      )
      .sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao)), // Ordena por data, mais recente primeiro
  };

  // Manipulador de drag and drop
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;

    if (sourceColumn === destColumn) return;

    try {
      // Mapeamento correto de status
      const statusMap = {
        pending: "Pendente",
        inProgress: "Em Andamento",
        done: "Pronto",
      };

      // Atualização local primeiro para UI responsiva
      const newOrders = { ...orders };
      const movedOrder = orders[sourceColumn].find(
        (order) => order.id === draggableId
      );

      newOrders[sourceColumn] = orders[sourceColumn].filter(
        (order) => order.id !== draggableId
      );

      const newStatus = statusMap[destColumn];
      if (!newStatus) {
        throw new Error(`Status inválido: ${destColumn}`);
      }

      newOrders[destColumn] = [
        ...orders[destColumn],
        { ...movedOrder, status: newStatus }, // Usar o status mapeado aqui
      ];

      setOrders(newOrders);

      await updateOrderStatus(draggableId, newStatus);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      // Rollback em caso de erro
      loadOrders();
      setError("Erro ao atualizar status da ordem");
    }
  };

  // Dentro do WorkshopDashboard, localize e substitua APENAS a função generatePDFStore:
  const generatePDFStore = (order) => {
    try {
      const docPDF = new jsPDF();
      let yPos = 10; // posição vertical inicial

      // Função auxiliar para formatar data no estilo "DD/MM/YYYY DIA-DA-SEMANA"
      const formatDate = (dateString) => {
        if (!dateString) return "";
        const data = new Date(dateString);
        const dia = data.getDate().toString().padStart(2, "0");
        const mes = (data.getMonth() + 1).toString().padStart(2, "0");
        const ano = data.getFullYear();
        const diaDaSemana = data
          .toLocaleDateString("pt-BR", { weekday: "long" })
          .toUpperCase();
        return `${dia}/${mes}/${ano} ${diaDaSemana}`;
      };

      // Pega a dataAgendamento formatada (ou dataCriacao caso queira)
      const dataFormatada = formatDate(order.dataAgendamento);

      // Para cada bicicleta, vamos imprimir esse "bloco" de informações
      order.bicicletas?.forEach((bike, index) => {
        // Antes de cada bike, checa se precisa criar nova página
        if (yPos > 250) {
          docPDF.addPage();
          yPos = 10;
        }

        // OS e Bike
        docPDF.setFont("helvetica", "bold");
        docPDF.setFontSize(12);
        docPDF.text(`OS: ${order.codigo} | Bike ${index + 1}`, 10, yPos);
        yPos += 6;

        // Cliente e Telefone
        docPDF.text(
          `Cliente: ${order.cliente?.nome || "-"} | Tel: ${
            order.cliente?.telefone || "-"
          }`,
          10,
          yPos
        );
        yPos += 6;

        // Data
        if (dataFormatada) {
          docPDF.text(`Data: ${dataFormatada}`, 10, yPos);
          yPos += 6;
        }

        // Bicicleta
        docPDF.text(
          `Bicicleta: ${bike.marca} - ${bike.modelo} - ${bike.cor}`,
          10,
          yPos
        );
        yPos += 8;

        // SERVIÇOS
        docPDF.text("SERVIÇOS:", 10, yPos);
        yPos += 5;

        docPDF.setFont("helvetica", "normal");
        docPDF.setFontSize(11);

        let totalBike = 0;

        if (bike.services) {
          const servicesArray = Object.entries(bike.services).filter(
            ([, qty]) => qty > 0
          );

          if (servicesArray.length === 0) {
            docPDF.text("Nenhum serviço.", 10, yPos);
            yPos += 5;
          } else {
            servicesArray.forEach(([serviceName, quantity]) => {
              // Valor do serviço
              const serviceValue = parseFloat(
                bike.serviceValues?.[serviceName]?.valorFinal ||
                  bike.serviceValues?.[serviceName]?.valor ||
                  0
              );
              const subtotal = serviceValue * quantity;
              totalBike += subtotal;

              // Verifica se precisa criar nova página
              if (yPos > 270) {
                docPDF.addPage();
                yPos = 10;
              }

              docPDF.text(
                `- ${serviceName} (${quantity}x) = R$ ${subtotal.toFixed(2)}`,
                10,
                yPos
              );
              yPos += 5;
            });
          }
        } else {
          docPDF.text("Nenhum serviço.", 10, yPos);
          yPos += 5;
        }

        // PEÇAS
        docPDF.setFont("helvetica", "bold");
        docPDF.setFontSize(12);
        docPDF.text("PEÇAS:", 10, yPos);
        yPos += 5;

        docPDF.setFont("helvetica", "normal");
        docPDF.setFontSize(11);

        if (bike.pecas && bike.pecas.length > 0) {
          bike.pecas.forEach((peca) => {
            if (yPos > 270) {
              docPDF.addPage();
              yPos = 10;
            }
            const valorPeca = parseFloat(peca.valor || 0);
            totalBike += valorPeca;

            docPDF.text(
              `- ${peca.nome} = R$ ${valorPeca.toFixed(2)}`,
              10,
              yPos
            );
            yPos += 5;
          });
        } else {
          docPDF.text("Nenhuma peça.", 10, yPos);
          yPos += 5;
        }

        // Subtotal da Bike
        docPDF.setFont("helvetica", "bold");
        docPDF.setFontSize(12);
        docPDF.text(
          `Subtotal (Bike ${index + 1}): R$ ${totalBike.toFixed(2)}`,
          10,
          yPos
        );
        yPos += 10;

        // Pequeno espaço entre as bikes
      });
      let totalGeral = 0;
      order.bicicletas?.forEach((bike) => {
        let subtotal = 0;
        // Soma serviços
        if (bike.services) {
          Object.entries(bike.services).forEach(([serviceName, quantity]) => {
            const serviceValue = parseFloat(
              bike.serviceValues?.[serviceName]?.valorFinal ||
                bike.serviceValues?.[serviceName]?.valor ||
                0
            );
            subtotal += serviceValue * quantity;
          });
        }
        // Soma peças
        if (bike.pecas) {
          bike.pecas.forEach((peca) => {
            subtotal += parseFloat(peca.valor || 0);
          });
        }
        totalGeral += subtotal;
      });

      if (yPos > 270) {
        docPDF.addPage();
        yPos = 10;
      }
      docPDF.setFontSize(12);
      docPDF.setFont("helvetica", "bold");
      docPDF.text(`Total da Ordem: R$ ${totalGeral.toFixed(2)}`, 10, yPos);

      // Salva o PDF
      docPDF.save(`OS-Loja-${order.codigo}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF (Loja):", err);
      alert("Erro ao gerar PDF da loja. Tente novamente.");
    }
  };

  const generatePDFClient = async (order) => {
    try {
      const docPDF = new jsPDF();
      const pageWidth = docPDF.internal.pageSize.getWidth();
      let yPos = 50;

      const centerText = (text, y) => {
        const textWidth =
          (docPDF.getStringUnitWidth(text) * docPDF.internal.getFontSize()) /
          docPDF.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        docPDF.text(text, x, y);
      };

      const logoImg = new Image();
      logoImg.src = "/assets/Logo.png";
      await new Promise((resolve) => {
        logoImg.onload = resolve;
      });

      docPDF.addImage(logoImg, "PNG", 20, 10, 40, 40);
      docPDF.setFontSize(16);
      docPDF.setFont("helvetica", "bold");
      centerText("ORDEM DE SERVIÇO", 20);

      docPDF.setFontSize(10);
      docPDF.setFont("helvetica", "normal");
      centerText("Rua Ana Bilhar, 1680 - Varjota, Fortaleza - CE", 30);
      centerText(
        "Tel: (85) 3267-7425 | (85) 3122-5874 | WhatsApp: (85) 3267-7425",
        35
      );
      centerText("@sportbike_fortaleza | comercialsportbike@gmail.com", 40);

      docPDF.setFontSize(12);
      docPDF.setFont("helvetica", "bold");
      docPDF.text(`OS: ${order.codigo}`, 20, yPos);
      yPos += 10;

      const dataCriacao = new Date(order.dataCriacao);
      const dataAgendamento = new Date(order.dataAgendamento);

      docPDF.text(`Criada em: ${dataCriacao.toLocaleString("pt-BR")}`, 20, yPos);
      yPos += 10;
      docPDF.text(
        `Agendada para: ${dataAgendamento.toLocaleDateString("pt-BR")}`,
        20,
        yPos
      );
      yPos += 15;

      docPDF.text("DADOS DO CLIENTE", 20, yPos);
      yPos += 10;
      docPDF.setFont("helvetica", "normal");
      docPDF.text(`Nome: ${order.cliente?.nome || "-"}`, 20, yPos);
      yPos += 7;
      docPDF.text(`Telefone: ${order.cliente?.telefone || "-"}`, 20, yPos);
      yPos += 7;

      yPos += 10;
      docPDF.setFont("helvetica", "bold");
      docPDF.text("COMO CONSULTAR O ANDAMENTO DA SUA OS:", 20, yPos);
      yPos += 7;

      docPDF.setFont("helvetica", "normal");
      const tutorialLinhas = [
        "1. Acesse: https://sportbikece.vercel.app/consulta",
        "2. Digite o número da OS ou seu telefone.",
        "3. Clique em 'Consultar' para ver o status.",
      ];
      docPDF.text(tutorialLinhas, 20, yPos);
      yPos += 20;

      let totalGeral = 0;

      order.bicicletas?.forEach((bike, index) => {
        docPDF.setFont("helvetica", "bold");
        docPDF.text(
          `Bicicleta ${index + 1}: ${bike.marca} - ${bike.modelo} - ${bike.cor}`,
          20,
          yPos
        );
        yPos += 10;

        docPDF.setFont("helvetica", "bold");
        docPDF.text("Serviço", 20, yPos);
        docPDF.text("Qtd", 120, yPos);
        docPDF.text("Valor", 150, yPos);
        yPos += 8;

        let totalBike = 0;

        docPDF.setFont("helvetica", "normal");
        if (bike.services) {
          Object.entries(bike.services).forEach(([serviceName, quantity]) => {
            if (quantity > 0) {
              const serviceValue =
                bike.serviceValues?.[serviceName]?.valorFinal ||
                bike.serviceValues?.[serviceName]?.valor ||
                serviceTable[serviceName] ||
                0;
              const subtotal = serviceValue * quantity;
              totalBike += subtotal;

              docPDF.text(`• ${serviceName}`, 20, yPos);
              docPDF.text(`${quantity}`, 120, yPos);
              docPDF.text(`R$ ${subtotal.toFixed(2)}`, 150, yPos);
              yPos += 7;
            }
          });
        }

        if (bike.pecas && bike.pecas.length > 0) {
          yPos += 5;
          docPDF.setFont("helvetica", "bold");
          docPDF.text("PEÇAS:", 20, yPos);
          yPos += 7;

          docPDF.setFont("helvetica", "normal");
          bike.pecas.forEach((peca) => {
            const valorPeca = parseFloat(peca.valor) || 0;
            totalBike += valorPeca;
            docPDF.text(`• ${peca.nome}`, 20, yPos);
            docPDF.text(`R$ ${valorPeca.toFixed(2)}`, 150, yPos);
            yPos += 7;
          });
        }

        totalGeral += totalBike;
        yPos += 5;
        docPDF.setFont("helvetica", "bold");
        docPDF.text(`Subtotal: R$ ${totalBike.toFixed(2)}`, 120, yPos);
        yPos += 15;

        if (yPos > 250) {
          docPDF.addPage();
          yPos = 20;
        }
      });

      docPDF.setFont("helvetica", "bold");
      docPDF.text(`TOTAL GERAL: R$ ${totalGeral.toFixed(2)}`, 20, yPos);

      docPDF.save(`OS-Cliente-${order.codigo}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF (Cliente):", err);
    }
  };

  // --------------------------------------------------------------------------------

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

    const description = order.bicicletas
      ?.map((bike) => `${bike.marca} ${bike.modelo} (${bike.cor})`)
      .join(", ");

    return (
      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all cursor-pointer group mb-3">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {order.codigo}
          </h4>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusMenu(!showStatusMenu);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <MoreHorizontal className="w-4 h-4" />
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
          <div className="space-y-2 text-sm">
            <div className="text-gray-600 dark:text-gray-400">
              Cliente: {order.cliente?.nome}
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Data: {new Date(order.dataCriacao).toLocaleDateString()}</span>
            </div>
            {order.dataAgendamento && (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4 mr-2" />
                <span>Agendamento: {new Date(order.dataAgendamento).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>Total: {formatCurrency(calculateOrderTotal())}</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Phone className="w-4 h-4 mr-2" />
              <span>{order.cliente?.telefone}</span>
            </div>
          </div>

          <p className="text-gray-700 dark:text-gray-300 text-sm mt-3 line-clamp-2">
            {description}
          </p>

          <div className="mt-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>
      </div>
    );
  };
  // Componente OrderDetails
  const OrderDetails = ({
    order,
    onUpdate,
    onClose,
    showServiceModal,
    setShowServiceModal,
    showPartModal,
    setShowPartModal,
  }) => {
    const [showObsModal, setShowObsModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [localOrder, setLocalOrder] = useState(order);

    // Atualiza estado local quando a ordem muda
    useEffect(() => {
      setLocalOrder(order);
    }, [order]);

    // Loga mudanças nos modais para rastrear montagens/desmontagens
    useEffect(() => {
      console.log('showServiceModal changed:', showServiceModal);
    }, [showServiceModal]);

    useEffect(() => {
      console.log('showPartModal changed:', showPartModal);
    }, [showPartModal]);

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
      try {
        const serviceToUpdate = {
          ...updatedService,
          nome: updatedService.nome,
          quantidade: parseInt(updatedService.quantidade),
          valor: parseFloat(updatedService.valor || 0),
          valorFinal: parseFloat(updatedService.valor || 0),
        };

        await updateLocalAndParent(async () => {
          await updateOrderService(
            localOrder.id,
            bikeIndex,
            oldServiceName,
            serviceToUpdate
          );

          // Atualiza estado local
          const updatedOrder = { ...localOrder };
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

          setLocalOrder(updatedOrder);
        });

        setShowEditServiceModal(false);
      } catch (error) {
        console.error("Erro ao editar serviço:", error);
        alert("Erro ao editar serviço. Por favor, tente novamente.");
      }
    };

    // Manipulador de adição de serviço
    const handleAddService = async (bikeIndex, serviceData) => {
      console.log('handleAddService start', { bikeIndex, selectedBikeIndex });
      try {
        await updateLocalAndParent(async () => {
          const serviceName = serviceData.nome;
          const valor = parseFloat(serviceData.valor);
          const isDefaultService = serviceTable.hasOwnProperty(serviceName);

          const serviceToAdd = {
            ...serviceData,
            valor: valor,
            valorFinal: valor,
            custom: serviceName === "custom" || !isDefaultService,
            quantidade: parseInt(serviceData.quantidade),
          };

          if (isDefaultService) {
            // Para serviços da tabela
            const valorPadrao = serviceTable[serviceName];
            serviceToAdd.valorPadrao = valorPadrao;
            serviceToAdd.valorFinal = valorPadrao;
            serviceToAdd.valor = valorPadrao;
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
        console.log('handleAddService end', { bikeIndex, selectedBikeIndex });
      } catch (error) {
        console.error("Erro ao adicionar serviço:", error);
        alert("Erro ao adicionar serviço. Por favor, tente novamente.");
      }
    };

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
      console.log('handleAddPart start', { bikeIndex, selectedBikeIndex });
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
        console.log('handleAddPart end', { bikeIndex, selectedBikeIndex });
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

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                <div
                  key={bikeIndex}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-4 mb-4"
                >
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
                                      isCustom: true, // todos editáveis
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
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBikeIndex(bikeIndex);
                        setShowServiceModal(true);
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      + Serviço
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
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

                {/* -------- ADAPTAÇÃO: Botão de Impressão da Loja -------- */}
                <button
                  onClick={() => generatePDFStore(localOrder)}
                  className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700"
                >
                  Imprimir Versão Loja
                </button>
                <button
                  onClick={() => generatePDFClient(localOrder)}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  Imprimir Versão Cliente
                </button>
                {/* ----------------------------------------------------- */}
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
                    const updatedService = {
                      nome: formData.get("nome"),
                      quantidade: parseInt(formData.get("quantidade")),
                      valor: parseFloat(formData.get("valor")),
                    };
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
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
        <div className="bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-lg">Carregando...</p>
              </div>
            </div>
          )}

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
                    <div className="bg-gradient-to-r from-amber-400 to-amber-600 p-2 rounded-full">
                      <Wrench className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ordens de Serviço</h1>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar OS ou cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent w-64"
                    />
                  </div>
                  <button className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-800 dark:text-yellow-400 font-medium">Pendente</p>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">({orders.pending.length})</p>
                  </div>
                  <div className="bg-yellow-200 dark:bg-yellow-800 p-3 rounded-full">
                    <Clock className="w-6 h-6 text-yellow-700 dark:text-yellow-300" />
                  </div>
                </div>
              </div>

              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-800 dark:text-blue-400 font-medium">Em Andamento</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">({orders.inProgress.length})</p>
                  </div>
                  <div className="bg-blue-200 dark:bg-blue-800 p-3 rounded-full">
                    <Wrench className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                  </div>
                </div>
              </div>

              <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-800 dark:text-green-400 font-medium">Pronto</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">({orders.done.length})</p>
                  </div>
                  <div className="bg-green-200 dark:bg-green-800 p-3 rounded-full">
                    <User className="w-6 h-6 text-green-700 dark:text-green-300" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-400">🟡 Pendente ({filteredOrders.pending.length})</h3>
                </div>
                <Droppable droppableId="pending">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                      {filteredOrders.pending.map((order, index) => (
                        <PortalAwareDraggable
                          key={order.id}
                          draggableId={String(order.id)}
                          index={index}
                        >
                          <OrderCard order={order} />
                        </PortalAwareDraggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400">🔵 Em Andamento ({filteredOrders.inProgress.length})</h3>
                </div>
                <Droppable droppableId="inProgress">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                      {filteredOrders.inProgress.map((order, index) => (
                        <PortalAwareDraggable
                          key={order.id}
                          draggableId={String(order.id)}
                          index={index}
                        >
                          <OrderCard order={order} />
                        </PortalAwareDraggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-green-700 dark:text-green-400">🟢 Pronto ({filteredOrders.done.length})</h3>
                  <div className="flex items-center gap-2">
                    {!showAllCompleted && (
                      <select
                        value={daysToShow}
                        onChange={(e) => setDaysToShow(Number(e.target.value))}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value={3}>Últimos 3 dias</option>
                        <option value={7}>Última semana</option>
                        <option value={15}>Últimos 15 dias</option>
                        <option value={30}>Último mês</option>
                      </select>
                    )}
                    <button onClick={() => setShowAllCompleted(!showAllCompleted)} className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                      {showAllCompleted ? 'Mostrar menos' : 'Ver todas'}
                    </button>
                  </div>
                </div>
                <Droppable droppableId="done">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                      {filteredOrders.done.map((order, index) => (
                        <PortalAwareDraggable
                          key={order.id}
                          draggableId={String(order.id)}
                          index={index}
                        >
                          <OrderCard order={order} />
                        </PortalAwareDraggable>
                      ))}
                      {provided.placeholder}
                      { !showAllCompleted && (
                        <div className="text-center mt-4 text-gray-500 text-sm">
                          Mostrando ordens dos últimos {daysToShow} dias
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </main>

          {showModal && selectedOrder && (
            <OrderDetails
              order={selectedOrder}
              onUpdate={handleOrderUpdate}
              onClose={() => setShowModal(false)}
              showServiceModal={showServiceModal}
              setShowServiceModal={setShowServiceModal}
              showPartModal={showPartModal}
              setShowPartModal={setShowPartModal}
            />
          )}
        </div>
      </div>
    </DragDropContext>
  );
};

export default WorkshopDashboard;
