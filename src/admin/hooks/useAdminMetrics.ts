import { useEffect, useState } from "react";
import {
  Timestamp,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { eachDayOfInterval, endOfDay, endOfMonth, format, startOfDay, startOfMonth } from "date-fns";
import { db } from "@/config/firebase";

type AdminMetrics = {
  todayOrders: number;
  totalClients: number;
  inMaintenance: number;
  overdue: number;
  monthRevenue: number;
  monthTickets: number;
  avgTicket: number;
  series: Array<{ date: string; value: number }>;
  recentOrders: Array<{
    id: string;
    osName: string;
    cliente: string;
    bike?: string;
    status: string;
    total?: number;
    updatedAt: Date;
  }>;
};

const emptyMetrics: AdminMetrics = {
  todayOrders: 0,
  totalClients: 0,
  inMaintenance: 0,
  overdue: 0,
  monthRevenue: 0,
  monthTickets: 0,
  avgTicket: 0,
  series: [],
  recentOrders: [],
};

const toDateValue = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const getOrderRelevantDate = (order: Record<string, unknown>) =>
  toDateValue(order.dataConclusao || order.dataAtualizacao || order.dataCriacao || order.createdAt);

export function useAdminMetrics() {
  const [metrics, setMetrics] = useState<AdminMetrics>(emptyMetrics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const [ordersSnapshot, clientsSnapshot] = await Promise.all([
          getDocs(query(collection(db, "ordens"), orderBy("dataCriacao", "desc"))),
          getDocs(collection(db, "clientes")),
        ]);

        const orders = ordersSnapshot.docs.map((doc) => {
          const data = doc.data() as Record<string, unknown>;
          const createdAt = toDateValue(data.dataCriacao || data.createdAt) || new Date();
          const updatedAt =
            toDateValue(data.dataAtualizacao || data.updatedAt || data.dataConclusao) || createdAt;

          return {
            id: doc.id,
            ...data,
            createdAt,
            updatedAt,
            valorTotal: toNumber((data as Record<string, unknown>).valorTotal || (data as Record<string, unknown>).total),
          } as Record<string, unknown> & { id: string; createdAt: Date; updatedAt: Date; valorTotal: number };
        });

        const todayOrders = orders.filter((order) => {
          const createdAt = order.createdAt;
          return createdAt >= todayStart && createdAt <= todayEnd;
        }).length;

        const inMaintenance = orders.filter((order) =>
          ["Pendente", "Em Andamento"].includes(String(order.status)),
        ).length;

        const overdue = orders.filter((order) => {
          const dueDate = toDateValue(
            (order as Record<string, unknown>).dueDate ||
              (order as Record<string, unknown>).prazo ||
              (order as Record<string, unknown>).dataPrazo,
          );
          if (!dueDate) return false;
          return String(order.status) !== "Pronto" && dueDate < now;
        }).length;

        const doneOrdersInMonth = orders.filter((order) => {
          const refDate = getOrderRelevantDate(order) || order.createdAt;
          return (
            String(order.status) === "Pronto" && refDate >= monthStart && refDate <= monthEnd
          );
        });

        const monthTickets = doneOrdersInMonth.length;
        const revenueFromOrders = doneOrdersInMonth.reduce((sum, order) => sum + (order.valorTotal || 0), 0);

        let monthRevenue = revenueFromOrders;
        let seriesSource: Array<{ value: number; date: Date }> = doneOrdersInMonth.map((order) => ({
          value: order.valorTotal || 0,
          date: getOrderRelevantDate(order) || order.createdAt,
        }));

        try {
          const receiptsQuery = query(
            collection(db, "recibos"),
            where("createdAt", ">=", Timestamp.fromDate(monthStart)),
            where("createdAt", "<=", Timestamp.fromDate(monthEnd)),
            orderBy("createdAt", "asc"),
          );
          const receiptsSnapshot = await getDocs(receiptsQuery);
          const receipts = receiptsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              createdAt: toDateValue(data.createdAt) || new Date(),
              valor: toNumber(data.valor),
            };
          });

          if (receipts.length > 0) {
            monthRevenue = receipts.reduce((sum, item) => sum + item.valor, 0);
            seriesSource = receipts.map((item) => ({ value: item.valor, date: item.createdAt }));
          }
        } catch (err) {
          console.warn("Receipts metrics fallback:", err);
        }

        const dayRange = eachDayOfInterval({ start: monthStart, end: now });
        const dayMap = new Map<string, number>();
        dayRange.forEach((day) => dayMap.set(format(day, "dd/MM"), 0));

        seriesSource.forEach((entry) => {
          const label = format(entry.date, "dd/MM");
          dayMap.set(label, (dayMap.get(label) || 0) + entry.value);
        });

        const series = Array.from(dayMap.entries()).map(([date, value]) => ({ date, value }));

        const recentOrders = orders
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, 10)
          .map((order) => {
            const bike = Array.isArray((order as Record<string, unknown>).bicicletas)
              ? String(((order as Record<string, unknown>).bicicletas as Array<Record<string, unknown>>)[0]?.modelo ||
                  ((order as Record<string, unknown>).bicicletas as Array<Record<string, unknown>>)[0]?.marca ||
                  ((order as Record<string, unknown>).bicicletas as Array<Record<string, unknown>>)[0]?.nome ||
                  "")
              : (order as Record<string, unknown>).bike?.model as string;

            return {
              id: order.id,
              osName:
                String(
                  (order as Record<string, unknown>).codigo ||
                    (order as Record<string, unknown>).nome ||
                    (order as Record<string, unknown>).titulo ||
                    order.id,
                ) || order.id,
              cliente: (order as Record<string, unknown>).cliente?.nome as string || "Cliente",
              bike: bike || undefined,
              status: String(order.status || "Pendente"),
              total: order.valorTotal,
              updatedAt: order.updatedAt,
            };
          });

        const avgTicket = monthTickets > 0 ? monthRevenue / monthTickets : 0;

        if (isMounted) {
          setMetrics({
            todayOrders,
            totalClients: clientsSnapshot.size,
            inMaintenance,
            overdue,
            monthRevenue,
            monthTickets,
            avgTicket,
            series,
            recentOrders,
          });
        }
      } catch (err) {
        console.error("Erro ao carregar métricas do admin:", err);
        if (isMounted) {
          setMetrics(emptyMetrics);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  return { metrics, loading };
}
