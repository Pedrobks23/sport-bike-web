import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { consultarOS } from "../config/firebase";
const logo = "/assets/Logo.png";

const ConsultaOS = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ordens, setOrdens] = useState([]);

  const handleHistoryClick = async () => {
    // Verifica se o usuário digitou um telefone ou número
    if (!searchValue.trim()) {
      setError(
        "Digite um telefone ou número de OS primeiro para consultar o histórico"
      );
      setOrdens([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Faz a consulta utilizando o valor digitado pelo usuário
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

    // Converte o timestamp para Date, verificando se é timestamp do Firestore
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      ...(isAgendamento ? {} : { hour: "2-digit", minute: "2-digit" }),
    });
  };

  const formatarDinheiro = (valor) => {
    if (!valor) return "R$ 0,00";
    return `R$ ${valor.toFixed(2)}`;
  };

  const generatePDF = async (ordem) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 50;

      // Função para centralizar texto
      const centerText = (text, y) => {
        const textWidth =
          (doc.getStringUnitWidth(text) * doc.internal.getFontSize()) /
          doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
      };

      // Logo e Cabeçalho
      doc.addImage(logo, "PNG", 20, 10, 40, 40);

      // Título e informações da empresa
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

      // Formatação das datas
      const dataCriacao = ordem.dataCriacao?.toDate
        ? ordem.dataCriacao.toDate()
        : new Date(ordem.dataCriacao);
      const dataAgendamento = ordem.dataAgendamento?.toDate
        ? ordem.dataAgendamento.toDate()
        : new Date(ordem.dataAgendamento);

      doc.text(`Criada em: ${dataCriacao.toLocaleString("pt-BR")}`, 20, yPos);
      yPos += 10;

      if (ordem.dataAgendamento) {
        doc.text(
          `Agendada para: ${dataAgendamento.toLocaleString("pt-BR")}`,
          20,
          yPos
        );
        yPos += 15;
      }

      // Dados do Cliente
      doc.text("DADOS DO CLIENTE", 20, yPos);
      yPos += 10;
      doc.setFont("helvetica", "normal");
      doc.text(`Nome: ${ordem.cliente?.nome || "-"}`, 20, yPos);
      yPos += 7;
      doc.text(`Telefone: ${ordem.cliente?.telefone || "-"}`, 20, yPos);
      yPos += 15;

      // Bicicletas e Serviços
      let totalGeral = 0;

      ordem.bicicletas?.forEach((bike, index) => {
        // Título da bicicleta
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

        // Serviços
        doc.setFont("helvetica", "normal");
        if (bike.services) {
          Object.entries(bike.services)
            .filter(([_, quantity]) => quantity > 0)
            .forEach(([service, quantity]) => {
              const valorUnitario = ordem.valorServicos?.[service] || 100;
              const subtotal = valorUnitario * quantity;
              totalBike += subtotal;

              doc.text(`• ${service}`, 20, yPos);
              doc.text(`${quantity}`, 120, yPos);
              doc.text(`R$ ${subtotal.toFixed(2)}`, 150, yPos);
              yPos += 7;
            });
        }

        // Peças
        if (bike.pecas && bike.pecas.length > 0) {
          yPos += 5;
          doc.setFont("helvetica", "bold");
          doc.text("PEÇAS:", 20, yPos);
          yPos += 7;

          doc.setFont("helvetica", "normal");
          bike.pecas.forEach((peca) => {
            const valorPeca = parseFloat(peca.valor) || 0;
            totalBike += valorPeca;
            doc.text(`• ${peca.nome}`, 20, yPos);
            doc.text(`R$ ${valorPeca.toFixed(2)}`, 150, yPos);
            yPos += 7;
          });
        }

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

      // Total Geral
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL GERAL: R$ ${totalGeral.toFixed(2)}`, 20, yPos);
      yPos += 15;

      // Observações
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

      // Salvar PDF
      doc.save(`OS-${ordem.codigo}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    }
  };

  const detectarTipoBusca = (valor) => {
    const valorLimpo = valor.replace(/\D/g, "");
    if (valor.toUpperCase().startsWith("OS-")) return "os";
    if (valorLimpo.length >= 9 && valorLimpo.length <= 11) return "telefone";
    return "os";
  };

  const formatarInput = (valor) => {
    // Remove espaços em branco
    const valorLimpo = valor.trim();

    // Se já é um número de OS, apenas converte para maiúsculo
    if (valorLimpo.toUpperCase().startsWith("OS-")) {
      return valorLimpo.toUpperCase();
    }

    // Tenta identificar se é um telefone
    const numeros = valorLimpo.replace(/\D/g, "");
    if (numeros.length >= 10 || valorLimpo.includes("(")) {
      // Formata como telefone
      if (numeros.length <= 2) return numeros;
      if (numeros.length <= 6)
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
      if (numeros.length <= 10)
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(
          6
        )}`;
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(
        7,
        11
      )}`;
    }

    // Se não é telefone, retorna o valor em maiúsculo sem modificar
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

      // Detecta se é uma busca por OS ou telefone
      const isOS = searchValue.toUpperCase().includes("OS-");
      const tipo = isOS ? "os" : "telefone";

      // Para busca por telefone, guarda o valor limpo
      if (tipo === "telefone") {
        const telefoneNumerico = searchValue.replace(/\D/g, "");
        if (telefoneNumerico.length < 10) {
          throw new Error("Telefone inválido");
        }
        sessionStorage.setItem("telefoneConsulta", telefoneNumerico);
      }

      // Para busca por OS, verifica se tem telefone guardado
      if (tipo === "os" && !sessionStorage.getItem("telefoneConsulta")) {
        throw new Error("Por favor, faça primeiro uma busca por telefone");
      }

      const resultado = await consultarOS(tipo, searchValue);

      if (resultado.length === 0) {
        setError("Nenhuma ordem de serviço encontrada");
      } else {
        setOrdens(resultado);
      }
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
      "Em Andamento": "bg-blue-100 text-blue-800", // Atualizado
      Pronto: "bg-green-100 text-green-800", // Atualizado
      Cancelado: "bg-red-100 text-red-800",
      "Em andamento": "bg-blue-100 text-blue-800",
      Concluído: "bg-green-100 text-green-800",
    };

    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] relative overflow-hidden">
      {/* Gradientes de fundo */}
      <div
        className="absolute top-0 left-0 w-[500px] h-[500px] 
        bg-[#FFC107] rounded-full opacity-20 blur-3xl -translate-x-1/2 -translate-y-1/2"
      />
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] 
        bg-[#FFC107] rounded-full opacity-20 blur-3xl translate-x-1/2 translate-y-1/2"
      />

      {/* Header */}
      <header className="relative z-10 bg-white shadow-sm">
        <div className="container mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="text-[#333] hover:text-[#FFC107] transition-colors"
            >
              ← Voltar
            </button>
            <img src="/assets/Logo.png" alt="Sport & Bike" className="h-36" />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-[#333] mb-8">
            Consulta de Ordem de Serviço
          </h1>

          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="mb-6">
                <label
                  htmlFor="search"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Digite o número da OS ou telefone
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchValue}
                  onChange={handleInputChange}
                  placeholder="OS-20241204B ou (85) 99999-9999"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 
                    focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                  maxLength={20}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFC107] text-[#333] font-bold py-3 px-6 
                  rounded-lg transition duration-300 hover:bg-[#FFB000] 
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Consultando..." : "Consultar"}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </div>
          {/* Resultados */}
          {ordens.length > 0 && (
            <div className="space-y-6">
              {ordens.map((ordem) => (
                <div
                  key={ordem.id}
                  className="bg-white p-6 rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        OS {ordem.codigo || "-"}
                      </h3>
                      <p className="text-gray-600">
                        Cliente: {ordem.cliente?.nome || "-"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        ordem.status
                      )}`}
                    >
                      {ordem.status || "Pendente"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {ordem.bicicletas &&
                      ordem.bicicletas.map((bike, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-bold text-gray-700 mb-2">
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
                            <strong className="text-gray-700">Serviços:</strong>
                            {bike.services &&
                              Object.entries(bike.services)
                                .filter(([_, quantity]) => quantity > 0)
                                .map(([service, quantity], idx) => (
                                  <p key={idx} className="text-gray-600 ml-4">
                                    • {service}: {quantity}x
                                  </p>
                                ))}
                          </div>

                          {bike.observacoes && (
                            <p className="mt-3 text-gray-600">
                              <strong>Observações:</strong> {bike.observacoes}
                            </p>
                          )}
                        </div>
                      ))}

                    <div>
                      <h4 className="font-bold text-gray-700 mb-2">Datas</h4>
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
                        <p className="text-gray-600">
                          Total de Bikes: {ordem.totalBikes || 1}
                        </p>
                        <p className="text-xl font-bold text-gray-800">
                          Valor Total: R$ {ordem.valorTotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => generatePDF(ordem)}
                          className="bg-blue-500 text-white font-bold py-2 px-4 
                  rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Gerar PDF
                        </button>
                        {ordem.urls && (
                          <a
                            href={ordem.urls}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#FFC107] text-[#333] font-bold py-2 px-4 
                    rounded-lg hover:bg-[#FFB000] transition-colors"
                          >
                            Ver Detalhes
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botão de Histórico */}
          <button
            onClick={handleHistoryClick}
            disabled={loading}
            className="fixed bottom-6 right-6 bg-[#FFC107] text-[#333] font-bold 
    py-3 px-6 rounded-full shadow-lg hover:bg-[#FFB000] 
    transition-colors flex items-center gap-2 z-50"
          >
            <span className="text-xl">📋</span>
            {loading ? "Carregando..." : "Ver Histórico"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default ConsultaOS;
