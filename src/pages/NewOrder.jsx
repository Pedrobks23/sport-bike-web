import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { ArrowLeft, PlusCircle, Trash, Edit } from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
const logo = new URL('/assets/Logo.png', import.meta.url).href;

const NewOrder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para o cliente
  const [telefone, setTelefone] = useState("");
  const [clientData, setClientData] = useState(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [newClient, setNewClient] = useState({
    nome: "",
    telefone: "",
    endereco: "",
  });

  // Estados para as bicicletas
  const [bikes, setBikes] = useState([]);
  const [selectedBikes, setSelectedBikes] = useState([]);
  const [showBikeForm, setShowBikeForm] = useState(false);
  const [newBike, setNewBike] = useState({
    marca: "",
    modelo: "",
    cor: "",
  });

  // Estados para os serviços
  const [availableServices, setAvailableServices] = useState({});
  const [selectedServices, setSelectedServices] = useState({});

  // Estado para agendamento e observações
  const [scheduledDate, setScheduledDate] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Total da ordem
  const [orderTotal, setOrderTotal] = useState(0);

  useEffect(() => {
    loadServices();
  }, []);
  // Função para carregar a tabela de serviços
  const loadServices = async () => {
    try {
      const servicosRef = collection(db, "servicos");
      const snapshot = await getDocs(servicosRef);
      const servicesData = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        Object.entries(data).forEach(([nome, valor]) => {
          const valorLimpo = valor.replace(/['"R$\s]/g, "").replace(",", ".");
          servicesData[nome] = parseFloat(valorLimpo);
        });
      });

      setAvailableServices(servicesData);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      setError("Erro ao carregar tabela de serviços");
    }
  };

  // Buscar cliente pelo telefone
  const searchClient = async () => {
    if (!telefone) return;

    try {
      setLoading(true);
      const clientRef = doc(db, "clientes", telefone);
      const clientDoc = await getDoc(clientRef);

      if (clientDoc.exists()) {
        setClientData(clientDoc.data());
        await loadClientBikes(telefone);
      } else {
        setClientData(null);
        setBikes([]);
        setShowClientForm(true);
        // Atualiza o estado do novo cliente com o telefone da busca
        setNewClient((prev) => ({
          ...prev,
          telefone: telefone,
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      setError("Erro ao buscar cliente");
    } finally {
      setLoading(false);
    }
  };

  // Carregar bicicletas do cliente
  const loadClientBikes = async (clientPhone) => {
    try {
      const bikesRef = collection(db, "clientes", clientPhone, "bikes");
      const snapshot = await getDocs(bikesRef);
      const bikesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBikes(bikesData);
    } catch (error) {
      console.error("Erro ao carregar bicicletas:", error);
      setError("Erro ao carregar bicicletas do cliente");
    }
  };

  // Funções para manipular o cliente
  const handleCreateClient = async () => {
    try {
      if (!newClient.nome || !newClient.telefone) {
        setError("Nome e telefone são obrigatórios");
        return;
      }

      setLoading(true);
      const clientRef = doc(db, "clientes", newClient.telefone);
      await setDoc(clientRef, {
        ...newClient,
        dataCriacao: serverTimestamp(),
      });

      setClientData(newClient);
      setShowClientForm(false);
      // Carregar bicicletas após criar cliente
      await loadClientBikes(newClient.telefone);
      setTelefone(newClient.telefone);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      setError("Erro ao criar novo cliente");
    } finally {
      setLoading(false);
    }
  };

  // Funções para manipular bicicletas
  const handleAddBike = async () => {
    try {
      setLoading(true);
      const bikesRef = collection(db, "clientes", telefone, "bikes");
      await addDoc(bikesRef, {
        ...newBike,
        dataCriacao: serverTimestamp(),
      });

      await loadClientBikes(telefone);
      setNewBike({ marca: "", modelo: "", cor: "" });
      setShowBikeForm(false);
    } catch (error) {
      console.error("Erro ao adicionar bicicleta:", error);
      setError("Erro ao adicionar nova bicicleta");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBike = (bikeId) => {
    setSelectedBikes((prev) => {
      if (prev.includes(bikeId)) {
        return prev.filter((id) => id !== bikeId);
      }
      return [...prev, bikeId];
    });
  };

  // Funções para manipular serviços
  const handleServiceChange = (bikeId, serviceName, quantity) => {
    setSelectedServices((prev) => ({
      ...prev,
      [bikeId]: {
        ...prev[bikeId],
        [serviceName]: quantity,
      },
    }));
  };

  // Função para gerar PDF
  const generatePDF = async (ordem) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 50;
  
      const centerText = (text, y) => {
        const textWidth = (doc.getStringUnitWidth(text) * doc.internal.getFontSize()) / doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
      };
  
      // Carrega a imagem dinamicamente
      const logoImg = new Image();
      logoImg.src = '/assets/Logo.png';
      
      await new Promise((resolve) => {
        logoImg.onload = resolve;
      });
  
      // Adiciona o logo
      doc.addImage(logoImg, "PNG", 20, 10, 40, 40);

      // Cabeçalho
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      centerText("ORDEM DE SERVIÇO", 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      centerText("Rua Ana Bilhar, 1680 - Varjota, Fortaleza - CE", 30);
      centerText(
        "Tel: (85) 3267-7425 | (85) 3122-5874 | WhatsApp: (85) 3267-7425",
        35
      );
      centerText("@sportbike_fortaleza | comercialsportbike@gmail.com", 40);

      // Informações da OS
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`OS: ${ordem.codigo}`, 20, yPos);
      yPos += 10;

      const dataCriacao = new Date(ordem.dataCriacao);
      const dataAgendamento = new Date(ordem.dataAgendamento);

      doc.text(`Criada em: ${dataCriacao.toLocaleString("pt-BR")}`, 20, yPos);
      yPos += 10;

      doc.text(
        `Agendada para: ${dataAgendamento.toLocaleString("pt-BR")}`,
        20,
        yPos
      );
      yPos += 15;
      doc.text("DADOS DO CLIENTE", 20, yPos);
      yPos += 10;
      doc.setFont("helvetica", "normal");
      doc.text(`Nome: ${ordem.cliente?.nome || "-"}`, 20, yPos);
      yPos += 7;
      doc.text(`Telefone: ${ordem.cliente?.telefone || "-"}`, 20, yPos);
      yPos += 15;

      let totalGeral = 0;

      // Processamento de cada bicicleta
      ordem.bicicletas?.forEach((bike, index) => {
        doc.setFont("helvetica", "bold");
        doc.text(
          `BICICLETA ${index + 1}: ${bike.marca} - ${bike.modelo} - ${
            bike.cor
          }`,
          20,
          yPos
        );
        yPos += 15;

        // Cabeçalho da tabela de serviços
        doc.setFont("helvetica", "bold");
        doc.text("Serviço", 20, yPos);
        doc.text("Qtd", 120, yPos);
        doc.text("Valor", 150, yPos);
        yPos += 8;

        let totalBike = 0;

        // Lista de serviços
        doc.setFont("helvetica", "normal");
        if (bike.services) {
          Object.entries(bike.services).forEach(([serviceName, quantity]) => {
            if (quantity > 0) {
              const serviceValue =
                bike.serviceValues?.[serviceName]?.valorFinal ||
                bike.serviceValues?.[serviceName]?.valor ||
                availableServices[serviceName] ||
                0;

              const subtotal = serviceValue * quantity;
              totalBike += subtotal;

              doc.text(`• ${serviceName}`, 20, yPos);
              doc.text(`${quantity}`, 120, yPos);
              doc.text(`R$ ${subtotal.toFixed(2)}`, 150, yPos);
              yPos += 7;
            }
          });
        }

        // Adiciona o subtotal da bicicleta
        totalGeral += totalBike;
        yPos += 5;
        doc.setFont("helvetica", "bold");
        doc.text(`Subtotal: R$ ${totalBike.toFixed(2)}`, 120, yPos);
        yPos += 15;

        // Verifica se precisa adicionar nova página
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
      });

      // Total geral e observações
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL GERAL: R$ ${totalGeral.toFixed(2)}`, 20, yPos);
      yPos += 15;

      if (ordem.observacoes) {
        doc.setFont("helvetica", "bold");
        doc.text("OBSERVAÇÕES:", 20, yPos);
        yPos += 7;
        doc.setFont("helvetica", "normal");
        doc.text(ordem.observacoes, 20, yPos);
        yPos += 15;
      }

      // Termos e condições
      yPos += 10;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        [
          "• O prazo para conclusão do serviço pode ser estendido em até 2 dias após a data agendada.",
          "• Caso a bicicleta ou peças não sejam retiradas no prazo de 180 dias após o término",
          "  do serviço, serão vendidas para custear as despesas.",
        ],
        20,
        yPos
      );

      doc.save(`OS-${ordem.codigo}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    }
  };

  // Calcular total da ordem
  useEffect(() => {
    let total = 0;
    Object.entries(selectedServices).forEach(([bikeId, services]) => {
      Object.entries(services).forEach(([serviceName, quantity]) => {
        const serviceValue = availableServices[serviceName] || 0;
        total += serviceValue * quantity;
      });
    });
    setOrderTotal(total);
  }, [selectedServices, availableServices]);

  // Criar ordem de serviço
  const handleCreateOrder = async () => {
    if (!clientData || selectedBikes.length === 0) {
      setError("Selecione um cliente e pelo menos uma bicicleta");
      return;
    }

    if (!scheduledDate) {
      setError("Selecione uma data de agendamento");
      return;
    }

    try {
      setLoading(true);

      // Gerar código da OS
      const now = new Date();
      const ano = now.getFullYear();
      const mes = (now.getMonth() + 1).toString().padStart(2, "0");

      const ordensRef = collection(db, "ordens");
      const mesAtualQuery = query(
        ordensRef,
        where("codigo", ">=", `OS-${ano}${mes}`),
        where("codigo", "<=", `OS-${ano}${mes}\uf8ff`),
        orderBy("codigo", "desc"),
        limit(1)
      );

      const mesAtualSnap = await getDocs(mesAtualQuery);
      const ultimaOrdem = mesAtualSnap.docs[0]?.data();
      const sequencial = (ultimaOrdem?.sequencial || 0) + 1;

      const codigoOS = `OS-${ano}${mes}${sequencial
        .toString()
        .padStart(3, "0")}`;
      const urlOS = `${window.location.origin}/consulta?os=${codigoOS}`;

      // Preparar bicicletas com serviços
      // Preparar bicicletas com serviços
      const bicicletasOrdem = bikes
        .filter((bike) => selectedBikes.includes(bike.id))
        .map((bike) => {
          // Calcula o total dos serviços para esta bike
          const bikeServices = selectedServices[bike.id] || {};
          const servicosTotal = Object.entries(bikeServices).reduce(
            (total, [serviceName, quantity]) => {
              return total + (availableServices[serviceName] || 0) * quantity;
            },
            0
          );

          return {
            id: bike.id,
            marca: bike.marca,
            modelo: bike.modelo,
            cor: bike.cor,
            services: selectedServices[bike.id] || {},
            serviceValues: Object.entries(
              selectedServices[bike.id] || {}
            ).reduce((acc, [serviceName, quantity]) => {
              const valor = availableServices[serviceName] || 0;
              acc[serviceName] = {
                valor: valor,
                valorFinal: valor,
                quantidade: quantity,
              };
              return acc;
            }, {}),
            total: servicosTotal,
          };
        });

      // Criar ordem
      const newOrder = {
        codigo: codigoOS,
        urlOS,
        sequencial,
        cliente: {
          nome: clientData.nome,
          telefone: clientData.telefone,
          endereco: clientData.endereco,
        },
        bicicletas: bicicletasOrdem,
        valorTotal: orderTotal,
        observacoes,
        status: "Pendente",
        dataCriacao: new Date().toISOString(), // Modificado
        dataAgendamento: new Date(scheduledDate + "T12:00:00").toISOString(),
        dataAtualizacao: new Date().toISOString(), // Modificado
      };

      const docRef = await addDoc(ordensRef, newOrder);

      // Gerar PDF
      await generatePDF(newOrder);

      navigate("/admin/orders");
    } catch (error) {
      console.error("Erro ao criar ordem:", error);
      setError("Erro ao criar ordem de serviço");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/admin")}
                className="mr-4 text-gray-600 hover:text-gray-900 flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Nova Ordem de Serviço
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pb-24">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Seção Cliente */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Cliente</h2>

          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ""))}
              placeholder="Digite o telefone do cliente"
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              maxLength={11}
            />
            <button
              onClick={searchClient}
              disabled={loading || !telefone}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Buscar
            </button>
          </div>

          {/* Dados do Cliente Encontrado */}
          {clientData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold mb-2">Dados do Cliente</h3>
              <p>
                <strong>Nome:</strong> {clientData.nome}
              </p>
              <p>
                <strong>Telefone:</strong> {clientData.telefone}
              </p>
              {clientData.endereco && (
                <p>
                  <strong>Endereço:</strong> {clientData.endereco}
                </p>
              )}
            </div>
          )}

          {/* Formulário Novo Cliente */}
          {showClientForm && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Novo Cliente</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newClient.nome}
                  onChange={(e) =>
                    setNewClient((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  placeholder="Nome do cliente"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  value={newClient.telefone || telefone} // Usar o telefone do estado ou da busca
                  onChange={(e) =>
                    setNewClient((prev) => ({
                      ...prev,
                      telefone: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  placeholder="Telefone"
                  className="w-full px-4 py-2 border rounded-lg"
                  maxLength={11}
                />
                <input
                  type="text"
                  value={newClient.endereco}
                  onChange={(e) =>
                    setNewClient((prev) => ({
                      ...prev,
                      endereco: e.target.value,
                    }))
                  }
                  placeholder="Endereço (opcional)"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <button
                  onClick={handleCreateClient}
                  disabled={loading || !newClient.nome || !newClient.telefone}
                  className="w-full bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  Cadastrar Cliente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Seção Bicicletas */}
        {clientData && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Bicicletas</h2>
              <button
                onClick={() => setShowBikeForm(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Nova Bicicleta
              </button>
            </div>

            {showBikeForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-4">Nova Bicicleta</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newBike.marca}
                    onChange={(e) =>
                      setNewBike((prev) => ({ ...prev, marca: e.target.value }))
                    }
                    placeholder="Marca"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={newBike.modelo}
                    onChange={(e) =>
                      setNewBike((prev) => ({
                        ...prev,
                        modelo: e.target.value,
                      }))
                    }
                    placeholder="Modelo"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={newBike.cor}
                    onChange={(e) =>
                      setNewBike((prev) => ({ ...prev, cor: e.target.value }))
                    }
                    placeholder="Cor"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={handleAddBike}
                      disabled={
                        loading ||
                        !newBike.marca ||
                        !newBike.modelo ||
                        !newBike.cor
                      }
                      className="flex-1 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      Adicionar Bicicleta
                    </button>
                    <button
                      onClick={() => setShowBikeForm(false)}
                      className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Bicicletas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bikes.map((bike) => (
                <div
                  key={bike.id}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    selectedBikes.includes(bike.id)
                      ? "border-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectBike(bike.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">
                        {bike.marca} {bike.modelo}
                      </h3>
                      <p className="text-gray-600">{bike.cor}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedBikes.includes(bike.id)}
                      onChange={() => handleSelectBike(bike.id)}
                      className="h-5 w-5"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção Serviços */}
        {selectedBikes.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Serviços</h2>

            {selectedBikes.map((bikeId) => {
              const bike = bikes.find((b) => b.id === bikeId);
              return (
                <div key={bikeId} className="mb-6 last:mb-0 border-b pb-6">
                  <h3 className="font-bold mb-2">
                    {bike.marca} {bike.modelo} - {bike.cor}
                  </h3>

                  <div className="space-y-2">
                    {Object.entries(availableServices).map(
                      ([serviceName, valor]) => (
                        <div
                          key={serviceName}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{serviceName}</p>
                            <p className="text-sm text-gray-600">
                              R$ {valor.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const currentQty =
                                  selectedServices[bikeId]?.[serviceName] || 0;
                                handleServiceChange(
                                  bikeId,
                                  serviceName,
                                  Math.max(0, currentQty - 1)
                                );
                              }}
                              className="w-8 h-8 flex items-center justify-center border rounded-lg hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">
                              {selectedServices[bikeId]?.[serviceName] || 0}
                            </span>
                            <button
                              onClick={() => {
                                const currentQty =
                                  selectedServices[bikeId]?.[serviceName] || 0;
                                handleServiceChange(
                                  bikeId,
                                  serviceName,
                                  currentQty + 1
                                );
                              }}
                              className="w-8 h-8 flex items-center justify-center border rounded-lg hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div className="mt-4 text-right">
                    <p className="font-bold">
                      Subtotal: R${" "}
                      {Object.entries(selectedServices[bikeId] || {})
                        .reduce((total, [serviceName, quantity]) => {
                          return (
                            total +
                            (availableServices[serviceName] || 0) * quantity
                          );
                        }, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Seção Agendamento e Observações */}
        {selectedBikes.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Agendamento</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Agendamento
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">Observações</h2>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações adicionais"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer com Total */}
        {selectedBikes.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t">
            <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Total da Ordem</p>
                  <p className="text-2xl font-bold">
                    R$ {orderTotal.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleCreateOrder}
                  disabled={loading || !scheduledDate || orderTotal === 0}
                  className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? "Criando..." : "Finalizar Ordem"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NewOrder;
