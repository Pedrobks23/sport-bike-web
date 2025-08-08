import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useParams } from "react-router-dom";
import { listMechanics } from "../services/mechanicService";
import { listQuickServices } from "../services/quickServiceService";

const MechanicHistory = () => {
  const { id } = useParams();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mechanic, setMechanic] = useState(null);
  const [services, setServices] = useState([]);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    listMechanics().then((list) => {
      setMechanic(list.find((m) => m.id === id));
    });
    listQuickServices()
      .then((data) => {
        setServices(data.filter((s) => s.mecanicoId === id));
      })
      .catch(console.error);
  }, [id]);

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
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="py-2 px-2 text-left">Data</th>
                    <th className="py-2 px-2 text-left">Serviço</th>
                    <th className="py-2 px-2 text-center">Qtd</th>
                    <th className="py-2 px-2 text-right">Valor</th>
                    <th className="py-2 px-2 text-left">Obs</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="py-2 px-2">
                        {s.dataCriacao
                          ? new Date(s.dataCriacao).toLocaleDateString("pt-BR")
                          : ""}
                      </td>
                      <td className="py-2 px-2">{s.servico}</td>
                      <td className="py-2 px-2 text-center">{s.quantidade}</td>
                      <td className="py-2 px-2 text-right">
                        R$ {Number(s.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2">{s.observacoes || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MechanicHistory;
