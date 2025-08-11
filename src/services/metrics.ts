import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import { DonutSlice, KPI, SalesPoint, YearSummary } from "@/types/analytics";
import { startOfMonth } from "date-fns";

export function getBanner() {
  return {
    user: "Fabiana Capmany",
    text: "Best seller of the month! You have done 57.6% more sales today.",
    cta: "Go now",
  };
}

export function getFeaturedProduct() {
  return {
    title: "Pegasus Running Shoes",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop",
    badge: "NEW",
    cta: "Buy now",
  };
}

export async function getKPIs(): Promise<KPI[]> {
  const start = startOfMonth(new Date());
  const ordersQuery = query(
    collection(db, "ordens"),
    where("status", "==", "Pronto"),
    where("dataConclusao", ">=", start)
  );
  const ordersSnap = await getDocs(ordersQuery);
  let productsSold = 0;
  let totalBalance = 0;
  let bikesServed = 0;
  ordersSnap.forEach((doc) => {
    const data = doc.data() as any;
    productsSold += 1;
    totalBalance += Number(data.valorTotal || 0);
    const bikes = data.bicicletas;
    if (Array.isArray(bikes)) bikesServed += bikes.length;
  });

  const customersSnap = await getDocs(collection(db, "clientes"));
  const customers = customersSnap.size;

  return [
    { label: "Product sold", value: productsSold },
    { label: "Total balance", value: totalBalance },
    { label: "Bikes serviced", value: bikesServed },
    { label: "Customers", value: customers },
  ];
}

export function getSalesLine(): SalesPoint[] {
  return [
    { name: "Mon", value: 400 },
    { name: "Tue", value: 520 },
    { name: "Wed", value: 300 },
    { name: "Thu", value: 680 },
    { name: "Fri", value: 900 },
    { name: "Sat", value: 750 },
    { name: "Sun", value: 600 },
  ];
}

export function getDonutByGender(): DonutSlice[] {
  return [
    { name: "Male", value: 58 },
    { name: "Female", value: 38 },
    { name: "Other", value: 4 },
  ];
}

export function getYearSummary(): YearSummary {
  const series = [
    { name: "Jan", income: 11000, expenses: 3200 },
    { name: "Feb", income: 9000, expenses: 4100 },
    { name: "Mar", income: 16000, expenses: 5200 },
    { name: "Apr", income: 13000, expenses: 4800 },
    { name: "May", income: 17000, expenses: 6100 },
    { name: "Jun", income: 15000, expenses: 5900 },
  ];
  return {
    income: 16100,
    expenses: 35710,
    series,
  };
}
