import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Trash, Edit } from "lucide-react";
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

const ItemEditor = ({ value, onChange }) => {
  const [items, setItems] = useState(value || []);
  const [item, setItem] = useState({ descricao: "", qtd: 1, unit: "" });

  useEffect(() => {
    onChange(items);
  }, [items]);

  const handleField = (e) => {
    const { name, value } = e.target;
    setItem((p) => ({ ...p, [name]: value }));
  };

  const add = () => {
    if (!item.descricao) return;
    setItems([
      ...items,
      { descricao: item.descricao, qtd: Number(item.qtd), unit: Number(item.unit) },
    ]);
    setItem({ descricao: "", qtd: 1, unit: "" });
  };

  const remove = (idx) => setItems(items.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          name="descricao"
          value={item.descricao}
          onChange={handleField}
          placeholder="Descrição"
          className="flex-1 border rounded px-2 py-1"
        />
        <input
          name="qtd"
          type="number"
          value={item.qtd}
          onChange={handleField}
          className="w-16 border rounded px-2 py-1"
        />
        <input
          name="unit"
          type="number"
          step="0.01"
          value={item.unit}
          onChange={handleField}
          className="w-24 border rounded px-2 py-1"
        />
        <button type="button" onClick={add} className="bg-blue-500 text-white px-3 rounded">
          +
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="border px-2">Descrição</th>
            <th className="border px-2">Qtd.</th>
            <th className="border px-2">Unit.</th>
            <th className="border px-2">Preço</th>
            <th className="border px-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td className="border px-2">{it.descricao}</td>
              <td className="border px-2 text-center">{it.qtd}</td>
              <td className="border px-2 text-right">R$ {it.unit.toFixed(2)}</td>
              <td className="border px-2 text-right">R$ {(it.qtd * it.unit).toFixed(2)}</td>
              <td className="border px-2 text-center">
                <button type="button" onClick={() => remove(idx)} className="text-red-500">
                  x
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ReceiptsManagement = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [receipts, setReceipts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
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
      }
    } catch (err) {
      console.error("Erro ao buscar cliente:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const total = form.itens.reduce((sum, it) => sum + it.qtd * it.unit, 0);
      if (editingId) {
        await updateReceipt(editingId, { ...form, valor: total });
      } else {
        const numero = await getNextReceiptNumber();
        await createReceipt({ ...form, valor: total, numero });
      }
      setForm(emptyForm);
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
      itens: receipt.itens || [],
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
    const pageW = pdf.internal.pageSize.getWidth();

    const center = (txt, y, fontSize = 10, bold = false) => {
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(fontSize);
      const w = pdf.getTextWidth(txt);
      pdf.text(txt, (pageW - w) / 2, y);
    };

    center(storeInfo.name, 40, 18, true);
    center(storeInfo.company, 60);
    center(`CNPJ ${storeInfo.cnpj}`, 75);
    center(storeInfo.address, 90);
    center(storeInfo.city, 105);
    center(`CEP ${storeInfo.cep}`, 120);
    center(storeInfo.email, 135);
    center(storeInfo.phone1, 150);
    center(storeInfo.phone2, 165);
    center(`@${storeInfo.instagram}`, 180);

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
      styles: { fontSize: 10, halign: "left" },
      headStyles: { fillColor: [245, 245, 245] },
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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/admin")}
              className="mr-4 text-gray-600 hover:text-gray-900 flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-1" /> Voltar
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Recibos</h1>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
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
              <label className="block text-sm font-medium mb-1">Itens</label>
              <ItemEditor
                value={form.itens}
                onChange={(items) => setForm((p) => ({ ...p, itens: items }))}
              />
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

        <div className="bg-white p-6 rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {receipts.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.nome}</td>
                  <td className="px-3 py-2 whitespace-nowrap">R$ {Number(r.valor || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-right flex gap-2">
                    <button onClick={() => generatePDF(r)} className="text-blue-600 hover:text-blue-800">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(r)} className="text-yellow-600 hover:text-yellow-800">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800">
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default ReceiptsManagement;