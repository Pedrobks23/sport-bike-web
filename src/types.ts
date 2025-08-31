export type ChatMessage = {
  id?: string;
  role: "user" | "assistant" | "system";
  text: string;
  createTime?: any;
  status?: string;
  error?: string;
};

export type Cliente = {
  nome: string;
  telefone?: string;
  telefoneSemDDD?: string;
  criadoEm?: any;
};

export type Servico = {
  nome: string;
  valor?: number;
  fonte?: "catalogo" | "list" | "avulso";
};

export type Ordem = {
  clienteId?: string | null;
  telefone?: string | null;
  servicos?: { nome: string; valor?: number }[];
  valorTotal?: number;
  observacoes?: string;
  status?: "aberta" | "em_andamento" | "concluida" | "Pendente";
  origem?: "assistente";
  criadoEm?: any; // não usado diretamente no seu schema atual
};
