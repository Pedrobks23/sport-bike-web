import {
  collection, getDocs, query, orderBy
} from "firebase/firestore";
import { db } from "../config/firebase";

// Normaliza Firestore Timestamp/string/number para Date
export function toDate(v) {
  if (!v) return null;
  if (v?.toDate) return v.toDate();               // Timestamp
  if (typeof v === "string") {
    // tenta ISO
    const d = new Date(v);
    return isNaN(d) ? null : d;
  }
  if (typeof v === "number") return new Date(v);
  return null;
}

// Helpers de período
export function startOfDay(d = new Date()) {
  const x = new Date(d); x.setHours(0,0,0,0); return x;
}
export function endOfDay(d = new Date()) {
  const x = new Date(d); x.setHours(23,59,59,999); return x;
}
export function daysAgo(n) {
  const x = new Date(); x.setDate(x.getDate() - n); return x;
}

// --------- Coleta dados brutos por período ----------
async function getOSInRange(start, end) {
  // buscamos por dataCriacao e (fallback) dataConclusao, depois filtramos em memória
  const base = collection(db, "ordens");
  const q = query(base, orderBy("dataCriacao", "desc"));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(o => {
      const d1 = toDate(o.dataCriacao) || toDate(o.dataConclusao) || toDate(o.data) || null;
      return d1 && d1 >= start && d1 <= end;
    });
}

async function getAvulsosInRange(start, end) {
  // Alguns docs têm "data" (Timestamp) e outros "dataCriacao" string/iso
  const base = collection(db, "servicosAvulsos");
  const q = query(base, orderBy("data", "desc"));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(a => {
      const d1 = toDate(a.data) || toDate(a.dataCriacao) || null;
      return d1 && d1 >= start && d1 <= end;
    });
}

async function getReceiptsInRange(start, end) {
  const base = collection(db, "recibos");
  // muitos recibos têm createdAt servidor/cliente; fazemos filtro em memória
  const q = query(base, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => {
      const d1 = toDate(r.createdAt) || toDate(r.data) || null;
      return d1 && d1 >= start && d1 <= end;
    });
}

// --------- Agregações ----------
export async function getDashboardOverview(period = "7d") {
  // period: "7d" | "30d" | "today"
  const now = new Date();
  let start;
  if (period === "today") start = startOfDay(now);
  else if (period === "30d") start = daysAgo(30);
  else start = daysAgo(7);
  const end = endOfDay(now);

  const [os, avulsos, recibos] = await Promise.all([
    getOSInRange(start, end),
    getAvulsosInRange(start, end),
    getReceiptsInRange(start, end),
  ]);

  // Status
  const statusCount = { Pendente: 0, "Em Andamento": 0, Pronto: 0, Outros: 0 };
  os.forEach(o => {
    const s = o.status || "Outros";
    statusCount[s] = (statusCount[s] || 0) + 1;
  });

  // Valores (OS: somamos serviços + peças; Avulsos: valor * quantidade; Recibos: total)
  const currency = (n) => Number(n || 0);

  function sumFromOS(order) {
    let total = 0;
    // diferentes formas usadas no projeto:
    if (Array.isArray(order.bicicletas)) {
      order.bicicletas.forEach(b => {
        // serviços
        if (Array.isArray(b.servicosInclusos)) {
          b.servicosInclusos.forEach(s => {
            const q = Number(s.quantidade || b.services?.[s.nome] || 1);
            const v = Number(s.valorFinal ?? s.valor ?? 0);
            total += q * v;
          });
        }
        if (b.serviceValues) {
          Object.entries(b.serviceValues).forEach(([, s]) => {
            total += Number(s.quantidade || 1) * Number(s.valorFinal ?? s.valor ?? 0);
          });
        }
        if (b.valorServicos) {
          Object.entries(b.valorServicos).forEach(([, v]) => total += Number(v || 0));
        }
        // peças
        (b.pecas || []).forEach(p => {
          total += Number(p.quantidade || 1) * Number(p.valor || 0);
        });
      });
    }
    return total;
  }

  const revenueOS = os.reduce((acc, o) => acc + sumFromOS(o), 0);

  const revenueAvulso = avulsos.reduce((acc, a) => {
    const qty = Number(a.quantidade || 1);
    const val = Number(a.valor || a.valorFinal || 0);
    return acc + qty * val;
  }, 0);

  const revenueReceipts = recibos.reduce((acc, r) => acc + currency(r.total || r.valor || 0), 0);

  // Preferência: faturamento real via recibos; fallback OS+Avulsos se recibo não existir
  const totalRevenue = revenueReceipts > 0 ? revenueReceipts : (revenueOS + revenueAvulso);

  // Ticket médio (base OS + avulsos)
  const totalItens = os.length + avulsos.length;
  const avgTicket = totalItens ? totalRevenue / totalItens : 0;

  // Série semanal para gráfico de tendência (últimos 7 dias)
  const trendDays = Array.from({ length: 7 }).map((_, i) => {
    const d = daysAgo(6 - i);
    const k = d.toISOString().slice(0,10);
    return { key: k, label: k.slice(5), value: 0 };
  });
  function addValueByDate(list, getVal) {
    list.forEach(item => {
      const d = toDate(item.dataCriacao || item.data || item.createdAt || item.dataConclusao);
      if (!d) return;
      const key = d.toISOString().slice(0,10);
      const t = trendDays.find(x => x.key === key);
      if (t) t.value += getVal(item);
    });
  }
  addValueByDate(os, (o) => sumFromOS(o));
  addValueByDate(avulsos, (a) => Number(a.quantidade || 1) * Number(a.valor || a.valorFinal || 0));
  if (revenueReceipts > 0) addValueByDate(recibos, (r) => Number(r.total || r.valor || 0));

  // Top serviços (contagem e valor) – olhando OS + Avulsos
  const serviceMap = new Map();
  function addService(nome, q, v) {
    const cur = serviceMap.get(nome) || { name: nome, qty: 0, total: 0 };
    cur.qty += q; cur.total += q * v; serviceMap.set(nome, cur);
  }
  os.forEach(o => {
    (o.bicicletas || []).forEach(b => {
      if (Array.isArray(b.servicosInclusos)) {
        b.servicosInclusos.forEach(s => addService(s.nome || s.servico || s.id, Number(s.quantidade || 1), Number(s.valorFinal ?? s.valor ?? 0)));
      } else if (b.serviceValues) {
        Object.entries(b.serviceValues).forEach(([nome, s]) => addService(nome, Number(s.quantidade || 1), Number(s.valorFinal ?? s.valor ?? 0)));
      } else if (b.valorServicos) {
        Object.entries(b.valorServicos).forEach(([nome, val]) => addService(nome, 1, Number(val || 0)));
      }
    });
  });
  avulsos.forEach(a => addService(a.nome || a.servico, Number(a.quantidade || 1), Number(a.valor || a.valorFinal || 0)));
  const topServices = Array.from(serviceMap.values())
    .sort((a,b) => b.total - a.total)
    .slice(0,5);

  // Ranking mecânicos (por valor)
  const mechMap = new Map();
  os.forEach(o => {
    const mid = o.mecanicoId || o.mecanico?.id || "Sem mecânico";
    const val = sumFromOS(o);
    const cur = mechMap.get(mid) || { id: mid, total: 0, qty: 0 };
    cur.total += val; cur.qty += 1; mechMap.set(mid, cur);
  });
  const topMechanics = Array.from(mechMap.values())
    .sort((a,b) => b.total - a.total)
    .slice(0,5);

  return {
    period: { start, end },
    statusCount,
    kpis: {
      orders: os.length,
      avulsos: avulsos.length,
      revenue: totalRevenue,
      avgTicket,
    },
    trend: trendDays.map(d => ({ name: d.label, value: Math.round(d.value) })),
    mix: [
      { name: "OS", value: Math.round(revenueOS) },
      { name: "Avulsos", value: Math.round(revenueAvulso) },
    ],
    topServices,
    topMechanics,
  };
}
