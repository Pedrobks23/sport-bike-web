// Normaliza números de telefone removendo caracteres não numéricos
export function normalizePhone(phone = "") {
  return String(phone).replace(/\D/g, "");
}
