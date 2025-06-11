import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Receipt,
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Calendar,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  createReceipt,
  getReceipts,
  updateReceipt,
  deleteReceipt,
  getNextReceiptNumber,
} from "../services/receiptService";
import { getLatestCompletedOrderByPhone } from "../services/orderService";
const storeInfo = {
  name: "Sport & Bike",
  company: "RP COMERCIO DE BICICLETAS E SERVICOS LTDA",
  cnpj: "17.338.208/0001-18",
  address: "Rua Manuel Jesuíno, 706, Loja de Bicicletas",
  city: "Varjota, Fortaleza-CE",
  cep: "60175-214",
  email: "comercialsportbike@gmail.com",
  phone1: "+55 (85) 3267-7425",
  phone2: "+55 (85) 3122-5874",
  instagram: "sportbike_fortaleza",
  responsible: "Gilberto Pereira",
  cityName: "Fortaleza",
};


const emptyForm = {
  date: "",
  nome: "",
  telefone: "",
  cpf: "",
  endereco: "",
  itens: [],
  pagamento: "",
};


const ReceiptsManagement = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [form, setForm] = useState({
    ...emptyForm,
    itens: [{ descricao: "", qtd: 1, unit: "" }],
  });
  const [receipts, setReceipts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const data = await getReceipts();
      setReceipts(data);
    } catch (err) {
      console.error("Erro ao carregar recibos:", err);
    }
  };

  const searchClient = async () => {
    if (!form.telefone) return;
    try {
      const clientRef = doc(db, "clientes", form.telefone);
      const snapshot = await getDoc(clientRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setForm((prev) => ({
          ...prev,
          nome: data.nome || "",
          cpf: data.cpf || "",
          endereco: data.endereco || prev.endereco || "",
        }));
        await loadLatestOrder(data.telefone || form.telefone);
      }
    } catch (err) {
      console.error("Erro ao buscar cliente:", err);
    }
  };

  const loadLatestOrder = async (phone) => {
    try {
      const order = await getLatestCompletedOrderByPhone(phone);
      if (order) {
        const items = [];
        order.bicicletas?.forEach((bike) => {
          if (bike.serviceValues) {
            Object.entries(bike.serviceValues).forEach(([name, svc]) => {
              const qtd = bike.services?.[name] || 1;
              const unit = parseFloat(svc.valorFinal ?? svc.valor ?? 0);
              items.push({ descricao: name, qtd, unit });
            });
          } else if (bike.valorServicos) {
            Object.entries(bike.valorServicos).forEach(([name, val]) => {
              const qtd = bike.services?.[name] || 1;
              items.push({ descricao: name, qtd, unit: parseFloat(val) });
            });
          }
          if (Array.isArray(bike.pecas)) {
            bike.pecas.forEach((peca) => {
              items.push({
                descricao: peca.nome || peca.descricao || "Peça",
                qtd: 1,
                unit: parseFloat(peca.valor || 0),
              });
            });
          }
        });
        if (items.length > 0) {
          setForm((prev) => ({ ...prev, itens: items }));
        }
      }
    } catch (err) {
      console.error("Erro ao buscar ordem para recibo:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.itens];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm((prev) => ({ ...prev, itens: newItems }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      itens: [...prev.itens, { descricao: "", qtd: 1, unit: "" }],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalItems = form.itens.filter((it) => it.descricao);
      const total = finalItems.reduce(
        (sum, it) => sum + Number(it.qtd) * Number(it.unit),
        0
      );
      if (editingId) {
        await updateReceipt(editingId, { ...form, itens: finalItems, valor: total });
      } else {
        const numero = await getNextReceiptNumber();
        await createReceipt({ ...form, itens: finalItems, valor: total, numero });
      }
      setForm({ ...emptyForm, itens: [{ descricao: "", qtd: 1, unit: "" }] });
      setEditingId(null);
      loadReceipts();
    } catch (err) {
      console.error("Erro ao salvar recibo:", err);
    }
  };

  const handleEdit = (receipt) => {
    setForm({
      date: receipt.date,
      nome: receipt.nome,
      telefone: receipt.telefone,
      cpf: receipt.cpf,
      endereco: receipt.endereco || "",
      itens:
        receipt.itens && receipt.itens.length > 0
          ? receipt.itens
          : [{ descricao: "", qtd: 1, unit: "" }],
      pagamento: receipt.pagamento || "",
    });
    setEditingId(receipt.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Excluir este recibo?")) return;
    try {
      await deleteReceipt(id);
      loadReceipts();
    } catch (err) {
      console.error("Erro ao excluir recibo:", err);
    }
  };

  const generatePDF = (r) => {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    pdf.setTextColor(0, 0, 0);
    const pageW = pdf.internal.pageSize.getWidth();

    const center = (txt, y, fontSize = 10, bold = false) => {
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(fontSize);
      const w = pdf.getTextWidth(txt);
      pdf.text(txt, (pageW - w) / 2, y);
    };

    pdf.setFontSize(12);
    pdf.text(storeInfo.name, 40, 40);
    pdf.text(`CNPJ ${storeInfo.cnpj}`, 40, 55);
    pdf.text(storeInfo.address, pageW / 2, 40, { align: "center" });
    pdf.text(`${storeInfo.city} - CEP ${storeInfo.cep}`, pageW / 2, 55, { align: "center" });
    pdf.text(storeInfo.phone1, pageW - 40, 40, { align: "right" });
    pdf.text(storeInfo.phone2, pageW - 40, 55, { align: "right" });
    pdf.text(storeInfo.email, pageW - 40, 70, { align: "right" });
    pdf.text(`@${storeInfo.instagram}`, pageW - 40, 85, { align: "right" });

    center(storeInfo.company, 110);

    center("RECIBO", 210, 16, true);
    center(r.numero, 230, 11);

    const valorFmt = Number(r.valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    const declaracao = `Declaro que recebi de ${r.nome}${
      r.cpf ? `, inscrito no CPF ${r.cpf}` : ""
    }${
      r.endereco ? `, com endereço em ${r.endereco}` : ""
    }, o valor de ${valorFmt} em ${r.date
      .split("-")
      .reverse()
      .join("/")} referente aos seguintes produtos:`;
    const lines = pdf.splitTextToSize(declaracao, 500);
    pdf.text(lines, 40, 260);

    const tableData = r.itens.map((it) => [
      it.descricao,
      `R$ ${Number(it.unit).toFixed(2)}`,
      it.qtd,
      `R$ ${(it.qtd * it.unit).toFixed(2)}`,
    ]);
    pdf.autoTable({
      head: [["Descrição", "Preço unit.", "Qtd.", "Preço"]],
      body: tableData,
      startY: pdf.previousAutoTable ? pdf.previousAutoTable.finalY + 10 : 300,
      styles: { fontSize: 10, halign: "left", textColor: [0, 0, 0] },
      headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0] },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "center" }, 3: { halign: "right" } },
    });

    const afterTableY = pdf.previousAutoTable.finalY + 20;
    pdf.setFont("helvetica", "bold");
    pdf.text(`Total ${valorFmt}`, 40, afterTableY);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Meio de pagamento: ${r.pagamento || "-"}`, 40, afterTableY + 18);

    const footerY = afterTableY + 80;
    center(storeInfo.cityName, footerY);
    center(storeInfo.name, footerY + 25);
    center(storeInfo.responsible, footerY + 50);

    pdf.save(`recibo-${r.numero}.pdf`);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gradient-to-br from-gray-50 via-amber-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/admin")}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 p-2 rounded-full">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciar Recibos</h1>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <form onSubmit={handleSubmit} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="telefone"
                  value={form.telefone}
                  onChange={handleChange}
                  className="flex-1 border rounded px-3 py-2"
                  required
                />
                <button
                  type="button"
                  onClick={searchClient}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Buscar
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CPF</label>
              <input
                type="text"
                name="cpf"
                value={form.cpf}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <input
                type="text"
                name="endereco"
                value={form.endereco}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Forma de pagamento</label>
              <select
                name="pagamento"
                value={form.pagamento}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Selecionar…</option>
                <option>Dinheiro</option>
                <option>Pix</option>
                <option>Cartão de crédito</option>
                <option>Cartão de débito</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium">Itens</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:from-blue-600 hover:to-blue-700 transition-all inline-flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </div>

              <div className="space-y-3">
                {form.itens.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={item.descricao}
                        onChange={(e) => handleItemChange(index, "descricao", e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                        placeholder="Descrição"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.qtd}
                        onChange={(e) => handleItemChange(index, "qtd", e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                        placeholder="Qtd."
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                        placeholder="Unit."
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        readOnly
                        value={
                          item.qtd && item.unit
                            ? (Number(item.qtd) * Number(item.unit)).toFixed(2)
                            : ""
                        }
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                        placeholder="Preço"
                      />
                    </div>
                    <div className="col-span-1">
                      {form.itens.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 text-right">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {editingId ? "Atualizar" : "Salvar"}
            </button>
          </div>
        </form>

        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Recibos Emitidos</h2>
            <button
              type="button"
              onClick={() => {}}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all inline-flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Buscar</span>
            </button>
          </div>

          <div className="space-y-4">
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">DATA</span>
                        <p className="text-gray-800 dark:text-white">{receipt.date}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">CLIENTE</span>
                        <p className="text-gray-800 dark:text-white">{receipt.nome}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">VALOR</span>
                        <p className="text-gray-800 dark:text-white font-semibold">R$ {Number(receipt.valor || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      type="button"
                      onClick={() => generatePDF(receipt)}
                      className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(receipt)}
                      className="p-2 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(receipt.id)}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  </div>
  );
};

export default ReceiptsManagement;