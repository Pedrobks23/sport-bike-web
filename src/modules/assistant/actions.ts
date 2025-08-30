import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import type { Ordem } from "@/types";

const COL_CLIENTES = "clientes";
const COL_ORDENS = "ordens";
const COL_SERVICOS = "servicos";
const COL_SERVICOS_LIST = "servicosList";
const COL_SERVICOS_AV = "servicosAvulsos";
const COL_MECANICOS = "mecanicos";
const COL_RECIBOS = "recibos";
const COL_PRODUCTS = "products";
const COL_FEATURED = "featuredProducts";

function parseArgs(input: string): Record<string, string> {
  const re = /(\w+):"(.*?)"|(\w+):([^\s]+)/g;
  const out: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    if (m[1]) out[m[1]] = m[2];
    else if (m[3]) out[m[3]] = m[4];
  }
  return out;
}

function normalizePhone(p: string | undefined) {
  const only = (p || "").replace(/\D/g, "");
  const last9 = only.slice(-9);
  return { full: only, last9 };
}

async function findClienteByNome(nome: string) {
  const qRef = query(collection(db, COL_CLIENTES), where("nome", "==", nome), limit(1));
  const snap = await getDocs(qRef);
  return snap.empty ? null : { id: snap.docs[0].id, data: snap.docs[0].data() as any };
}

async function findClienteByTelefone(tel: string) {
  const { full, last9 } = normalizePhone(tel);
  const qRef =
    last9.length === 9
      ? query(collection(db, COL_CLIENTES), where("telefoneSemDDD", "==", last9), limit(1))
      : query(collection(db, COL_CLIENTES), where("telefone", "==", full), limit(1));
  const snap = await getDocs(qRef);
  return snap.empty ? null : { id: snap.docs[0].id, data: snap.docs[0].data() as any };
}

async function findClienteStartsWithNome(prefix: string) {
  const end = prefix + "\uf8ff";
  const qRef = query(
    collection(db, COL_CLIENTES),
    where("nome", ">=", prefix),
    where("nome", "<=", end),
    limit(10)
  );
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as any }));
}

async function findServicoByNome(nome: string): Promise<{ src: string; doc: any } | null> {
  for (const [src, col] of [
    ["catalogo", COL_SERVICOS],
    ["list", COL_SERVICOS_LIST],
    ["avulso", COL_SERVICOS_AV],
  ] as const) {
    const qRef = query(collection(db, col), where("nome", "==", nome), limit(1));
    const snap = await getDocs(qRef);
    if (!snap.empty) return { src, doc: snap.docs[0].data() };
  }
  return null;
}

async function addServico(nome: string, valor: number, fonte: "catalogo" | "list" | "avulso") {
  const col =
    fonte === "catalogo" ? COL_SERVICOS : fonte === "list" ? COL_SERVICOS_LIST : COL_SERVICOS_AV;
  const ref = await addDoc(collection(db, col), {
    nome,
    valor,
    fonte,
    criadoEm: serverTimestamp(),
  });
  return ref.id;
}

async function buildServicosFromNames(list: string[]) {
  const itens: { nome: string; valor?: number }[] = [];
  let total = 0;
  for (const nome of list) {
    const found = await findServicoByNome(nome);
    if (found?.doc) {
      const v = Number(found.doc.valor ?? 0);
      itens.push({ nome: found.doc.nome ?? nome, valor: isNaN(v) ? undefined : v });
      if (!isNaN(v)) total += v;
    } else {
      itens.push({ nome });
    }
  }
  return { itens, total };
}

function gerarCodigoOS() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const partA = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  const partB = Math.floor(1000 + Math.random() * 9000);
  return `${partA}-${partB}`;
}

export async function handleSlashCommand(raw: string): Promise<string> {
  const [cmd, ...rest] = raw.trim().slice(1).split(" ");
  const tail = rest.join(" ").trim();

  switch (cmd.toLowerCase()) {
    case "help":
      return `Comandos:
/cliente get nome:"Fulano" | tel:"859..."
/cliente find nome:"prefixo"
/cliente add nome:"Fulano" telefone:"859..."
/cliente bikes get clienteId:"..."
/servico valor "Nome do Serviço"
/servico add nome:"..." valor:123 fonte:"catalogo|list|avulso"
/os add telefone:"859..." servicos:"rev;troca" valor:150 obs:"..."
/mecanicos list
/products destaque
/products top qtde:5
/recibo get id:"..."`;

    case "cliente": {
      const [sub, ...more] = tail.split(" ");
      const argLine = more.join(" ").trim();
      const args = parseArgs(argLine);

      if (sub === "get") {
        if (args.nome) {
          const c = await findClienteByNome(args.nome);
          if (!c) return `Cliente "${args.nome}" não encontrado.`;
          const tel = c.data.telefone ?? "sem telefone";
          return `Cliente: ${c.data.nome}\nTelefone: ${tel}\nId: ${c.id}`;
        }
        if (args.tel) {
          const c = await findClienteByTelefone(args.tel);
          if (!c) return `Telefone "${args.tel}" não encontrado.`;
          return `Cliente: ${c.data.nome}\nTelefone: ${c.data.telefone ?? "-"}\nId: ${c.id}`;
        }
        return `Uso: /cliente get nome:"Fulano" | tel:"859..."`;
      }

      if (sub === "find") {
        if (!args.nome) return `Uso: /cliente find nome:"prefixo"`;
        const list = await findClienteStartsWithNome(args.nome);
        if (!list.length) return `Nenhum cliente iniciando com "${args.nome}".`;
        return list.map((c) => `• ${c.data.nome} (${c.data.telefone ?? "-"}) [${c.id}]`).join("\n");
      }

      if (sub === "add") {
        if (!args.nome) return `Uso: /cliente add nome:"Fulano" telefone:"859..."`;
        const { full, last9 } = normalizePhone(args.telefone);
        const ref = await addDoc(collection(db, COL_CLIENTES), {
          nome: args.nome,
          telefone: full || null,
          telefoneSemDDD: full ? last9 : null,
          criadoEm: serverTimestamp(),
        });
        return `Cliente criado (id: ${ref.id}).`;
      }

      if (sub === "bikes") {
        const [sub2, ...more2] = argLine.split(" ");
        const arg2 = parseArgs(more2.join(" ").trim());
        if (sub2 === "get") {
          if (!arg2.clienteId) return `Uso: /cliente bikes get clienteId:"..."`;
          const snap = await getDocs(collection(db, `${COL_CLIENTES}/${arg2.clienteId}/bikes`));
          if (snap.empty) return `Sem bikes cadastradas para esse cliente.`;
          return snap.docs
            .map((d) => {
              const b = d.data() as any;
              return `• ${b.marca ?? ""} ${b.modelo ?? ""} aro ${b.aro ?? "?"} (${d.id})`;
            })
            .join("\n");
        }
      }

      return `Comandos de cliente:\n/cliente get ... | /cliente find ... | /cliente add ... | /cliente bikes get ...`;
    }

    case "servico": {
      const [sub, ...more] = tail.split(" ");
      const argLine = more.join(" ").trim();

      if (sub === "valor") {
        const nome = argLine.replace(/^"|"$/g, "");
        if (!nome) return `Uso: /servico valor "Nome do Serviço"`;
        const found = await findServicoByNome(nome);
        if (!found) return `Serviço "${nome}" não encontrado.`;
        const v = Number(found.doc.valor ?? 0);
        return `Valor de "${found.doc.nome ?? nome}" (fonte: ${found.src}): R$ ${isNaN(v) ? "—" : v.toFixed(2)}`;
      }

      if (sub === "add") {
        const args = parseArgs(argLine);
        if (!args.nome || !args.valor)
          return `Uso: /servico add nome:"..." valor:123 fonte:"catalogo|list|avulso"`;
        const fonte = (args.fonte as "catalogo" | "list" | "avulso") ?? "catalogo";
        const id = await addServico(args.nome, Number(args.valor), fonte);
        return `Serviço criado em ${fonte} (id: ${id}).`;
      }

      return `Comandos de serviço:\n/servico valor "Nome"\n/servico add nome:"..." valor:123 fonte:"catalogo|list|avulso"`;
    }

    case "os": {
      const [sub, ...more] = tail.split(" ");
      const argLine = more.join(" ").trim();

      if (sub === "add") {
        const args = parseArgs(argLine);
        if (!args.telefone && !args.clienteId)
          return `Informe telefone:"..." ou clienteId:"..."`;

        let clienteId = args.clienteId || null;
        let telFull: string | null = null;
        let telLast9: string | null = null;

        if (args.telefone) {
          const norm = normalizePhone(args.telefone);
          telFull = norm.full || null;
          telLast9 = norm.last9 || null;

          if (!clienteId && telFull) {
            const c = await findClienteByTelefone(telFull);
            if (c) clienteId = c.id;
          }
        }

        const nomesServicos = (args.servicos ?? "")
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean);
        const { itens, total } = await buildServicosFromNames(nomesServicos);

        const valorTotal = args.valor ? Number(args.valor) : total || undefined;
        const codigo = args.codigo || gerarCodigoOS();

        const os: Ordem = {
          status: "Pendente",
          origem: "assistente",
          criadoEm: undefined,
          valorTotal,
          observacoes: args.obs ?? args.observacoes ?? undefined,
          servicos: itens.length ? itens : undefined,
          // Campos extras do schema real:
          // @ts-ignore
          codigo,
          // @ts-ignore
          dataCriacao: serverTimestamp(),
          // @ts-ignore
          dataAtualizacao: serverTimestamp(),
          // @ts-ignore
          cliente: {
            id: clienteId || null,
            telefone: telFull || null,
            telefoneSemDDD: telLast9 || null,
          },
        };

        const ref = await addDoc(collection(db, COL_ORDENS), os as any);
        return `OS criada (id: ${ref.id}) — código: ${codigo}${valorTotal ? ` — Valor: R$ ${valorTotal.toFixed(2)}` : ""}`;
      }

      return `Comandos de OS:\n/os add telefone:"859..." servicos:"rev;troca" valor:150 obs:"..."`;
    }

    case "mecanicos": {
      const [sub] = tail.split(" ");
      if (sub === "list") {
        const snap = await getDocs(collection(db, COL_MECANICOS));
        if (snap.empty) return "Nenhum mecânico cadastrado.";
        return snap.docs
          .map((d) => {
            const m = d.data() as any;
            return `• ${m.nome ?? d.id} ${m.ativo === false ? "(inativo)" : ""}`;
          })
          .join("\n");
      }
      return `Uso: /mecanicos list`;
    }

    case "products": {
      const [sub, ...more] = tail.split(" ");
      const args = parseArgs(more.join(" ").trim());

      if (sub === "destaque") {
        const snap = await getDocs(collection(db, COL_FEATURED));
        if (snap.empty) return "Sem produtos em destaque.";
        return snap.docs
          .map((d) => {
            const p = d.data() as any;
            return `• ${p.nome ?? d.id} — R$ ${Number(p.preco ?? 0).toFixed(2)}`;
          })
          .join("\n");
      }

      if (sub === "top") {
        const qt = Math.max(1, Number(args.qtde ?? 5));
        const qRef = query(collection(db, COL_PRODUCTS), orderBy("preco", "desc"), limit(qt));
        const snap = await getDocs(qRef);
        if (snap.empty) return "Sem produtos.";
        return snap.docs
          .map((d) => {
            const p = d.data() as any;
            return `• ${p.nome ?? d.id} — R$ ${Number(p.preco ?? 0).toFixed(2)}`;
          })
          .join("\n");
      }

      return `Comandos de products:\n/products destaque\n/products top qtde:5`;
    }

    case "recibo": {
      const [sub, ...more] = tail.split(" ");
      const args = parseArgs(more.join(" ").trim());
      if (sub === "get") {
        if (!args.id) return `Uso: /recibo get id:"..."`;
        const snap = await getDoc(doc(db, COL_RECIBOS, args.id));
        if (!snap.exists()) return "Recibo não encontrado.";
        const r = snap.data() as any;
        return `Recibo: ${args.id}\nOS: ${r.ordemId ?? "-"}\nValor: R$ ${Number(r.valor ?? 0).toFixed(2)}`;
      }
      return `Uso: /recibo get id:"..."`;
    }

    default:
      return `Digite /help para ver os comandos.`;
  }
}
