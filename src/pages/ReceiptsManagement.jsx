import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Trash, Edit } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import jsPDF from "jspdf";
import {
  createReceipt,
  getReceipts,
  updateReceipt,
  deleteReceipt,
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
  valor: "",
  descricao: "",
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
      if (editingId) {
        await updateReceipt(editingId, form);
      } else {
        await createReceipt(form);
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
      valor: receipt.valor,
      descricao: receipt.descricao || "",
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

  const generatePDF = (receipt) => {
    try {
      const docPDF = new jsPDF();
      const center = (text, y) => {
        const pageWidth = docPDF.internal.pageSize.getWidth();
        const textWidth =
          (docPDF.getStringUnitWidth(text) * docPDF.internal.getFontSize()) /
          docPDF.internal.scaleFactor;
        docPDF.text(text, (pageWidth - textWidth) / 2, y);
      };

      docPDF.setFontSize(14);
      docPDF.setFont("helvetica", "bold");
      center(storeInfo.name, 15);

      docPDF.setFontSize(10);
      docPDF.setFont("helvetica", "normal");
      center(storeInfo.company, 22);
      center(`CNPJ: ${storeInfo.cnpj}`, 27);
      center(storeInfo.address, 32);
      center(storeInfo.city, 37);
      center(`CEP ${storeInfo.cep}`, 42);
      center(storeInfo.email, 47);
      center(storeInfo.phone1, 52);
      center(storeInfo.phone2, 57);
      center(`@${storeInfo.instagram}`, 62);

      docPDF.setFontSize(14);
      docPDF.setFont("helvetica", "bold");
      center("RECIBO", 72);

      docPDF.setFontSize(12);
      docPDF.setFont("helvetica", "normal");
      const valorFormatado = Number(receipt.valor || 0).toFixed(2).replace(".", ",");
      const texto = `Declaro que recebi de ${receipt.nome}${
        receipt.cpf ? `, inscrito no CPF ${receipt.cpf}` : ""
      }, telefone ${receipt.telefone}, o valor de R$ ${valorFormatado} em ${receipt.date}${
        receipt.descricao ? `, referente a ${receipt.descricao}` : ""
      }.`;
      const linhas = docPDF.splitTextToSize(texto, 180);
      docPDF.text(linhas, 15, 82);

      center(storeInfo.cityName, 120);
      center(storeInfo.name, 128);
      center(storeInfo.responsible, 136);

      docPDF.save(`recibo-${receipt.nome}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    }
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
              <label className="block text-sm font-medium mb-1">Valor</label>
              <input
                type="number"
                name="valor"
                value={form.valor}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <input
                type="text"
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
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