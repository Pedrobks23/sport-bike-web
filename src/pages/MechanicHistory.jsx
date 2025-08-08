import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useParams } from "react-router-dom";
import { listMechanics } from "../services/mechanicService";

const MechanicHistory = () => {
  const { id } = useParams();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mechanic, setMechanic] = useState(null);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    listMechanics().then((list) => {
      setMechanic(list.find((m) => m.id === id));
    });
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
          <p className="text-gray-700 dark:text-gray-300">Histórico não implementado.</p>
        </main>
      </div>
    </div>
  );
};

export default MechanicHistory;
