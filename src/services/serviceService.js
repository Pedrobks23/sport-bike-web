import { useData } from "../contexts/DataContext";

export function useServiceService() {
  const { servicos } = useData();

  const getAllServicesOrdered = async () => {
    const list = servicos.map((s) => ({ id: s.id, nome: s.nome, valor: s.valor }));
    list.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return list;
  };

  return { getAllServicesOrdered };
}
