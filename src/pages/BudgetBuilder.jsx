import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  FileSignature,
  ListPlus,
  Plus,
  Trash2,
  Edit3,
  FileText,
  Copy,
  CheckCircle2,
  Save,
  RefreshCcw,
  Wand2,
  FileDown,
  BadgeCheck,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { createBudget } from "../services/budgetService";

const toNumber = (value) => {
  if (value === undefined || value === null) return 0;
  const normalized = String(value).replace(/\./g, "").replace(/,/g, ".");
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const currency = (value) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function BudgetBuilder() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("list");
  const [items, setItems] = useState([]);
  const [rawText, setRawText] = useState("");
  const [parsedItems, setParsedItems] = useState([]);
  const [previewText, setPreviewText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customTotal, setCustomTotal] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const descriptionRef = useRef(null);

  const modeItems = mode === "list" ? items : parsedItems;

  const total = useMemo(() => {
    return (modeItems || []).reduce((sum, item) => {
      const qty = Number(item.qty || item.quantity || 1);
      const price = Number(item.unitPrice || item.valor || 0);
      return sum + qty * price;
    }, 0);
  }, [modeItems]);

  const displayTotal = customTotal ? toNumber(customTotal) : total;

  const generateBudgetCode = () => {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("");
  };

  const [budgetCode] = useState(() => generateBudgetCode());

  const resetForm = () => {
    setDescription("");
    setQuantity(1);
    setUnitPrice("");
    setEditingId(null);
    setTimeout(() => descriptionRef.current?.focus(), 50);
  };

  const handleAddItem = () => {
    if (!description.trim()) return;
    const price = toNumber(unitPrice);
    const qty = Number(quantity) > 0 ? Number(quantity) : 1;
    if (editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, description, qty, unitPrice: price } : item
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        { id: crypto.randomUUID ? crypto.randomUUID() : Date.now(), description, qty, unitPrice: price },
      ]);
    }
    resetForm();
  };

  const handleEditItem = (id) => {
    const current = items.find((item) => item.id === id);
    if (current) {
      setDescription(current.description || "");
      setQuantity(current.qty || 1);
      setUnitPrice(current.unitPrice != null ? String(current.unitPrice) : "");
      setEditingId(id);
      setTimeout(() => descriptionRef.current?.focus(), 50);
    }
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClear = () => {
    setItems([]);
    setParsedItems([]);
    setRawText("");
    setPreviewText("");
    setCustomTotal("");
    resetForm();
  };

  const formatBudgetText = () => {
    const lines = [
      `ORÇAMENTO - Sport & Bike (${budgetCode})`,
      `Data: ${new Date().toLocaleDateString("pt-BR")}`,
    ];
    if (customerName) lines.push(`Cliente: ${customerName}`);
    if (customerPhone) lines.push(`Contato: ${customerPhone}`);
    lines.push("", "Itens:");

    if (mode === "list" && (modeItems || []).length > 0) {
      modeItems.forEach((item) => {
        const qty = item.qty || item.quantity || 1;
        const price = item.unitPrice || item.valor || 0;
        lines.push(`- ${item.description || "Item"} (${qty}x) = ${currency(qty * price)}`);
      });
    } else if (rawText || previewText) {
      lines.push("Conteúdo do orçamento:");
      lines.push(previewText || rawText);
    }

    lines.push("", `Total: ${currency(displayTotal)}`);
    return lines.join("\n");
  };

  const handleCopy = async () => {
    const text = formatBudgetText();
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("Orçamento copiado para a área de transferência.");
    } catch (err) {
      console.warn("Clipboard falhou, usando fallback", err);
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setFeedback("Orçamento copiado (fallback).");
    }
  };

  const parseTextToItems = () => {
    if (!rawText.trim()) {
      setParsedItems([]);
      setPreviewText("");
      return;
    }

    const lines = rawText.split(/\n+/);
    const parsed = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const sanitized = trimmed.replace(/R\$|=/gi, " ").replace(/,/g, ".");
      const numberMatches = [...sanitized.matchAll(/\d+(?:\.\d+)?/g)];
      if (numberMatches.length === 0) return;

      const priceStr = numberMatches[numberMatches.length - 1][0];
      const qtyStr = numberMatches.length > 1 ? numberMatches[0][0] : "1";
      const descCandidate = sanitized
        .replace(numberMatches[0][0], "")
        .replace(numberMatches[numberMatches.length - 1][0], "")
        .replace(/R\$/gi, "")
        .trim();

      parsed.push({
        id: `parsed-${index}`,
        description: descCandidate || `Item ${index + 1}`,
        qty: Number(qtyStr) || 1,
        unitPrice: toNumber(priceStr),
      });
    });

    setParsedItems(parsed);
    setPreviewText(rawText);
    if (parsed.length === 0) {
      setFeedback("Pré-visualização gerada. Não foi possível detectar itens automaticamente.");
    } else {
      setFeedback("Pré-visualização gerada com itens detectados.");
    }
  };

  const handleSave = async () => {
    setFeedback("");
    const payloadItems = mode === "list" ? items : parsedItems;

    if (mode === "list" && (!payloadItems || payloadItems.length === 0)) {
      setFeedback("Adicione pelo menos um item antes de salvar.");
      return;
    }

    if (mode === "paste" && !rawText.trim()) {
      setFeedback("Cole o texto do orçamento antes de salvar.");
      return;
    }

    const data = {
      mode,
      customerName: customerName?.trim() || "",
      customerPhone: customerPhone?.trim() || "",
      items: (payloadItems || []).map((item) => {
        const qty = item.qty || item.quantity || 1;
        const price = item.unitPrice || item.valor || 0;
        return {
          description: item.description,
          qty,
          unitPrice: price,
          total: qty * price,
        };
      }),
      rawText: rawText,
      total: displayTotal,
    };

    try {
      setSaving(true);
      await createBudget(data);
      setFeedback("Orçamento salvo com sucesso.");
    } catch (err) {
      console.error(err);
      setFeedback("Não foi possível salvar. Verifique sua conexão ou permissões.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 40;
    let currentY = 40;
    const pageWidth = doc.internal.pageSize.getWidth();

    try {
      const response = await fetch("/assets/Logo.png");
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      const logoImage = new Image();
      logoImage.src = dataUrl;
      await new Promise((resolve) => {
        if (logoImage.complete) {
          resolve();
        } else {
          logoImage.onload = resolve;
          logoImage.onerror = resolve;
        }
      });
      const targetWidth = 120;
      const aspectRatio = logoImage.width && logoImage.height ? logoImage.height / logoImage.width : 0.5;
      const targetHeight = Math.min(targetWidth * aspectRatio, 60);
      doc.addImage(dataUrl, "PNG", marginX, currentY, targetWidth, targetHeight || 50);
    } catch (error) {
      console.warn("Logo não pôde ser carregado", error);
    }

    doc.setFontSize(11);
    doc.text("PEREIRA COMERCIO LTDA", marginX, currentY + 65);
    doc.setTextColor(80, 80, 80);
    const headerLines = [
      "CNPJ: 52.532.493/0001-04",
      "Rua Ana Bilhar, 1680",
      "Meireles, Fortaleza-CE",
      "CEP 60160-110",
      "sportbike_fortaleza?gshid=1nblpdcbl6piu",
    ];
    headerLines.forEach((line, idx) => {
      doc.text(line, marginX, currentY + 80 + idx * 14);
    });

    const contactLines = [
      "comercialsportbike@gmail.com",
      "(85) 3267-7425",
      "(85) 3122-5874",
    ];
    contactLines.forEach((line, idx) => {
      doc.text(line, pageWidth - marginX - doc.getTextWidth(line), currentY + 12 + idx * 14);
    });
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(12);
    doc.text(new Date().toLocaleDateString("pt-BR"), pageWidth - marginX, currentY + 60, { align: "right" });

    currentY += 110;

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(marginX, currentY, pageWidth - marginX * 2, 36, 4, 4, "F");
    doc.setFontSize(16);
    doc.text(`Orçamento ${budgetCode}`, marginX + 12, currentY + 24);
    currentY += 60;

    if (customerName || customerPhone) {
      doc.setFontSize(12);
      const labelWidth = 70;
      if (customerName) {
        doc.text("Cliente:", marginX, currentY);
        doc.text(customerName, marginX + labelWidth, currentY);
        currentY += 16;
      }
      if (customerPhone) {
        doc.text("Contato:", marginX, currentY);
        doc.text(customerPhone, marginX + labelWidth, currentY);
        currentY += 22;
      } else {
        currentY += 12;
      }
    }

    const hasItems = mode === "list" && (modeItems || []).length > 0;
    const rawContent = previewText || rawText;

    if (hasItems) {
      doc.setFontSize(13);
      doc.text("Produtos", marginX, currentY);
      currentY += 12;

      doc.autoTable({
        startY: currentY,
        head: [["Descrição", "Qtd", "Unitário", "Subtotal"]],
        body: (modeItems || []).map((item) => [
          item.description || "Item",
          String(item.qty || 1),
          currency(item.unitPrice || 0),
          currency((item.qty || 1) * (item.unitPrice || 0)),
        ]),
        styles: { fontSize: 11, halign: "left" },
        headStyles: { fillColor: [230, 230, 230], textColor: 20 },
        columnStyles: {
          1: { halign: "center" },
          2: { halign: "right" },
          3: { halign: "right" },
        },
      });
      currentY = doc.lastAutoTable?.finalY || currentY;
    }

    if (rawContent) {
      currentY += 24;
      doc.setFontSize(13);
      doc.text("Orçamento", marginX, currentY);
      currentY += 10;
      const boxHeight = doc.splitTextToSize(rawContent, pageWidth - marginX * 2 - 12).length * 14 + 20;
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(marginX, currentY, pageWidth - marginX * 2, boxHeight, 6, 6, "F");
      doc.setFontSize(11);
      const wrapped = doc.splitTextToSize(rawContent, pageWidth - marginX * 2 - 20);
      doc.text(wrapped, marginX + 10, currentY + 18);
      currentY += boxHeight + 6;
    }

    currentY += 10;
    doc.setFontSize(12);
    doc.text(`Total: ${currency(displayTotal)}`, pageWidth - marginX, currentY, { align: "right" });

    currentY += 30;
    doc.setFontSize(12);
    doc.text("Pagamento", marginX, currentY);
    currentY += 8;
    doc.setFontSize(11);
    doc.text("Meios de pagamento", marginX, currentY + 14);
    doc.text(
      "Transferência bancária, dinheiro, cartão de crédito, cartão de débito",
      marginX + 130,
      currentY + 14
    );
    doc.text("PIX", marginX, currentY + 28);
    doc.text("CNPJ: 52.532.493/0001-04", marginX + 130, currentY + 28);

    currentY += 60;
    doc.text(`Fortaleza, ${new Date().toLocaleDateString("pt-BR")}`, marginX, currentY);
    currentY += 50;
    doc.text("Sport & Bike", marginX, currentY);
    doc.text("Gilberto Pereira", marginX, currentY + 14);

    doc.save(`orcamento-${budgetCode}.pdf`);
  };

  const renderPreview = () => (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <ClipboardList size={16} />
          <span>Pré-visualização</span>
        </div>
        <img src="/assets/Logo.png" alt="Logo" className="h-8 w-auto object-contain" />
      </div>
      <div className="flex flex-wrap gap-3 text-sm text-neutral-600 dark:text-neutral-300">
        {customerName && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <BadgeCheck size={14} /> Cliente: {customerName}
          </span>
        )}
        {customerPhone && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
            Contato: {customerPhone}
          </span>
        )}
      </div>
      {mode === "list" && modeItems && modeItems.length > 0 ? (
        <div className="space-y-2">
          <div className="border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 text-xs font-semibold bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-200">
              <div className="p-2">Descrição</div>
              <div className="p-2 text-center">Qtd</div>
              <div className="p-2 text-right">Unitário</div>
              <div className="p-2 text-right">Subtotal</div>
            </div>
            {modeItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-4 text-sm border-t border-neutral-100 dark:border-neutral-800"
              >
                <div className="p-2">{item.description}</div>
                <div className="p-2 text-center">{item.qty || 1}</div>
                <div className="p-2 text-right">{currency(item.unitPrice || 0)}</div>
                <div className="p-2 text-right">{currency((item.qty || 1) * (item.unitPrice || 0))}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-end text-base font-semibold mt-2">
            Total: <span className="ml-2 text-amber-600">{currency(displayTotal)}</span>
          </div>
        </div>
      ) : rawText || previewText ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Conteúdo colado</p>
          <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 max-h-96 overflow-auto">
            <pre className="text-sm whitespace-pre-wrap text-neutral-700 dark:text-neutral-200 font-mono">{previewText || rawText}</pre>
          </div>
          <div className="flex justify-end text-base font-semibold">
            Total informado: <span className="ml-2 text-amber-600">{currency(displayTotal)}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">Cole ou adicione itens para visualizar aqui.</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <ArrowLeft size={18} />
              <span>Voltar</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Criar Orçamento</h1>
              <p className="text-neutral-600 dark:text-neutral-400">Modo rápido para balcão</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <FileSignature size={18} />
            <span>Sport & Bike</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => setMode("list")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                mode === "list"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              <ListPlus size={16} /> Adicionar por lista
            </button>
            <button
              onClick={() => setMode("paste")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                mode === "paste"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              <FileText size={16} /> Colar texto pronto
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-neutral-600 dark:text-neutral-300">Cliente (opcional)</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="text-sm text-neutral-600 dark:text-neutral-300">Telefone (opcional)</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="text-sm text-neutral-600 dark:text-neutral-300">Total (manual)</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                    value={customTotal}
                    onChange={(e) => setCustomTotal(e.target.value)}
                    placeholder="Use para sobrescrever o total (ex: 499,90)"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">No modo colar texto, este total será usado no documento.</p>
                </div>
              </div>

              {mode === "list" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-6">
                      <label className="text-sm text-neutral-600 dark:text-neutral-300">Descrição</label>
                      <input
                        ref={descriptionRef}
                        className="mt-1 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Revisão completa"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-neutral-600 dark:text-neutral-300">Qtd</label>
                      <input
                        type="number"
                        min={1}
                        className="mt-1 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-sm text-neutral-600 dark:text-neutral-300">Valor unitário</label>
                      <input
                        className="mt-1 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        placeholder="Ex: 150 ou 150,00"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <button
                        onClick={handleAddItem}
                        className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 shadow"
                      >
                        {editingId ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                        <span>{editingId ? "Atualizar" : "Adicionar"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-12 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-200">
                      <div className="col-span-6 p-2">Descrição</div>
                      <div className="col-span-2 p-2 text-center">Qtd</div>
                      <div className="col-span-2 p-2 text-right">Unitário</div>
                      <div className="col-span-2 p-2 text-right">Subtotal</div>
                    </div>
                    {(items || []).length === 0 && (
                      <div className="p-4 text-sm text-neutral-500">Nenhum item adicionado.</div>
                    )}
                    {(items || []).map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 items-center text-sm border-t border-neutral-100 dark:border-neutral-800"
                      >
                        <div className="col-span-6 p-2">{item.description}</div>
                        <div className="col-span-2 p-2 text-center">{item.qty}</div>
                        <div className="col-span-2 p-2 text-right">{currency(item.unitPrice)}</div>
                        <div className="col-span-2 p-2 text-right flex items-center justify-end gap-2">
                          <span>{currency((item.qty || 1) * (item.unitPrice || 0))}</span>
                          <button
                            onClick={() => handleEditItem(item.id)}
                            className="text-neutral-500 hover:text-amber-600"
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-600"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 text-sm">
                      <button
                        onClick={handleClear}
                        className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-800"
                      >
                        <RefreshCcw size={16} /> Limpar
                      </button>
                      <div className="text-base font-semibold">
                        Total: <span className="text-amber-600">{currency(displayTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-sm text-neutral-600 dark:text-neutral-300">Cole o texto do orçamento</label>
                  <textarea
                    className="w-full min-h-[200px] rounded-2xl border border-neutral-200 dark:border-neutral-700 px-3 py-3 bg-white dark:bg-neutral-950 text-sm"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`Exemplo:\nRevisão=130,00R$\n2 pneus 50 cada\nCabo 10`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={parseTextToItems}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      <Wand2 size={16} /> Gerar pré-visualização
                    </button>
                    <button
                      onClick={() => {
                        setPreviewText(rawText);
                        setFeedback("Pré-visualização atualizada.");
                      }}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      <ClipboardList size={16} /> Apenas visualizar
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(rawText)}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      <Copy size={16} /> Copiar
                    </button>
                  </div>
                  {parsedItems.length > 0 && (
                    <div className="text-xs text-neutral-500">Itens detectados automaticamente: {parsedItems.length}</div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {renderPreview()}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 flex flex-col gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
                >
                  <Save size={16} /> {saving ? "Salvando..." : "Salvar orçamento"}
                </button>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <Copy size={16} /> Copiar orçamento formatado
                </button>
                <button
                  onClick={handleExportPDF}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <FileDown size={16} /> Exportar PDF
                </button>
                <button
                  onClick={handleClear}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <RefreshCcw size={16} /> Limpar
                </button>
                {feedback && (
                  <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 border border-amber-100 dark:border-amber-800">
                    {feedback}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
