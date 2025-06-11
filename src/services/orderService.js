import { useData } from "../contexts/DataContext";

export function useOrderService() {
  const {
    getOrders,
    getOrder,
    updateOrderStatus,
    addServiceToBike,
    addPartToBike,
    addObservation,
    removeOrder,
    updateOrderService,
    removeOrderService,
    removeOrderPart,
    updateOrderPart,
    getServices,
    getLatestCompletedOrderByPhone,
  } = useData();

  return {
    getOrders,
    getOrder,
    updateOrderStatus,
    addServiceToBike,
    addPartToBike,
    addObservation,
    removeOrder,
    updateOrderService,
    removeOrderService,
    removeOrderPart,
    updateOrderPart,
    getServices,
    getLatestCompletedOrderByPhone,
  };
}
