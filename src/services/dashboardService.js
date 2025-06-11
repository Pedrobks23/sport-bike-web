import { useData } from "../contexts/DataContext";

export function useDashboardService() {
  const { ordensDeServico, clientes } = useData();

  const getOrdersTodayCount = async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return ordensDeServico.filter(
      (o) => new Date(o.dataCriacao) >= start
    ).length;
  };

  const getCustomersCount = async () => clientes.length;

  const getBikesInMaintenanceCount = async () => {
    return ordensDeServico.reduce((total, o) => {
      if (["Pendente", "Em Andamento"].includes(o.status)) {
        total += o.bicicletas ? o.bicicletas.length : 0;
      }
      return total;
    }, 0);
  };

  return { getOrdersTodayCount, getCustomersCount, getBikesInMaintenanceCount };
}
