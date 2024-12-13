// src/hooks/useOrdens.js
import { useState } from "react";
import { consultarOS } from "../config/firebase";

export const useOrdens = () => {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buscarOrdens = async (tipo, valor) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await consultarOS(tipo, valor);
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
