// Rafael Marques - 20/10/2026
// Datas no formato "AAAA-MM-DD" (sempre no fuso local do navegador).

export const nomesDias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
export const nomesDiasCompletos = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

export function chaveData(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

export function chaveHoje() {
  return chaveData(new Date())
}

export function lerChave(chave: string) {
  const [ano, mes, dia] = chave.split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

export function somarDias(chave: string, dias: number) {
  const data = lerChave(chave)
  data.setDate(data.getDate() + dias)
  return chaveData(data)
}

export function diaDaSemana(chave: string) {
  return lerChave(chave).getDay()
}

// Últimos "quantidade" dias terminando em "fim" (do mais antigo ao mais novo).
export function ultimosDias(fim: string, quantidade: number) {
  return Array.from({ length: quantidade }, (_, indice) => somarDias(fim, indice - quantidade + 1))
}

// "Hoje", "Amanhã", "Ontem" ou "seg., 20 out."
export function formatarDataRelativa(chave: string) {
  const hoje = chaveHoje()
  if (chave === hoje) return "Hoje"
  if (chave === somarDias(hoje, 1)) return "Amanhã"
  if (chave === somarDias(hoje, -1)) return "Ontem"
  return lerChave(chave).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })
}
