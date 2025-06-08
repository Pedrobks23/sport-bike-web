import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PlusCircle, Edit, Trash, FileText } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { jsPDF } from "jspdf";
import { db } from "../config/firebase";
import {
  createReceipt,
  getReceipts,
  updateReceipt,
  deleteReceipt
} from "../services/receiptService";

const ReceiptsManagement = () => {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    data: "",
    nome: "",
    telefone: "",
    cpf: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const data = await getReceipts();
      setReceipts(data);
    } catch (err) {
      console.error("Erro ao carregar recibos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchClient = async () => {
    if (!formData.telefone) return;
    try {
      const clientRef = doc(db, "clientes", formData.telefone);
      const clientDoc = await getDoc(clientRef);
      if (clientDoc.exists()) {
        const data = clientDoc.data();
        setFormData((prev) => ({
          ...prev,
          nome: data.nome || "",
          cpf: data.cpf || ""
        }));
      }
    } catch (err) {
      console.error("Erro ao buscar cliente:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const receiptData = {
        data: formData.data,
        cliente: {
          nome: formData.nome,
          telefone: formData.telefone,
          cpf: formData.cpf
        }
      };
      if (isEditing) {
        await updateReceipt(editingId, receiptData);
      } else {
        await createReceipt(receiptData);
      }
      setFormData({ data: "", nome: "", telefone: "", cpf: "" });
      setIsEditing(false);
      setEditingId(null);
      loadReceipts();
    } catch (err) {
      console.error("Erro ao salvar recibo:", err);
    }
  };

  const handleEdit = (receipt) => {
    setFormData({
      data: receipt.data || "",
      nome: receipt.cliente?.nome || "",
      telefone: receipt.cliente?.telefone || "",
      cpf: receipt.cliente?.cpf || ""
    });
    setIsEditing(true);
    setEditingId(receipt.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja excluir este recibo?")) return;
    try {
      await deleteReceipt(id);
      loadReceipts();
    } catch (err) {
      console.error("Erro ao excluir recibo:", err);
    }
  };

  const generatePDF = (receipt) => {
    const docPDF = new jsPDF();
    docPDF.setFontSize(16);
    docPDF.text("RECIBO", 105, 20, { align: "center" });

    docPDF.setFontSize(12);
    docPDF.text("Sport Bike", 105, 30, { align: "center" });
    docPDF.text(
      "Rua Ana Bilhar, 1680 - Varjota, Fortaleza - CE",
      105,
      36,
      { align: "center" }
    );
    docPDF.text("(85) 3267-7425", 105, 42, { align: "center" });

    const yStart = 60;
    let yPos = yStart;

    docPDF.setFontSize(11);
    docPDF.text(`Data: ${new Date(receipt.data).toLocaleDateString("pt-BR")}`, 20, yPos);
    yPos += 8;
    docPDF.text(`Cliente: ${receipt.cliente?.nome || ""}`, 20, yPos);
    yPos += 8;
    docPDF.text(`Telefone: ${receipt.cliente?.telefone || ""}`, 20, yPos);
    yPos += 8;
    if (receipt.cliente?.cpf) {
      docPDF.text(`CPF: ${receipt.cliente.cpf}`, 20, yPos);
    }

    docPDF.save(`Recibo-${receipt.id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={() => navigate("/admin")}
            className="mr-4 text-gray-600 hover:text-gray-900 flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Recibos</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Data</label>
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Telefone</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
                <button
                  type="button"
                  onClick={handleSearchClient}
                  className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 flex items-center"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CPF</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingId(null);
                  setFormData({ data: "", nome: "", telefone: "", cpf: "" });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-700"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 flex items-center"
            >
              {isEditing ? "Atualizar" : "Salvar"}
            </button>
          </div>
        </form>

        {loading ? (
          <div>Carregando...</div>
        ) : (
          <div className="bg-white rounded shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rec.data ? new Date(rec.data).toLocaleDateString("pt-BR") : ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{rec.cliente?.nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{rec.cliente?.telefone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{rec.cliente?.cpf}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right flex gap-2 justify-end">
                      <button onClick={() => handleEdit(rec)} className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(rec.id)} className="text-red-600 hover:text-red-800">
                        <Trash className="w-4 h-4" />
                      </button>
                      <button onClick={() => generatePDF(rec)} className="text-gray-600 hover:text-gray-800">
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default ReceiptsManagement;
