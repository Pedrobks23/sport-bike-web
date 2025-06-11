import { useData } from "../contexts/DataContext";

export function useReceiptService() {
  const {
    receipts,
    createReceipt,
    updateReceipt,
    deleteReceipt,
    getReceipts,
    getNextReceiptNumber,
  } = useData();

  return {
    receipts,
    createReceipt,
    updateReceipt,
    deleteReceipt,
    getReceipts,
    getNextReceiptNumber,
  };
}
