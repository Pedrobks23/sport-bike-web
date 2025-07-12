"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jsPDF } from "jspdf";
import { consultarOS, updateOrdemURL } from "../config/firebase";
import {
  ArrowLeft,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  History,
  X,
  Phone,
  Calendar,
  User,
} from "lucide-react";

const logo = "/assets/Logo.png";

const ConsultaOS = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ordens, setOrdens] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showOldOSForm, setShowOldOSForm] = useState(false);
  const [oldOSData, setOldOSData] = useState({
    nome: "",
    modelo: "",
    cor: "",
    osNumber: "",
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Verifica se há uma OS na URL ao carregar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const osFromURL = params.get("os");

    if (osFromURL) {
      setSearchValue(osFromURL);
      handleSearch(osFromURL, "os");
    }
  }, [location]);

  // Função auxiliar para fazer a busca
  const handleSearch = async (value, tipo) => {
    setLoading(true);
    setError(null);

    try {
      const resultado = await consultarOS(tipo, value);

      if (resultado.length === 0) {
        setError("Nenhuma ordem de serviço encontrada");
        setOrdens([]);
      } else {
        setOrdens(resultado);

        // Atualiza a URL no Firebase apenas se for busca por OS
        if (tipo === "os") {
          const baseURL = window.location.origin;
          const newURL = `${baseURL}/consulta?os=${resultado[0].codigo}`;
          await updateOrdemURL(resultado[0].codigo, newURL);
        }
      }
    } catch (err) {
      console.error("Erro na consulta:", err);
      setError(err.message);
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = async () => {
    if (!searchValue.trim()) {
      setError("Digite um telefone ou número de OS primeiro para consultar o histórico");
      setOrdens([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const historico = await consultarOS("historico", searchValue.trim());
      if (historico.length > 0) {
        setOrdens(historico);
      } else {
        setOrdens([]);
        setError("Nenhuma ordem encontrada no histórico");
      }
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
      setError("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (timestamp, isAgendamento = false) => {
    if (!timestamp) return "-";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...(isAgendamento ? {} : { hour: "2-digit", minute: "2-digit" }),
    });
  };

  // Calcula o valor TOTAL atualizado somando serviços e peças
  const calcularValorAtualizado = (ordem) => {
    let totalGeral = 0;
    if (!ordem.bicicletas) return 0;

    ordem.bicicletas.forEach((bike) => {
      let totalBike = 0;

      // Somar serviços
      if (bike.services) {
        Object.entries(bike.services).forEach(([serviceName, quantity]) => {
          if (quantity > 0) {
            const serviceValue =
              bike.serviceValues?.[serviceName]?.valorFinal ||
              bike.serviceValues?.[serviceName]?.valor ||
              bike.valorServicos?.[serviceName] ||
              0;
            totalBike += serviceValue * quantity;
          }
        });
      }

      // Somar peças
      if (bike.pecas && bike.pecas.length > 0) {
        bike.pecas.forEach((peca) => {
          const qty = parseInt(peca.quantidade) || 1;
          const valorPeca = parseFloat(peca.valor) || 0;
          totalBike += valorPeca * qty;
        });
      }

      totalGeral += totalBike;
    });
    return totalGeral;
  };

  const formatarDinheiro = (valor) => {
    if (!valor) return "R$ 0,00";
    return `R$ ${valor.toFixed(2)}`;
  };

  const handleOldChange = (e) => {
    const { name, value } = e.target;
    setOldOSData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOldSubmit = async () => {
    const { nome, modelo, cor, osNumber } = oldOSData;
    const text =
      `Olá, gostaria de saber o andamento da minha bike.\n` +
      `Nome: ${nome}\n` +
      `Modelo: ${modelo}\n` +
      `Cor: ${cor}\n` +
      `OS: ${osNumber}\n` +
      `Por favor, se possível, envie a foto do seu papel.`;

    const encoded = encodeURIComponent(text);
    const url =
      `https://api.whatsapp.com/send?phone=558532677425&text=${encoded}`;

    window.open(url, "_blank");

    setShowOldOSForm(false);
    setOldOSData({ nome: "", modelo: "", cor: "", osNumber: "" });
  };

  const detectarTipoBusca = (valor) => {
    const valorLimpo = valor.replace(/\D/g, "");
    if (valor.toUpperCase().startsWith("OS-")) return "os";
    if (valorLimpo.length >= 9 && valorLimpo.length <= 11) return "telefone";
    return "os";
  };

  const formatarInput = (valor) => {
    const valorLimpo = valor.trim();

    if (valorLimpo.toUpperCase().startsWith("OS-")) {
      return valorLimpo.toUpperCase();
    }

    const numeros = valorLimpo.replace(/\D/g, "");
    if (numeros.length >= 10 || valorLimpo.includes("(")) {
      if (numeros.length <= 2) return numeros;
      if (numeros.length <= 6)
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
      if (numeros.length <= 10)
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(
          6
        )}`;
      return `(${numeros.slice(0, 2)}) ${numeros.slice(
        2,
        7
      )}-${numeros.slice(7, 11)}`;
    }

    return valorLimpo.toUpperCase();
  };

  const handleInputChange = (e) => {
    const valorFormatado = formatarInput(e.target.value);
    setSearchValue(valorFormatado);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!searchValue) {
        throw new Error("Digite um número de OS ou telefone");
      }

      const isOS = searchValue.toUpperCase().includes("OS-");
      const tipo = isOS ? "os" : "telefone";

      if (tipo === "telefone") {
        const telefoneNumerico = searchValue.replace(/\D/g, "");
        if (telefoneNumerico.length < 10) {
          throw new Error("Telefone inválido");
        }
        sessionStorage.setItem("telefoneConsulta", telefoneNumerico);
      }

      if (tipo === "os") {
        if (!sessionStorage.getItem("telefoneConsulta")) {
          throw new Error("Por favor, faça primeiro uma busca por telefone");
        }
        navigate(`/consulta?os=${searchValue}`);
      }

      await handleSearch(searchValue, tipo);
    } catch (err) {
      console.error("Erro na consulta:", err);
      setError(err.message);
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";

    const statusColors = {
      Pendente: "bg-yellow-100 text-yellow-800",
      "Em Andamento": "bg-blue-100 text-blue-800",
      Pronto: "bg-green-100 text-green-800",
      Cancelado: "bg-red-100 text-red-800",
      "Em andamento": "bg-blue-100 text-blue-800",
      Concluído: "bg-green-100 text-green-800",
    };

    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const generatePDF = async (ordem) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 50;

      const centerText = (text, y) => {
        const textWidth =
          (doc.getStringUnitWidth(text) * doc.internal.getFontSize()) /
          doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
      };

      doc.addImage(logo, "PNG", 20, 10, 40, 40);
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

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`OS: ${ordem.codigo}`, 20, yPos);
      yPos += 10;

      const dataCriacao = ordem.dataCriacao?.toDate
        ? ordem.dataCriacao.toDate()
        : new Date(ordem.dataCriacao);
      const dataAgendamento = ordem.dataAgendamento?.toDate
        ? ordem.dataAgendamento.toDate()
        : new Date(ordem.dataAgendamento);

      doc.text(`Criada em: ${dataCriacao.toLocaleString("pt-BR")}`, 20, yPos);
      yPos += 10;

      if (ordem.dataAgendamento) {
        doc.text(`Agendada para: ${dataAgendamento.toLocaleDateString("pt-BR")}`, 20, yPos);
        yPos += 15;
      }

      doc.text("DADOS DO CLIENTE", 20, yPos);
      yPos += 10;
      doc.setFont("helvetica", "normal");
      doc.text(`Nome: ${ordem.cliente?.nome || "-"}`, 20, yPos);
      yPos += 7;
      doc.text(`Telefone: ${ordem.cliente?.telefone || "-"}`, 20, yPos);
      yPos += 15;

      let totalGeral = 0;

      ordem.bicicletas?.forEach((bike, index) => {
        doc.setFont("helvetica", "bold");
        doc.text(
          `BICICLETA ${index + 1}: ${bike.marca} - ${bike.modelo} - ${bike.cor}`,
          20,
          yPos
        );
        yPos += 15;

        doc.setFont("helvetica", "bold");
        doc.text("Serviço", 20, yPos);
        doc.text("Qtd", 120, yPos);
        doc.text("Valor", 150, yPos);
        yPos += 8;

        let totalBike = 0;

        doc.setFont("helvetica", "normal");
        if (bike.services) {
          Object.entries(bike.services).forEach(([serviceName, quantity]) => {
            if (quantity > 0) {
              const serviceValue =
                bike.serviceValues?.[serviceName]?.valorFinal ||
                bike.serviceValues?.[serviceName]?.valor ||
                bike.valorServicos?.[serviceName] ||
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

        if (bike.pecas && bike.pecas.length > 0) {
          yPos += 5;
          doc.setFont("helvetica", "bold");
          doc.text("PEÇAS:", 20, yPos);
          yPos += 7;

          doc.setFont("helvetica", "normal");
          bike.pecas.forEach((peca) => {
            const qty = parseInt(peca.quantidade) || 1;
            const valorPeca = parseFloat(peca.valor) || 0;
            const subtotal = valorPeca * qty;
            totalBike += subtotal;
            doc.text(`• ${peca.nome} (${qty}x)`, 20, yPos);
            doc.text(`R$ ${subtotal.toFixed(2)}`, 150, yPos);
            yPos += 7;
          });
        }

        totalGeral += totalBike;
        yPos += 5;
        doc.setFont("helvetica", "bold");
        doc.text(`Subtotal: R$ ${totalBike.toFixed(2)}`, 120, yPos);
        yPos += 15;

        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
      });

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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/")}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <img src="/assets/Logo.png" alt="Sport & Bike" className="w-12 h-12" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Sport & Bike</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">25 anos de tradição</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const newTheme = isDarkMode ? "light" : "dark";
                  setIsDarkMode(!isDarkMode);
                  localStorage.setItem("theme", newTheme);
                  document.documentElement.classList.toggle("dark", newTheme === "dark");
                }}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {isDarkMode ? "🌞" : "🌙"}
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-8">
              Consulta de Ordem de Serviço
            </h1>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-8 shadow-2xl mb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Digite o número da OS ou telefone
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                    <input
                      type="text"
                      id="search"
                      value={searchValue}
                      onChange={handleInputChange}
                      placeholder="OS-20241204B ou (85) 99999-9999"
                      className="pl-12 w-full px-6 py-4 text-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      maxLength={20}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-8 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg disabled:transform-none disabled:cursor-not-allowed"
                >
                  {loading ? "Consultando..." : "Consultar"}
                </button>

                {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
              </form>
            </div>

            <div className="text-center mb-8 space-y-2">
              <button
                type="button"
                onClick={() => setShowOldOSForm(true)}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 text-gray-800 dark:text-white px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
              >
                Ordem de Serviço em Papel
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400">Clique para consultar uma ordem de serviço registrada em papel</p>
            </div>

          {ordens.length > 0 && (
            <div className="space-y-8">
              {ordens.map((ordem) => {
                const valorAtualizado = calcularValorAtualizado(ordem);

                return (
                  <div
                    key={ordem.id}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-8 shadow-2xl animate-fade-in"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">OS {ordem.codigo || "-"}</h3>
                      <span className={`flex items-center space-x-2 px-4 py-1 rounded-full ${getStatusColor(ordem.status)}`}> 
                        {ordem.status === "Pendente" ? <Clock className="w-5 h-5" /> : ordem.status === "Em Andamento" ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        <span className="font-semibold">{ordem.status || "Pendente"}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {ordem.bicicletas?.map((bike, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Bicicleta {index + 1}
                          </h4>
                          <p>
                            <strong>Marca:</strong> {bike.marca || "-"}
                          </p>
                          <p>
                            <strong>Modelo:</strong> {bike.modelo || "-"}
                          </p>
                          <p>
                            <strong>Cor:</strong> {bike.cor || "-"}
                          </p>

                          <div className="mt-3">
                            <strong className="text-gray-700 dark:text-gray-300">Serviços:</strong>
                            {bike.services &&
                              Object.entries(bike.services)
                                .filter(([_, quantity]) => quantity > 0)
                                .map(([service, quantity], idx) => (
                                  <p key={idx} className="text-gray-600 dark:text-gray-400 ml-4">
                                    • {service}: {quantity}x
                                  </p>
                                ))}
                          </div>

                          {bike.observacoes && (
                            <p className="mt-3 text-gray-600 dark:text-gray-400">
                              <strong>Observações:</strong> {bike.observacoes}
                            </p>
                          )}
                        </div>
                      ))}

                      <div>
                        <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Datas</h4>
                        <p>
                          <strong>Agendamento:</strong>{" "}
                          {formatarData(ordem.dataAgendamento, true)}
                        </p>
                        <p>
                          <strong>Criação:</strong>{" "}
                          {formatarData(ordem.dataCriacao)}
                        </p>
                        <p>
                          <strong>Última Atualização:</strong>{" "}
                          {formatarData(ordem.dataAtualizacao)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Total de Bikes: {ordem.totalBikes || 1}
                          </p>
                          <p className="text-xl font-bold text-gray-800 dark:text-white">
                            {/* Agora usamos o valor recalculado */}
                            Valor Total: {formatarDinheiro(valorAtualizado)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => generatePDF(ordem)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                          >
                            Gerar PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

            <div className="text-center mt-8">
              <button
                onClick={() => handleHistoryClick()}
                disabled={loading}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 text-gray-800 dark:text-white px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg inline-flex items-center space-x-2"
              >
                <History className="w-5 h-5" />
                <span>{loading ? "Carregando..." : "Ver Histórico"}</span>
              </button>
            </div>
          </div>
        </main>

        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => handleHistoryClick()}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110"
            title="Ver Histórico"
          >
            <History className="w-6 h-6" />
          </button>
        </div>

        {showOldOSForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Ordem de Serviço em Papel</h3>
                <button
                  onClick={() => setShowOldOSForm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <input
                    name="nome"
                    value={oldOSData.nome}
                    onChange={handleOldChange}
                    placeholder="Ex: João da Silva"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Modelo</label>
                  <input
                    name="modelo"
                    value={oldOSData.modelo}
                    onChange={handleOldChange}
                    placeholder="Ex: Caloi Elite"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cor</label>
                  <input
                    name="cor"
                    value={oldOSData.cor}
                    onChange={handleOldChange}
                    placeholder="Ex: Vermelha"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Número da OS</label>
                  <input
                    name="osNumber"
                    value={oldOSData.osNumber}
                    onChange={handleOldChange}
                    placeholder="Ex: 1234"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex justify-end gap-4 pt-2">
                  <button type="button" onClick={() => setShowOldOSForm(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300">
                    Cancelar
                  </button>
                  <button type="button" onClick={handleOldSubmit} className="px-6 py-2 rounded bg-green-600 hover:bg-green-700 text-white">
                    Enviar para WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultaOS;
