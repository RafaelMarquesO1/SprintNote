// Gera um id curto e único o bastante para dados locais.
export function gerarId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}
