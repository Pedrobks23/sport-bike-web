import React, { createContext, useContext, useState } from "react";

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const [clientes, setClientes] = useState([
    {
      id: "1",
      nome: "Jo\u00e3o Silva",
      telefone: "11999999999",
      email: "joao@example.com",
      endereco: "Rua A",
      bikes: [
        { id: "b1", marca: "Caloi", modelo: "Elite", cor: "Vermelha" },
      ],
    },
    {
      id: "2",
      nome: "Maria Souza",
      telefone: "11888888888",
      email: "maria@example.com",
      endereco: "Rua B",
      bikes: [
        { id: "b2", marca: "Trek", modelo: "Marlin", cor: "Azul" },
      ],
    },
  ]);

  const [servicos, setServicos] = useState([
    { id: "s1", nome: "Revis\u00e3o B\u00e1sica", valor: 50 },
    { id: "s2", nome: "Lavagem", valor: 30 },
  ]);

  const [ordensDeServico, setOrdensDeServico] = useState([
    {
      id: "o1",
      codigo: "001",
      clienteId: "1",
      cliente: { nome: "Jo\u00e3o Silva", telefone: "11999999999" },
      status: "Pendente",
      bicicletas: [
        {
          marca: "Caloi",
          modelo: "Elite",
          cor: "Vermelha",
          services: { "Revis\u00e3o B\u00e1sica": 1 },
          serviceValues: { "Revis\u00e3o B\u00e1sica": { valor: 50, valorFinal: 50 } },
          pecas: [],
        },
      ],
      valorTotal: 50,
      observacoes: "",
      dataCriacao: new Date().toISOString(),
    },
    {
      id: "o2",
      codigo: "002",
      clienteId: "2",
      cliente: { nome: "Maria Souza", telefone: "11888888888" },
      status: "Pronto",
      bicicletas: [],
      valorTotal: 0,
      observacoes: "",
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    },
  ]);

  const [receipts, setReceipts] = useState([]);

  // --- Clientes CRUD ---
  const addCliente = async (cliente) => {
    setClientes((prev) => [...prev, cliente]);
  };

  const updateCliente = async (id, updates) => {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCliente = async (id) => {
    setClientes((prev) => prev.filter((c) => c.id !== id));
  };

  // --- Bikes ---
  const addBikeToCliente = async (clienteId, bike) => {
    setClientes((prev) =>
      prev.map((c) =>
        c.id === clienteId ? { ...c, bikes: [...(c.bikes || []), bike] } : c
      )
    );
  };

  const updateBike = async (clienteId, bikeId, updates) => {
    setClientes((prev) =>
      prev.map((c) => {
        if (c.id === clienteId) {
          const bikes = (c.bikes || []).map((b) =>
            b.id === bikeId ? { ...b, ...updates } : b
          );
          return { ...c, bikes };
        }
        return c;
      })
    );
  };

  const deleteBike = async (clienteId, bikeId) => {
    setClientes((prev) =>
      prev.map((c) =>
        c.id === clienteId
          ? { ...c, bikes: (c.bikes || []).filter((b) => b.id !== bikeId) }
          : c
      )
    );
  };

  // --- Servi\u00e7os ---
  const addServico = async (servico) => {
    setServicos((prev) => [...prev, servico]);
  };

  const updateServico = async (id, updates) => {
    setServicos((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteServico = async (id) => {
    setServicos((prev) => prev.filter((s) => s.id !== id));
  };

  // --- Ordens de Servi\u00e7o ---
  const addOrdem = async (ordem) => {
    setOrdensDeServico((prev) => [...prev, ordem]);
  };

  const updateOrdem = async (id, updates) => {
    setOrdensDeServico((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  };

  const deleteOrdem = async (id) => {
    setOrdensDeServico((prev) => prev.filter((o) => o.id !== id));
  };

  const getOrders = async () => {
    const result = { pending: [], inProgress: [], done: [] };
    ordensDeServico.forEach((o) => {
      if (o.status === "Pendente") result.pending.push(o);
      else if (o.status === "Em Andamento") result.inProgress.push(o);
      else result.done.push(o);
    });
    return result;
  };

  const getOrder = async (id) => ordensDeServico.find((o) => o.id === id) || null;

  const updateOrderStatus = async (id, status) => {
    updateOrdem(id, { status });
  };

  const addServiceToBike = async (orderId, bikeIndex, service) => {
    setOrdensDeServico((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const bikes = [...o.bicicletas];
        const bike = { ...bikes[bikeIndex] };
        bike.services = bike.services || {};
        bike.serviceValues = bike.serviceValues || {};
        bike.services[service.nome] = parseInt(service.quantidade || 1, 10);
        bike.serviceValues[service.nome] = {
          valor: parseFloat(service.valor || 0),
          valorFinal: parseFloat(service.valorFinal ?? service.valor ?? 0),
          valorPadrao: service.valorPadrao,
          desconto: service.desconto,
          custom: service.custom,
        };
        bikes[bikeIndex] = bike;
        return { ...o, bicicletas: bikes };
      })
    );
  };

  const addPartToBike = async (orderId, bikeIndex, part) => {
    setOrdensDeServico((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const bikes = [...o.bicicletas];
        const bike = { ...bikes[bikeIndex] };
        bike.pecas = bike.pecas || [];
        bike.pecas.push(part);
        bikes[bikeIndex] = bike;
        return { ...o, bicicletas: bikes };
      })
    );
  };

  const removeOrderService = async (orderId, bikeIndex, serviceName) => {
    setOrdensDeServico((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const bikes = [...o.bicicletas];
        const bike = { ...bikes[bikeIndex] };
        if (bike.services) delete bike.services[serviceName];
        if (bike.serviceValues) delete bike.serviceValues[serviceName];
        bikes[bikeIndex] = bike;
        return { ...o, bicicletas: bikes };
      })
    );
  };

  const updateOrderService = async (orderId, bikeIndex, oldName, updatedService) => {
    await removeOrderService(orderId, bikeIndex, oldName);
    await addServiceToBike(orderId, bikeIndex, updatedService);
  };

  const removeOrderPart = async (orderId, bikeIndex, partIndex) => {
    setOrdensDeServico((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const bikes = [...o.bicicletas];
        const bike = { ...bikes[bikeIndex] };
        bike.pecas = (bike.pecas || []).filter((_, i) => i !== partIndex);
        bikes[bikeIndex] = bike;
        return { ...o, bicicletas: bikes };
      })
    );
  };

  const updateOrderPart = async (orderId, bikeIndex, partIndex, updatedPart) => {
    setOrdensDeServico((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const bikes = [...o.bicicletas];
        const bike = { ...bikes[bikeIndex] };
        bike.pecas = bike.pecas || [];
        bike.pecas[partIndex] = { ...bike.pecas[partIndex], ...updatedPart };
        bikes[bikeIndex] = bike;
        return { ...o, bicicletas: bikes };
      })
    );
  };

  const addObservation = async (orderId, observation) => {
    updateOrdem(orderId, { observacoes: observation });
  };

  const getServices = async () => {
    const map = {};
    servicos.forEach((s) => {
      map[s.nome] = parseFloat(s.valor);
    });
    return map;
  };

  const getLatestCompletedOrderByPhone = async (phone) => {
    const completed = ordensDeServico
      .filter((o) => o.cliente.telefone === phone && o.status === "Pronto")
      .sort((a, b) => new Date(b.dataAtualizacao || b.dataCriacao) - new Date(a.dataAtualizacao || a.dataCriacao));
    return completed[0] || null;
  };

  // --- Recibos ---
  const createReceipt = async (receipt) => {
    setReceipts((prev) => [...prev, { id: Date.now().toString(), ...receipt }]);
  };

  const updateReceipt = async (id, updates) => {
    setReceipts((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteReceipt = async (id) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  const getReceipts = async () => receipts;

  const getNextReceiptNumber = async () => {
    const year = new Date().getFullYear();
    const last = receipts
      .filter((r) => r.numero && r.numero.endsWith(`-${year}`))
      .sort((a, b) => b.numero.localeCompare(a.numero))[0];
    const seq = (parseInt(last?.numero?.split("-")[0] || 0, 10) + 1)
      .toString()
      .padStart(3, "0");
    return `${seq}-${year}`;
  };

  const value = {
    clientes,
    servicos,
    ordensDeServico,
    receipts,
    addCliente,
    updateCliente,
    deleteCliente,
    addBikeToCliente,
    updateBike,
    deleteBike,
    addServico,
    updateServico,
    deleteServico,
    addOrdem,
    updateOrdem,
    deleteOrdem,
    getOrders,
    getOrder,
    updateOrderStatus,
    addServiceToBike,
    addPartToBike,
    removeOrderService,
    updateOrderService,
    removeOrderPart,
    updateOrderPart,
    addObservation,
    getServices,
    getLatestCompletedOrderByPhone,
    createReceipt,
    updateReceipt,
    deleteReceipt,
    getReceipts,
    getNextReceiptNumber,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
