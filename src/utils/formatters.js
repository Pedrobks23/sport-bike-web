// src/utils/formatters.js

// Formata telefone: (85) 99999-9999
export const formatarTelefone = (telefone) => {
  if (!telefone) return "";

  // Remove tudo que não é número
  const numeros = telefone.replace(/\D/g, "");

  // Aplica a máscara
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 6)
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  if (numeros.length <= 10)
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
};

// Formata data: DD/MM/YYYY HH:mm
export const formatarData = (timestamp) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Formata data curta: DD/MM/YYYY
export const formatarDataCurta = (timestamp) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Formata valor monetário: R$ 99,99
export const formatarDinheiro = (valor) => {
  if (valor === undefined || valor === null) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
};

// Formata número da OS: OS-YYYYMMDDX
export const formatarNumeroOS = (numero) => {
  if (!numero) return "";
  if (numero.startsWith("OS-")) return numero;
  return `OS-${numero}`;
};

// Remove caracteres especiais
export const removerEspeciais = (texto) => {
  if (!texto) return "";
  return texto.replace(/[^a-zA-Z0-9]/g, "");
};

// Formata nome: João da Silva -> João Da Silva
export const formatarNome = (nome) => {
  if (!nome) return "";
  return nome
    .toLowerCase()
    .split(" ")
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
};

// Formata status para exibição
export const formatarStatus = (status) => {
  const statusMap = {
    pendente: "Pendente",
    em_andamento: "Em Andamento",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };
  return statusMap[status] || status;
};

// Retorna as classes CSS para cada status
export const getStatusColor = (status) => {
  const statusColors = {
    pendente: "bg-yellow-100 text-yellow-800",
    em_andamento: "bg-blue-100 text-blue-800",
    concluido: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
  };
  return statusColors[status] || "bg-gray-100 text-gray-800";
};

// Limita texto com ...
export const limitarTexto = (texto, limite) => {
  if (!texto) return "";
  if (texto.length <= limite) return texto;
  return texto.slice(0, limite) + "...";
};
