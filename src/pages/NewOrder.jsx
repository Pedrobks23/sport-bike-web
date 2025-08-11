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
  startAt,
  endAt,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import generateWorkshopTagsPDF from "../utils/generateWorkshopTagsPDF";
import { listMechanics } from "../services/mechanicService";

// Ajuste o caminho do logo conforme a estrutura do seu projeto
const logo = new URL("/assets/Logo.png", import.meta.url).href;

function formatPhone(phone) {
  if (!phone) return "";
  const ddd = phone.slice(0, 2);
  const first = phone.slice(2, 7);
  const last = phone.slice(7, 11);
  return `(${ddd}) ${first}-${last}`;
}

function NewOrder() {
  const navigate = useNavigate();

  // -----------------------------
  // ESTADOS GERAIS
  // -----------------------------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados do cliente
  const [telefone, setTelefone] = useState("");
  const [clientData, setClientData] = useState(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [newClient, setNewClient] = useState({
    nome: "",
    telefone: "",
    endereco: "",
  });
  const [phoneSuggestions, setPhoneSuggestions] = useState([]);

  // Estados das bicicletas
  const [bikes, setBikes] = useState([]);
  const [selectedBikes, setSelectedBikes] = useState([]);
  const [showBikeForm, setShowBikeForm] = useState(false);
  const [newBike, setNewBike] = useState({
    marca: "",
    modelo: "",
    cor: "",
  });

  // Estados dos serviços
  const [availableServices, setAvailableServices] = useState({});
  const [selectedServices, setSelectedServices] = useState({});

  // -----------------------------
  // NOVO: ESTADO PARA PEÇAS
  // -----------------------------
  // Guardamos as peças em um objeto onde cada chave = bikeId e valor = array de peças
  const [selectedParts, setSelectedParts] = useState({});

  // Formulário de nova peça (por bike)
  // Ex.: newPart[bikeId] = { nome: "", valor: "" }
  const [newPart, setNewPart] = useState({});

  const [isDarkMode, setIsDarkMode] = useState(false);

  // Estado de agendamento e observações
  const [scheduledDate, setScheduledDate] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Total da ordem
  const [orderTotal, setOrderTotal] = useState(0);

  // Armazena a ordem criada para imprimir depois
  const [createdOrder, setCreatedOrder] = useState(null);

  const [mechanics, setMechanics] = useState([]);
  const [selectedMechanic, setSelectedMechanic] = useState("");

  // -----------------------------
  // EFFECTS
  // -----------------------------
  // Carrega serviços ao montar
  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    listMechanics().then(setMechanics).catch(console.error);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Recalcula total sempre que serviços selecionados ou tabela de serviços mudar
  useEffect(() => {
    let total = 0;

    // Soma de serviços
    Object.entries(selectedServices).forEach(([bikeId, services]) => {
      Object.entries(services).forEach(([serviceName, quantity]) => {
        const serviceValue = availableServices[serviceName] || 0;
        total += serviceValue * quantity;
      });
    });

    // Soma de peças
    Object.entries(selectedParts).forEach(([bikeId, partsArray]) => {
      partsArray.forEach((part) => {
        const qty = parseInt(part.quantidade) || 1;
        total += (parseFloat(part.valor) || 0) * qty;
      });
    });

    setOrderTotal(total);
  }, [selectedServices, selectedParts, availableServices]);

  // -----------------------------
  // FUNÇÕES DE CARREGAR DADOS
  // -----------------------------
  async function loadServices() {
    try {
      const servicosRef = collection(db, "servicos");
      const snapshot = await getDocs(servicosRef);

      // Coletamos as entradas em um array para permitir ordenação
      const entries = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        Object.entries(data).forEach(([nome, valor]) => {
          const valorLimpo = valor.replace(/['"R$\s]/g, "").replace(",", ".");
          entries.push([nome, parseFloat(valorLimpo)]);
        });
      });

      // Ordena alfabeticamente pelo nome do serviço
      entries.sort((a, b) => a[0].localeCompare(b[0]));
      const servicesData = Object.fromEntries(entries);

      setAvailableServices(servicesData);
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
      setError("Erro ao carregar tabela de serviços");
    }
  }

  // Carrega bicicletas do cliente
  async function loadClientBikes(clientPhone) {
    try {
      const bikesRef = collection(db, "clientes", clientPhone, "bikes");
      const snapshot = await getDocs(bikesRef);
      const bikesData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setBikes(bikesData);
    } catch (err) {
      console.error("Erro ao carregar bicicletas:", err);
      setError("Erro ao carregar bicicletas do cliente");
    }
  }

  // -----------------------------
  // FUNÇÕES DO CLIENTE
  // -----------------------------
  async function fetchPhoneSuggestions(value) {
    if (value.length < 3) {
      setPhoneSuggestions([]);
      return;
    }
    try {
      const clientesRef = collection(db, "clientes");
      const q = query(
        clientesRef,
        orderBy("telefone"),
        startAt(value),
        endAt(value + "\uf8ff"),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const suggestions = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return { telefone: data.telefone, nome: data.nome };
      });
      setPhoneSuggestions(suggestions);
    } catch (err) {
      console.error("Erro ao buscar telefones:", err);
    }
  }

  function handleTelefoneChange(e) {
    const value = e.target.value.replace(/\D/g, "");
    setTelefone(value);
    fetchPhoneSuggestions(value);
  }

  async function searchClient(phoneParam) {
    const phoneToSearch = phoneParam || telefone;
    if (!phoneToSearch) return;
    try {
      setLoading(true);
      const clientRef = doc(db, "clientes", phoneToSearch);
      const clientDoc = await getDoc(clientRef);

      if (clientDoc.exists()) {
        const data = clientDoc.data();
        setClientData({
          ...data,
          telefoneSemDDD: data.telefoneSemDDD || phoneToSearch.slice(-9),
        });
        await loadClientBikes(phoneToSearch);
      } else {
        setClientData(null);
        setBikes([]);
        setShowClientForm(true);
        setNewClient((prev) => ({ ...prev, telefone: phoneToSearch }));
      }
      setPhoneSuggestions([]);
      setTelefone(phoneToSearch);
    } catch (err) {
      console.error("Erro ao buscar cliente:", err);
      setError("Erro ao buscar cliente");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectSuggestion(phone) {
    await searchClient(phone);
  }

  async function handleCreateClient() {
    try {
      if (!newClient.nome || !newClient.telefone) {
        setError("Nome e telefone são obrigatórios");
        return;
      }
      setLoading(true);

      const clientRef = doc(db, "clientes", newClient.telefone);
      await setDoc(clientRef, {
        ...newClient,
        telefoneSemDDD: newClient.telefone.slice(-9),
        dataCriacao: serverTimestamp(),
      });

      setClientData({ ...newClient, telefoneSemDDD: newClient.telefone.slice(-9) });
      setShowClientForm(false);
      await loadClientBikes(newClient.telefone);
      setTelefone(newClient.telefone);
    } catch (err) {
      console.error("Erro ao criar cliente:", err);
      setError("Erro ao criar novo cliente");
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // FUNÇÕES DAS BICICLETAS
  // -----------------------------
  async function handleAddBike() {
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
    } catch (err) {
      console.error("Erro ao adicionar bicicleta:", err);
      setError("Erro ao adicionar nova bicicleta");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectBike(bikeId) {
    setSelectedBikes((prev) => {
      if (prev.includes(bikeId)) {
        return prev.filter((id) => id !== bikeId);
      }
      return [...prev, bikeId];
    });
  }

  // -----------------------------
  // FUNÇÕES DOS SERVIÇOS
  // -----------------------------
  function handleServiceChange(bikeId, serviceName, quantity) {
    setSelectedServices((prev) => ({
      ...prev,
      [bikeId]: {
        ...prev[bikeId],
        [serviceName]: quantity,
      },
    }));
  }

  // -----------------------------
  // FUNÇÕES DE PEÇAS
  // -----------------------------
  function handleNewPartChange(bikeId, field, value) {
    // Exemplo: newPart[bikeId] = {nome: "", valor: ""}
    setNewPart((prev) => ({
      ...prev,
      [bikeId]: {
        ...prev[bikeId],
        [field]: value,
      },
    }));
  }

  function handleAddPart(bikeId) {
    const partData = newPart[bikeId];
    if (!partData || !partData.nome || !partData.valor) {
      setError("Preencha nome e valor da peça");
      return;
    }

    // Limpamos a mensagem de erro
    setError(null);

    // Adiciona a peça no selectedParts
    const quantidade = parseInt(partData.quantidade) || 1;

    setSelectedParts((prev) => {
      const currentBikeParts = prev[bikeId] || [];
      return {
        ...prev,
        [bikeId]: [
          ...currentBikeParts,
          { nome: partData.nome, valor: partData.valor, quantidade },
        ],
      };
    });

    // Limpa o formulário
    setNewPart((prev) => ({
      ...prev,
      [bikeId]: { nome: "", valor: "", quantidade: "" },
    }));
  }

  function handleRemovePart(bikeId, index) {
    setSelectedParts((prev) => {
      const currentBikeParts = [...(prev[bikeId] || [])];
      currentBikeParts.splice(index, 1); // remove a peça
      return {
        ...prev,
        [bikeId]: currentBikeParts,
      };
    });
  }

  // -----------------------------
  // IMPRESSÃO: VERSÃO DO CLIENTE
  // -----------------------------
  async function generatePDFClient(ordem) {
    try {
      const docPDF = new jsPDF();
      const pageWidth = docPDF.internal.pageSize.getWidth();
      let yPos = 35;

      const centerText = (text, y, fontSize = null) => {
        if (fontSize) docPDF.setFontSize(fontSize);
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

      docPDF.addImage(logoImg, "PNG", 15, 5, 25, 25);

      docPDF.setFontSize(14);
      docPDF.setFont("helvetica", "bold");
      centerText("ORDEM DE SERVIÇO", 15);

      docPDF.setFontSize(8);
      docPDF.setFont("helvetica", "normal");
      centerText("Rua Ana Bilhar, 1680 - Varjota, Fortaleza - CE", 22);
      centerText("Tel: (85) 3267-7425 | WhatsApp: (85) 3267-7425", 26);
      centerText("@sportbike_fortaleza | comercialsportbike@gmail.com", 30);

      docPDF.setFontSize(10);
      docPDF.setFont("helvetica", "bold");

      const dataCriacao = new Date(ordem.dataCriacao);
      const dataAgendamento = new Date(ordem.dataAgendamento);

      docPDF.text(`OS: ${ordem.codigo}`, 15, yPos);
      docPDF.text(`Criada: ${dataCriacao.toLocaleDateString("pt-BR")}`, 70, yPos);
      docPDF.text(`Agendada: ${dataAgendamento.toLocaleDateString("pt-BR")}`, 130, yPos);
      yPos += 8;

      docPDF.setFontSize(9);
      docPDF.text("CLIENTE:", 15, yPos);
      docPDF.setFont("helvetica", "normal");
      docPDF.text(`${ordem.cliente?.nome || "-"}`, 40, yPos);
      docPDF.text(`Tel: ${ordem.cliente?.telefone || "-"}`, 130, yPos);
      yPos += 8;

      docPDF.setFontSize(8);
      docPDF.setFont("helvetica", "bold");
      docPDF.text("COMO CONSULTAR O ANDAMENTO DA SUA OS:", 15, yPos);
      yPos += 4;
      docPDF.setFont("helvetica", "normal");
      const consultaLinhas = [
        "1. Acesse: https://sportbikece.vercel.app/consulta",
        "2. Digite o número da OS ou seu telefone.",
        "3. Clique em 'Consultar' para ver o status.",
      ];
      docPDF.text(consultaLinhas, 15, yPos);
      yPos += consultaLinhas.length * 4 + 2;

      let totalGeral = 0;

      docPDF.setFontSize(9);
      docPDF.setFont("helvetica", "bold");
      docPDF.text("BICICLETA / SERVIÇOS", 15, yPos);
      docPDF.text("QTD", 120, yPos);
      docPDF.text("VALOR", 140, yPos);
      docPDF.text("SUBTOTAL", 165, yPos);
      yPos += 6;

      docPDF.line(15, yPos - 2, 195, yPos - 2);
      yPos += 2;

      ordem.bicicletas?.forEach((bike, index) => {
        docPDF.setFont("helvetica", "bold");
        docPDF.setFontSize(8);
        const bikeName = `${index + 1}. ${bike.marca} ${bike.modelo} ${bike.cor}`.trim();
        docPDF.text(bikeName, 15, yPos);
        yPos += 5;

        let totalBike = 0;
        docPDF.setFont("helvetica", "normal");
        docPDF.setFontSize(8);

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

              docPDF.text(`  • ${serviceName}`, 15, yPos);
              docPDF.text(`${quantity}`, 125, yPos);
              docPDF.text(`${serviceValue.toFixed(2)}`, 145, yPos);
              docPDF.text(`${subtotal.toFixed(2)}`, 170, yPos);
              yPos += 4;
            }
          });
        }

        if (bike.pecas && bike.pecas.length > 0) {
          bike.pecas.forEach((peca) => {
            const qty = parseInt(peca.quantidade) || 1;
            const valorPeca = Number.parseFloat(peca.valor) || 0;
            const subtotal = valorPeca * qty;
            totalBike += subtotal;
            docPDF.text(`  • ${peca.nome}`, 15, yPos);
            docPDF.text(`${qty}`, 125, yPos);
            docPDF.text(`${valorPeca.toFixed(2)}`, 145, yPos);
            docPDF.text(`${subtotal.toFixed(2)}`, 170, yPos);
            yPos += 4;
          });
        }

        totalGeral += totalBike;

        docPDF.setFont("helvetica", "bold");
        docPDF.text(`Subtotal Bike ${index + 1}:`, 120, yPos);
        docPDF.text(`R$ ${totalBike.toFixed(2)}`, 165, yPos);
        yPos += 6;
        docPDF.setFont("helvetica", "normal");
      });

      docPDF.line(15, yPos - 2, 195, yPos - 2);
      yPos += 2;

      docPDF.setFont("helvetica", "bold");
      docPDF.setFontSize(11);
      docPDF.text(`TOTAL GERAL: R$ ${totalGeral.toFixed(2)}`, 120, yPos);
      yPos += 8;

      if (ordem.observacoes) {
        docPDF.setFontSize(8);
        docPDF.text("OBS:", 15, yPos);
        docPDF.setFont("helvetica", "normal");
        const obsLines = docPDF.splitTextToSize(ordem.observacoes, 160);
        docPDF.text(obsLines, 35, yPos);
        yPos += obsLines.length * 4 + 4;
      }

      docPDF.setFontSize(7);
      docPDF.setFont("helvetica", "normal");
      const termos = [
        "• Prazo pode ser estendido em até 2 dias. • Bicicletas não retiradas em 180 dias serão vendidas para custear despesas.",
      ];
      docPDF.text(termos, 15, yPos);

      docPDF.save(`OS-Cliente-${ordem.codigo}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF (Cliente):", err);
      alert("Erro ao gerar PDF do cliente. Tente novamente.");
    }
  }

  // -----------------------------
  // IMPRESSÃO: VERSÃO DA LOJA
  // -----------------------------
  async function generatePDFStore(ordem) {
    try {
      const docPDF = new jsPDF();
      let yPos = 10; // posição vertical inicial
      let totalGeral = 0; // soma de todos os subtotais de bikes

      // ------------------------------------------
      // Data de agendamento formatada
      // Exemplo de resultado: "02/02/2025 QUARTA-FEIRA"
      // ------------------------------------------
      const dataAgendamento = new Date(ordem.dataAgendamento);

      // Formata dia, mês e ano
      const dayNumber = dataAgendamento.getDate().toString().padStart(2, "0");
      const monthNumber = (dataAgendamento.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      const year = dataAgendamento.getFullYear();

      // Nome do dia da semana em português, em caixa alta
      const dayName = dataAgendamento
        .toLocaleDateString("pt-BR", { weekday: "long" })
        .toUpperCase();

      // Ex.: "02/02/2025 QUARTA-FEIRA"
      const dataFormatada = `${dayNumber}/${monthNumber}/${year} ${dayName}`;

      // Percorre cada bicicleta para gerar um “bloco” separado
      ordem.bicicletas?.forEach((bike, index) => {
        // Se estiver muito embaixo na página, cria nova página
        if (yPos > 220) {
          docPDF.addPage();
          yPos = 10;
        }

        // ------------------------------------------
        // Cabeçalho básico da bike
        // ------------------------------------------
        // Linha 1: OS + Índice da bike
        docPDF.setFont("helvetica", "bold");
        docPDF.setFontSize(11);
        docPDF.text(`OS: ${ordem.codigo}  |  Bike ${index + 1}`, 10, yPos);
        yPos += 5;

        // Linha 2: Cliente + Telefone
        docPDF.text(
          `Cliente: ${ordem.cliente?.nome || "-"}  |  Tel: ${
            ordem.cliente?.telefone || "-"
          }`,
          10,
          yPos
        );
        yPos += 5;

        // Linha 3: Data
        docPDF.setFont("helvetica", "normal");
        docPDF.setFontSize(10);
        docPDF.text(`Data: ${dataFormatada}`, 10, yPos);
        yPos += 5;

        // Linha 4: Detalhes da Bike
        docPDF.setFont("helvetica", "bold");
        docPDF.setFontSize(10);
        docPDF.text(
          `Bicicleta: ${bike.marca} - ${bike.modelo} - ${bike.cor}`,
          10,
          yPos
        );
        yPos += 5;

        // ------------------------------------------
        // Observações gerais (se existirem)
        // ------------------------------------------
        if (ordem.observacoes) {
          docPDF.setFontSize(9);
          docPDF.text("Observações Gerais:", 10, yPos);
          yPos += 4;

          docPDF.setFont("helvetica", "normal");
          const obsLinhas = docPDF.splitTextToSize(ordem.observacoes, 190);
          obsLinhas.forEach((linha) => {
            docPDF.text(linha, 10, yPos);
            yPos += 4;
          });
        }

        // ------------------------------------------
        // Serviços
        // ------------------------------------------
        docPDF.setFont("helvetica", "bold");
        docPDF.setFontSize(9);
        yPos += 5;
        docPDF.text("SERVIÇOS:", 10, yPos);
        yPos += 4;

        let totalBike = 0; // subtotal desta bike

        docPDF.setFont("helvetica", "normal");
        if (bike.services) {
          const servicosEntries = Object.entries(bike.services).filter(
            ([, quantity]) => quantity > 0
          );

          if (servicosEntries.length === 0) {
            docPDF.text("Nenhum serviço selecionado.", 10, yPos);
            yPos += 4;
          } else {
            servicosEntries.forEach(([serviceName, quantity]) => {
              // Valor do serviço
              const serviceValue =
                bike.serviceValues?.[serviceName]?.valorFinal ||
                bike.serviceValues?.[serviceName]?.valor ||
                availableServices[serviceName] ||
                0;
              const subtotal = serviceValue * quantity;
              totalBike += subtotal;

              if (yPos > 270) {
                docPDF.addPage();
                yPos = 10;
              }

              docPDF.text(
                `• ${serviceName} (${quantity}x) = R$ ${subtotal.toFixed(2)}`,
                10,
                yPos
              );
              yPos += 4;
            });
          }
        } else {
          docPDF.text("Nenhum serviço selecionado.", 10, yPos);
          yPos += 4;
        }

        // ------------------------------------------
        // Peças
        // ------------------------------------------
        docPDF.setFont("helvetica", "bold");
        docPDF.setFontSize(9);
        yPos += 4;
        docPDF.text("PEÇAS:", 10, yPos);
        yPos += 4;

        docPDF.setFont("helvetica", "normal");
        if (bike.pecas && bike.pecas.length > 0) {
          bike.pecas.forEach((peca) => {
            if (yPos > 270) {
              docPDF.addPage();
              yPos = 10;
            }
            const qty = parseInt(peca.quantidade) || 1;
            const valorPeca = parseFloat(peca.valor || 0);
            const subtotal = valorPeca * qty;
            totalBike += subtotal;
            docPDF.text(
              `• ${peca.nome} (${qty}x) = R$ ${subtotal.toFixed(2)}`,
              10,
              yPos
            );
            yPos += 4;
          });
        } else {
          docPDF.text("Nenhuma peça.", 10, yPos);
          yPos += 4;
        }

        // ------------------------------------------
        // Subtotal da Bike
        // ------------------------------------------
        yPos += 4;
        docPDF.setFont("helvetica", "bold");
        docPDF.setFontSize(9);
        docPDF.text(
          `Subtotal (Bike ${index + 1}): R$ ${totalBike.toFixed(2)}`,
          10,
          yPos
        );
        yPos += 8;

        // Soma esse subtotal ao total geral
        totalGeral += totalBike;
      });

      // ------------------------------------------
      // TOTAL GERAL
      // ------------------------------------------
      // Checa se precisamos de uma nova página
      if (yPos > 270) {
        docPDF.addPage();
        yPos = 10;
      }

      docPDF.setFont("helvetica", "bold");
      docPDF.setFontSize(10);
      docPDF.text(
        `VALOR TOTAL DA ORDEM: R$ ${totalGeral.toFixed(2)}`,
        10,
        yPos
      );

      // Salva o PDF
      docPDF.save(`OS-Loja-${ordem.codigo}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF (Loja):", err);
      alert("Erro ao gerar PDF da loja. Tente novamente.");
    }
  }

  // -----------------------------
  // CRIAR ORDEM DE SERVIÇO
  // -----------------------------
  async function handleCreateOrder() {
    if (!clientData || selectedBikes.length === 0) {
      setError("Selecione um cliente e pelo menos uma bicicleta.");
      return;
    }

    if (!scheduledDate) {
      setError("Selecione uma data de agendamento.");
      return;
    }

    try {
      setLoading(true);

      // Gera código da OS
      const now = new Date();
      const ano = now.getFullYear();
      const mes = String(now.getMonth() + 1).padStart(2, "0");

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

      const codigoOS = `OS-${ano}${mes}${String(sequencial).padStart(3, "0")}`;
      const urlOS = `${window.location.origin}/consulta?os=${codigoOS}`;

      // Prepara as bicicletas selecionadas
      const bicicletasOrdem = bikes
        .filter((bike) => selectedBikes.includes(bike.id))
        .map((bike) => {
          const bikeServices = selectedServices[bike.id] || {};
          // Soma serviços
          const servicosTotal = Object.entries(bikeServices).reduce(
            (total, [serviceName, quantity]) => {
              return total + (availableServices[serviceName] || 0) * quantity;
            },
            0
          );

          // Soma peças (do selectedParts)
          const bikeParts = selectedParts[bike.id] || [];
          const pecasTotal = bikeParts.reduce((acc, part) => {
            const qty = parseInt(part.quantidade) || 1;
            return acc + (parseFloat(part.valor) || 0) * qty;
          }, 0);

          return {
            id: bike.id,
            marca: bike.marca,
            modelo: bike.modelo,
            cor: bike.cor,
            services: bikeServices,
            serviceValues: Object.entries(bikeServices).reduce(
              (acc, [serviceName, quantity]) => {
                const valor = availableServices[serviceName] || 0;
                acc[serviceName] = {
                  valor: valor,
                  valorFinal: valor,
                  quantidade: quantity,
                };
                return acc;
              },
              {}
            ),
            pecas: bikeParts, // aqui estão as peças adicionadas
            total: servicosTotal + pecasTotal,
          };
        });

      // Calcula valor total final
      const valorTotal = bicicletasOrdem.reduce(
        (acc, bike) => acc + bike.total,
        0
      );

      const newOrder = {
        codigo: codigoOS,
        urlOS,
        sequencial,
        cliente: {
          nome: clientData.nome,
          telefone: clientData.telefone,
          telefoneSemDDD: clientData.telefoneSemDDD || clientData.telefone.slice(-9),
          endereco: clientData.endereco,
        },
        bicicletas: bicicletasOrdem,
        valorTotal: valorTotal,
        observacoes,
        status: "Pendente",
        mecanicoId: selectedMechanic,
        dataCriacao: new Date().toISOString(),
        dataAgendamento: new Date(scheduledDate + "T12:00:00").toISOString(),
        dataAtualizacao: new Date().toISOString(),
      };

      // Salva no Firestore
      await addDoc(ordensRef, newOrder);

      // Armazena a ordem para imprimir
      setCreatedOrder(newOrder);

      // Caso queira voltar para a listagem automaticamente, descomente:
      // navigate("/admin/orders");
    } catch (err) {
      console.error("Erro ao criar ordem:", err);
      setError("Erro ao criar ordem de serviço");
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // RENDER DO COMPONENTE
  // -----------------------------
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        {/* HEADER */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-green-400 to-green-600 p-2 rounded-full">
                  <PlusCircle className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Nova Ordem de Serviço</h1>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN */}
        {!createdOrder ? (
        <main className="container mx-auto px-4 py-8 pb-24">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* SEÇÃO CLIENTE */}
        <div className="relative z-20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-4">Cliente</h2>

          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={telefone}
                onChange={handleTelefoneChange}
                placeholder="Digite o telefone do cliente"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                maxLength={11}
              />
              {phoneSuggestions.length > 0 && (
                <ul className="absolute left-0 w-full bg-white border rounded-lg shadow mt-1 max-h-40 overflow-auto z-50">
                  {phoneSuggestions.map((s) => (
                    <li
                      key={s.telefone}
                      onMouseDown={() => handleSelectSuggestion(s.telefone)}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between"
                    >
                      <span>{formatPhone(s.telefone)}</span>
                      <span className="text-gray-500">{s.nome}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => searchClient()}
              disabled={loading || !telefone}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Buscar
            </button>
          </div>

          {/* DADOS DO CLIENTE ENCONTRADO */}
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

          {/* FORMULÁRIO NOVO CLIENTE */}
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
                  value={newClient.telefone || telefone}
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

        {/* SEÇÃO BICICLETAS */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-xl font-bold mb-4">Bicicletas do Cliente</h2>

          {bikes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bikes.map((bike) => (
                <div
                  key={bike.id}
                  className={`border rounded-lg p-4 ${
                    selectedBikes.includes(bike.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300"
                  } cursor-pointer`}
                  onClick={() => handleSelectBike(bike.id)}
                >
                  <h3 className="font-semibold mb-2">
                    {bike.marca} - {bike.modelo}
                  </h3>
                  <p className="text-sm text-gray-600">Cor: {bike.cor}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={() => setShowBikeForm(!showBikeForm)}
              className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Adicionar Bicicleta
            </button>
          </div>

          {showBikeForm && (
            <div className="mt-4 space-y-4">
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
                  setNewBike((prev) => ({ ...prev, modelo: e.target.value }))
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
              <button
                onClick={handleAddBike}
                disabled={loading || !newBike.marca || !newBike.modelo}
                className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                Salvar Bicicleta
              </button>
            </div>
          )}
        </div>

        {/* SEÇÃO SERVIÇOS/PEÇAS - exibe apenas se houver bikes selecionadas */}
        {selectedBikes.length > 0 && (
          <>
            {/* SERVIÇOS */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-6">
              <h2 className="text-xl font-bold mb-4">Serviços</h2>
              <p className="mb-4 text-sm text-gray-700">
                Selecione a quantidade de cada serviço para cada bicicleta.
              </p>
              {selectedBikes.map((bikeId, index) => {
                const bikeInfo = bikes.find((b) => b.id === bikeId);
                if (!bikeInfo) return null;

                return (
                  <div key={bikeId} className="mb-6 border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">
                      {`Bicicleta ${index + 1}: ${bikeInfo.marca} - ${
                        bikeInfo.modelo
                      } - ${bikeInfo.cor}`}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(availableServices)
                        .sort((a, b) => a[0].localeCompare(b[0]))
                        .map(
                        ([serviceName, price]) => {
                          const quantity =
                            selectedServices[bikeId]?.[serviceName] || 0;
                          return (
                            <div
                              key={serviceName}
                              className="flex items-center border rounded-md p-2"
                            >
                              <div className="flex-1">
                                <p className="font-semibold">{serviceName}</p>
                                <p className="text-sm text-gray-500">
                                  R$ {price.toFixed(2)}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleServiceChange(
                                      bikeId,
                                      serviceName,
                                      quantity > 0 ? quantity - 1 : 0
                                    )
                                  }
                                  className="px-2 py-1 border rounded hover:bg-gray-100"
                                >
                                  -
                                </button>
                                <span>{quantity}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleServiceChange(
                                      bikeId,
                                      serviceName,
                                      quantity + 1
                                    )
                                  }
                                  className="px-2 py-1 border rounded hover:bg-gray-100"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PEÇAS */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-6">
              <h2 className="text-xl font-bold mb-4">Peças</h2>
              {selectedBikes.map((bikeId, index) => {
                const bikeInfo = bikes.find((b) => b.id === bikeId);
                if (!bikeInfo) return null;

                // array de peças já adicionadas a esta bike
                const bikeParts = selectedParts[bikeId] || [];
                const partForm = newPart[bikeId] || { nome: "", valor: "" };

                return (
                  <div key={bikeId} className="mb-6 border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">
                      {`Bicicleta ${index + 1}: ${bikeInfo.marca} - ${
                        bikeInfo.modelo
                      } - ${bikeInfo.cor}`}
                    </h3>

                    {/* Listar peças já adicionadas */}
                    {bikeParts.length > 0 && (
                      <div className="mb-4">
                        <p className="font-bold">Peças já adicionadas:</p>
                        <ul className="space-y-2">
                          {bikeParts.map((part, idx) => (
                            <li
                              key={idx}
                              className="flex justify-between items-center border rounded p-2"
                            >
                              <div>
                                {part.nome} - {parseFloat(part.valor).toFixed(2)}
                                {" "}({part.quantidade || 1}x)
                              </div>
                              <button
                                onClick={() => handleRemovePart(bikeId, idx)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Remover
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Formulário para adicionar nova peça */}
                    <div className="mt-2 space-y-2 border p-3 rounded">
                      <input
                        type="text"
                        placeholder="Nome da Peça"
                        className="w-full px-3 py-2 border rounded"
                        value={partForm.nome || ""}
                        onChange={(e) =>
                          handleNewPartChange(bikeId, "nome", e.target.value)
                        }
                      />
                      <input
                        type="number"
                        placeholder="Valor da Peça (R$)"
                        className="w-full px-3 py-2 border rounded"
                        min="0"
                        step="0.01"
                        value={partForm.valor || ""}
                        onChange={(e) =>
                          handleNewPartChange(bikeId, "valor", e.target.value)
                        }
                      />
                      <input
                        type="number"
                        placeholder="Quantidade"
                        className="w-full px-3 py-2 border rounded"
                        min="1"
                        value={partForm.quantidade || ""}
                        onChange={(e) =>
                          handleNewPartChange(bikeId, "quantidade", e.target.value)
                        }
                      />
                      <button
                        onClick={() => handleAddPart(bikeId)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Adicionar Peça
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* SEÇÃO AGENDAMENTO E OBSERVAÇÕES (apenas se houver bikes selecionadas) */}
        {selectedBikes.length > 0 && (
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-6">
            <h2 className="text-xl font-bold mb-4">Agendamento</h2>
            <div className="mb-4">
              <label
                htmlFor="scheduledDate"
                className="font-semibold block mb-2"
              >
                Data de Agendamento
              </label>
              <input
                type="date"
                id="scheduledDate"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="px-4 py-2 border rounded-lg w-full"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="mechanic" className="font-semibold block mb-2">
                Mecânico
              </label>
              <select
                id="mechanic"
                value={selectedMechanic}
                onChange={(e) => setSelectedMechanic(e.target.value)}
                className="px-4 py-2 border rounded-lg w-full"
              >
                <option value="">Selecione um mecânico</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="observacoes" className="font-semibold block mb-2">
                Observações (opcional)
              </label>
              <textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={4}
                className="px-4 py-2 border rounded-lg w-full"
                placeholder="Ex: Descrever observações adicionais ou peças solicitadas"
              />
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-lg">Total da Ordem:</h3>
              <p className="text-xl font-bold text-green-600">
                R$ {orderTotal.toFixed(2)}
              </p>
            </div>

            <button
              onClick={handleCreateOrder}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Criar Ordem de Serviço
            </button>
          </div>
        )}
      </main>
        ) : (
      <main className="container mx-auto px-4 py-8 pb-24">
        <h2 className="text-2xl font-bold mb-4">Ordem criada com sucesso!</h2>
        <div className="space-y-6">
          <div className="space-x-4">
            <button
              onClick={() => generatePDFClient(createdOrder)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Imprimir Versão Cliente
            </button>
            <button
              onClick={() => generatePDFStore(createdOrder)}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
            >
              Imprimir Versão Loja
            </button>
            <button
              onClick={() => generateWorkshopTagsPDF(createdOrder)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Imprimir Etiquetas
            </button>
          </div>
          <div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Criar nova ordem
            </button>
          </div>
        </div>
      </main>
        )}
      </div>
    </div>
  );
}

export default NewOrder;
