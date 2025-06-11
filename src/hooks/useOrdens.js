// src/hooks/useOrdens.js
import { useState } from "react";
import { useData } from "../contexts/DataContext";

export const useOrdens = () => {
  const { ordensDeServico } = useData();
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buscarOrdens = async (tipo, valor) => {
    setLoading(true);
    setError(null);
    try {
      let resultado = [];
      if (tipo === "historico") {
        resultado = ordensDeServico.filter((o) =>
          o.cliente?.telefone?.includes(valor)
        );
      } else if (tipo === "os") {
        resultado = ordensDeServico.filter((o) => o.codigo === valor);
      } else if (tipo === "telefone") {
        resultado = ordensDeServico.filter((o) =>
          o.cliente?.telefone?.includes(valor)
        );
      }
      setOrdens(resultado);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    ordens,
    loading,
    error,
    buscarOrdens,
  };
};
