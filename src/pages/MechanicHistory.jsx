import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { listMechanics } from "../services/mechanicService";
import { listQuickServices } from "../services/quickServiceService";
import GenericDataTable from "../components/GenericDataTable";
import { db } from "../config/firebase";

const MechanicHistory = () => {
  const { id } = useParams();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mechanic, setMechanic] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [originFilter, setOriginFilter] = useState("all");

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    const loadData = async () => {
      try {
        const mechList = await listMechanics();
        setMechanic(mechList.find((m) => m.id === id));

        const quicks = await listQuickServices();
        const quickServices = quicks
          .filter((s) => s.mecanicoId === id)
          .map((s) => ({
            id: s.id,
            data: s.dataCriacao ? new Date(s.dataCriacao) : new Date(),
            os: "",
            servico: s.servico,
            quantidade: parseInt(s.quantidade) || 1,
            valor: (parseFloat(s.valor) || 0) * (parseInt(s.quantidade) || 1),
            observacoes: s.observacoes || "",
            origem: "Avulso",
          }));

        const ordensRef = collection(db, "ordens");
        const ordersQuery = query(
          ordensRef,
          where("mecanicoId", "==", id),
          orderBy("dataCriacao", "desc")
        );
        const ordersSnap = await getDocs(ordersQuery);
        const orderServices = [];
        ordersSnap.forEach((doc) => {
          const data = doc.data();
          if (data.status !== "Pronto") return;
          const orderDate = data.dataAtualizacao
            ? data.dataAtualizacao.toDate()
            : data.dataCriacao.toDate();
          if (data.bicicletas?.length > 0) {
            data.bicicletas.forEach((bike) => {
              if (bike.valorServicos) {
                Object.entries(bike.valorServicos).forEach(([serviceName, valor]) => {
                  const quantidade = bike.services?.[serviceName] || 1;
                  orderServices.push({
                    id: `${doc.id}-${serviceName}`,
                    data: orderDate,
                    os: data.codigo || doc.id,
                    servico: serviceName,
                    quantidade,
                    valor: parseFloat(valor) * quantidade,
                    observacoes: bike.observacoes || "",
                    origem: "OS",
                  });
                });
              }
            });
          }
        });

        setServices([...quickServices, ...orderServices]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const monthlyCounts = services.reduce((acc, s) => {
    const key = s.data.toLocaleString("pt-BR", { month: "long", year: "numeric" });
    acc[key] = (acc[key] || 0) + s.quantidade;
    return acc;
  }, {});

  const filteredServices = services.filter((s) => {
    if (originFilter !== "all" && s.origem !== originFilter) return false;
    if (dateRange.start) {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      if (s.data < start) return false;
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      if (s.data > end) return false;
    }
    return true;
  });

  const tableData = filteredServices.map((s) => ({
    data: s.data.toLocaleDateString("pt-BR"),
    os: s.os,
    servico: s.servico,
    quantidade: s.quantidade,
    valor: `R$ ${Number(s.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    origem: s.origem,
    observacoes: s.observacoes,
  }));

  const columns = [
    { name: "data", label: "Data" },
    { name: "os", label: "OS" },
    { name: "servico", label: "Serviço" },
    { name: "quantidade", label: "Qtd" },
    { name: "valor", label: "Valor" },
    { name: "origem", label: "Origem", options: { filter: true } },
    { name: "observacoes", label: "Obs" },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <header className="bg-white dark:bg-gray-800 p-4 flex items-center space-x-4">
          <button onClick={() => window.history.back()} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {mechanic ? mechanic.nome : "Mecânico"}
          </h1>
        </header>
        <main className="p-4">
          {services.length === 0 ? (
            <p className="text-gray-700 dark:text-gray-300">Nenhum serviço registrado.</p>
          ) : (
            <div>
              <div className="mb-4 space-y-1">
                {Object.entries(monthlyCounts).map(([month, count]) => (
                  <p key={month} className="text-gray-700 dark:text-gray-300">
                    {month}: {count}
                  </p>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 mb-4">
                <div>
                  <label className="block text-sm mb-1">Data início</label>
                  <input
                    type="date"
                    className="border rounded px-2 py-1"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Data fim</label>
                  <input
                    type="date"
                    className="border rounded px-2 py-1"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Origem</label>
                  <select
                    className="border rounded px-2 py-1"
                    value={originFilter}
                    onChange={(e) => setOriginFilter(e.target.value)}
                  >
                    <option value="all">Todas</option>
                    <option value="OS">OS</option>
                    <option value="Avulso">Avulso</option>
                  </select>
                </div>
              </div>

              <GenericDataTable
                title="Histórico de Serviços"
                columns={columns}
                data={tableData}
                loading={loading}
                options={{ filter: true, search: true }}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MechanicHistory;
