// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import MainNavbar from "@/components/layout/MainNavbar";
import { listBuildProducts } from "@/services/productsService";
import { getProductsUIConfig } from "@/services/uiConfigService";
import { normalizeProductImages, productImgUrl } from "@/utils/productImage";

const STEPS = [
  { key: "aro", label: "Aro" },
  { key: "quadro", label: "Quadro" },
  { key: "tamanho", label: "Tamanho do quadro" },
  { key: "Rodas", label: "Rodas" },
  { key: "Transmissão", label: "Transmissão" },
  { key: "Freios", label: "Freios" },
  { key: "Cockpit", label: "Cockpit" },
  { key: "Acessórios", label: "Acessórios" },
  { key: "resumo", label: "Resumo" },
];

const STEP_LABELS = ["Rodas", "Transmissão", "Freios", "Cockpit", "Acessórios"];

const parsePriceNumber = (val) => {
  const cleaned = String(val ?? "")
    .replace(/R\$/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = Number(cleaned);
  return Number.isNaN(num) ? 0 : num;
};

const formatBRL = (value) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getProductImage = (product) => {
  const images = normalizeProductImages(product?.images || product?.image || []);
  const first = images[0];
  if (!first) return null;
  if (first.publicId) return productImgUrl(first.publicId, "card");
  return first.secureUrl || null;
};

const isCompatibleWithAro = (product, selectedAro) => {
  const aros = product?.compatibilidade?.aro || [];
  if (!selectedAro) return false;
  if (!Array.isArray(aros) || aros.length === 0) return false;
  return aros.includes(selectedAro);
};

export default function BuildBikePublic() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [uiConfig, setUIConfig] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedAro, setSelectedAro] = useState(null);
  const [selectedQuadro, setSelectedQuadro] = useState(null);
  const [tamanhoQuadro, setTamanhoQuadro] = useState("");
  const [selectedParts, setSelectedParts] = useState({
    Rodas: null,
    Transmissão: null,
    Freios: null,
    Cockpit: null,
    Acessórios: [],
  });
  const [maoDeObra, setMaoDeObra] = useState("0");
  const [desconto, setDesconto] = useState("0");
  const [whatsPhone, setWhatsPhone] = useState("");

  useEffect(() => {
    document.title = "Monte sua Bike | Sport Bike";
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [items, config] = await Promise.all([listBuildProducts(), getProductsUIConfig()]);
        setProducts(items || []);
        setUIConfig(config);
      } catch (err) {
        console.error(err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const availableAros = useMemo(
    () => uiConfig?.monteSuaBikeArosDisponiveis || [],
    [uiConfig]
  );

  const quadrosDisponiveis = useMemo(() => {
    return (products || [])
      .filter((product) => product?.visivelMontagem)
      .filter((product) => (product?.etapasMontagem || []).includes("Quadro"))
      .filter((product) => isCompatibleWithAro(product, selectedAro));
  }, [products, selectedAro]);

  const productsByStep = useMemo(() => {
    const map = {};
    STEP_LABELS.forEach((step) => {
      map[step] = (products || [])
        .filter((product) => product?.visivelMontagem)
        .filter((product) => (product?.etapasMontagem || []).includes(step))
        .filter((product) => isCompatibleWithAro(product, selectedAro));
    });
    return map;
  }, [products, selectedAro]);

  const quadroTamanhos = useMemo(() => {
    if (!selectedQuadro) return [];
    const list = selectedQuadro?.quadroTamanhosDisponiveis || [];
    return Array.isArray(list) ? list : [];
  }, [selectedQuadro]);

  const subtotal = useMemo(() => {
    const quadroValue = selectedQuadro ? parsePriceNumber(selectedQuadro.price || 0) : 0;
    const parts = Object.entries(selectedParts).reduce((total, [key, value]) => {
      if (key === "Acessórios") {
        return (
          total +
          (Array.isArray(value)
            ? value.reduce((sum, item) => sum + parsePriceNumber(item?.price || 0), 0)
            : 0)
        );
      }
      return total + (value ? parsePriceNumber(value.price || 0) : 0);
    }, 0);
    return quadroValue + parts;
  }, [selectedQuadro, selectedParts]);

  const total = useMemo(() => {
    const mao = parsePriceNumber(maoDeObra || 0);
    const desc = parsePriceNumber(desconto || 0);
    return subtotal + mao - desc;
  }, [subtotal, maoDeObra, desconto]);

  const canGoNext = useMemo(() => {
    const step = STEPS[stepIndex]?.key;
    if (step === "aro") return !!selectedAro;
    if (step === "quadro") return !!selectedQuadro;
    if (step === "tamanho" && quadroTamanhos.length) return !!tamanhoQuadro;
    return true;
  }, [stepIndex, selectedAro, selectedQuadro, quadroTamanhos.length, tamanhoQuadro]);

  const advanceStep = () => {
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const previousStep = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleToggleAccessory = (product) => {
    setSelectedParts((prev) => {
      const list = Array.isArray(prev.Acessórios) ? prev.Acessórios : [];
      const exists = list.find((item) => item?.id === product?.id);
      const next = exists ? list.filter((item) => item?.id !== product?.id) : [...list, product];
      return { ...prev, Acessórios: next };
    });
  };

  const buildWhatsappMessage = () => {
    const lines = [];
    lines.push("Montagem Sport Bike");
    if (selectedAro) lines.push(`Aro: ${selectedAro}`);
    if (selectedQuadro) {
      lines.push(`Quadro: ${selectedQuadro.name || "Sem nome"} (${formatBRL(selectedQuadro.price || 0)})`);
    }
    if (tamanhoQuadro) lines.push(`Tamanho do quadro: ${tamanhoQuadro}`);
    STEP_LABELS.forEach((step) => {
      if (step === "Acessórios") return;
      const item = selectedParts[step];
      if (item) lines.push(`${step}: ${item.name || "Sem nome"} (${formatBRL(item.price || 0)})`);
    });
    if (selectedParts.Acessórios?.length) {
      lines.push("Acessórios:");
      selectedParts.Acessórios.forEach((item) => {
        lines.push(`- ${item.name || "Sem nome"} (${formatBRL(item.price || 0)})`);
      });
    }
    lines.push(`Subtotal: ${formatBRL(subtotal)}`);
    if (parsePriceNumber(maoDeObra)) lines.push(`Mão de obra: ${formatBRL(maoDeObra)}`);
    if (parsePriceNumber(desconto)) lines.push(`Desconto: ${formatBRL(desconto)}`);
    lines.push(`Total: ${formatBRL(total)}`);
    return lines.join("\n");
  };

  const whatsappLink = useMemo(() => {
    const phone = String(whatsPhone || "").replace(/\D/g, "");
    const message = encodeURIComponent(buildWhatsappMessage());
    return phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
  }, [whatsPhone, selectedAro, selectedQuadro, tamanhoQuadro, selectedParts, subtotal, total, maoDeObra, desconto]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 via-white to-white">
      <MainNavbar isScrolled />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        <header className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-extrabold text-gray-900">Monte sua Bike</h1>
          <p className="mt-2 text-gray-600">
            Selecione o aro, quadro e cada etapa para montar sua bike personalizada.
          </p>
        </header>

        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {STEPS.map((step, idx) => (
              <div
                key={step.key}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  idx === stepIndex
                    ? "bg-amber-500 text-white"
                    : idx < stepIndex
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                {step.label}
              </div>
            ))}
          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-gray-500">Carregando opções...</p>
          ) : (
            <>
              {STEPS[stepIndex]?.key === "aro" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">1. Escolha o aro</h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {availableAros.map((aro) => (
                      <button
                        key={aro}
                        onClick={() => setSelectedAro(aro)}
                        className={`rounded-2xl border px-5 py-4 text-sm font-semibold transition ${
                          selectedAro === aro
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-gray-200 bg-white text-gray-700 hover:border-amber-300"
                        }`}
                      >
                        Aro {aro}
                      </button>
                    ))}
                    {!availableAros.length && (
                      <p className="text-sm text-gray-500">
                        Nenhum aro configurado. Consulte o administrador.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {STEPS[stepIndex]?.key === "quadro" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">2. Escolha o quadro</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Mostrando quadros compatíveis com o aro {selectedAro || "—"}.
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {quadrosDisponiveis.map((product) => {
                      const image = getProductImage(product);
                      const isSelected = selectedQuadro?.id === product.id;
                      return (
                        <div
                          key={product.id}
                          className={`rounded-2xl border p-4 shadow-sm transition ${
                            isSelected ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white"
                          }`}
                        >
                          {image && (
                            <img
                              src={image}
                              alt={product.name || "Quadro"}
                              className="h-40 w-full rounded-xl object-cover"
                              loading="lazy"
                            />
                          )}
                          <div className="mt-3 space-y-1">
                            <p className="text-lg font-semibold text-gray-900">
                              {product.name || "Quadro"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatBRL(product.price || 0)}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedQuadro(product);
                              setTamanhoQuadro("");
                            }}
                            className="mt-3 w-full rounded-full bg-amber-500 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                          >
                            {isSelected ? "Selecionado" : "Selecionar"}
                          </button>
                        </div>
                      );
                    })}
                    {!quadrosDisponiveis.length && (
                      <p className="text-sm text-gray-500">
                        Nenhum quadro compatível encontrado para o aro escolhido.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {STEPS[stepIndex]?.key === "tamanho" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">3. Tamanho do quadro</h2>
                  {selectedQuadro ? (
                    <>
                      {quadroTamanhos.length ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {quadroTamanhos.map((size) => (
                            <button
                              key={String(size)}
                              onClick={() => setTamanhoQuadro(String(size))}
                              className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                                tamanhoQuadro === String(size)
                                  ? "border-amber-500 bg-amber-50 text-amber-700"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-amber-300"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-gray-500">
                          Este quadro não possui tamanhos específicos. Será considerado tamanho padrão.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">
                      Selecione um quadro antes de escolher o tamanho.
                    </p>
                  )}
                </div>
              )}

              {STEP_LABELS.map(
                (label) =>
                  STEPS[stepIndex]?.key === label && (
                    <div key={label}>
                      <h2 className="text-xl font-semibold text-gray-800">{label}</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Escolha um item compatível com o aro {selectedAro || "—"}.
                      </p>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {(productsByStep[label] || []).map((product) => {
                          const image = getProductImage(product);
                          const isAccessory = label === "Acessórios";
                          const isSelected = isAccessory
                            ? selectedParts.Acessórios?.some((item) => item?.id === product.id)
                            : selectedParts[label]?.id === product.id;
                          return (
                            <div
                              key={product.id}
                              className={`rounded-2xl border p-4 shadow-sm transition ${
                                isSelected ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white"
                              }`}
                            >
                              {image && (
                                <img
                                  src={image}
                                  alt={product.name || label}
                                  className="h-36 w-full rounded-xl object-cover"
                                  loading="lazy"
                                />
                              )}
                              <div className="mt-3 space-y-1">
                                <p className="text-lg font-semibold text-gray-900">
                                  {product.name || label}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatBRL(product.price || 0)}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  if (isAccessory) {
                                    handleToggleAccessory(product);
                                  } else {
                                    setSelectedParts((prev) => ({
                                      ...prev,
                                      [label]: prev[label]?.id === product.id ? null : product,
                                    }));
                                  }
                                }}
                                className="mt-3 w-full rounded-full bg-amber-500 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                              >
                                {isSelected ? "Selecionado" : "Selecionar"}
                              </button>
                            </div>
                          );
                        })}
                        {!productsByStep[label]?.length && (
                          <p className="text-sm text-gray-500">
                            Nenhum produto compatível disponível para esta etapa.
                          </p>
                        )}
                      </div>
                    </div>
                  )
              )}

              {STEPS[stepIndex]?.key === "resumo" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800">Resumo da montagem</h2>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>
                        <strong>Aro:</strong> {selectedAro || "—"}
                      </li>
                      <li>
                        <strong>Quadro:</strong>{" "}
                        {selectedQuadro
                          ? `${selectedQuadro.name || "Sem nome"} (${formatBRL(selectedQuadro.price || 0)})`
                          : "—"}
                      </li>
                      <li>
                        <strong>Tamanho do quadro:</strong> {tamanhoQuadro || "Padrão"}
                      </li>
                      {STEP_LABELS.filter((step) => step !== "Acessórios").map((step) => (
                        <li key={step}>
                          <strong>{step}:</strong>{" "}
                          {selectedParts[step]
                            ? `${selectedParts[step].name || "Sem nome"} (${formatBRL(
                                selectedParts[step].price || 0
                              )})`
                            : "—"}
                        </li>
                      ))}
                      <li>
                        <strong>Acessórios:</strong>{" "}
                        {selectedParts.Acessórios?.length
                          ? selectedParts.Acessórios.map((item) => item.name || "Sem nome").join(", ")
                          : "—"}
                      </li>
                    </ul>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                      <p className="text-sm text-gray-500">Subtotal</p>
                      <p className="text-lg font-semibold text-gray-900">{formatBRL(subtotal)}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                      <label className="text-sm text-gray-500" htmlFor="maoDeObra">
                        Mão de obra
                      </label>
                      <input
                        id="maoDeObra"
                        value={maoDeObra}
                        onChange={(e) => setMaoDeObra(e.target.value)}
                        className="mt-2 w-full rounded-lg border px-3 py-2 text-center"
                      />
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
                      <label className="text-sm text-gray-500" htmlFor="desconto">
                        Desconto
                      </label>
                      <input
                        id="desconto"
                        value={desconto}
                        onChange={(e) => setDesconto(e.target.value)}
                        className="mt-2 w-full rounded-lg border px-3 py-2 text-center"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                    <p className="text-sm text-amber-700">Total</p>
                    <p className="text-2xl font-bold text-amber-700">{formatBRL(total)}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr,auto] md:items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Telefone WhatsApp (opcional)
                      </label>
                      <input
                        value={whatsPhone}
                        onChange={(e) => setWhatsPhone(e.target.value)}
                        placeholder="DDD + número"
                        className="mt-2 w-full rounded-lg border px-3 py-2"
                      />
                    </div>
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-green-700"
                    >
                      Enviar no WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={previousStep}
            disabled={stepIndex === 0}
            className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            onClick={advanceStep}
            disabled={!canGoNext || stepIndex === STEPS.length - 1}
            className="rounded-full bg-amber-500 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600 disabled:opacity-50"
          >
            Avançar
          </button>
        </div>
      </main>
    </div>
  );
}
