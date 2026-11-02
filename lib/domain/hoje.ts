// Regras puras do Hoje (8.4): saudação e frase-resumo.

export function saudacao(hora: number) {
  if (hora >= 5 && hora < 12) return "Bom dia"
  if (hora >= 12 && hora < 18) return "Boa tarde"
  return "Boa noite"
}

export type ResumoHoje = {
  tarefas: number
  atrasadas: number
  habitosRestantes: number
  proximaRotina: { titulo: string; horario: string } | null
  cartoesAbertos: number
  // Quadro onde os cartões estão, quando é um só.
  quadroDosCartoes: string | null
}

const plural = (n: number, um: string, varios: string, feminino = false) => `${n === 1 ? (feminino ? "uma" : "um") : n} ${n === 1 ? um : varios}`
const maiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

// "Nada marcado para o resto de hoje. Um cartão segue em aberto na Equipe Delta."
export function fraseResumo({ tarefas, atrasadas, habitosRestantes, proximaRotina, cartoesAbertos, quadroDosCartoes }: ResumoHoje) {
  const frases: string[] = []
  const partes: string[] = []
  if (tarefas > 0) partes.push(plural(tarefas, "tarefa", "tarefas", true))
  if (habitosRestantes > 0) partes.push(plural(habitosRestantes, "hábito", "hábitos"))
  if (partes.length) frases.push(`${maiuscula(partes.join(" e "))} para hoje${atrasadas > 0 ? `, ${atrasadas === 1 ? "uma atrasada" : `${atrasadas} atrasadas`}` : ""}.`)
  if (proximaRotina) frases.push(`Próximo na rotina: ${proximaRotina.titulo}, às ${proximaRotina.horario}.`)
  if (frases.length === 0) frases.push("Nada marcado para o resto de hoje.")
  if (cartoesAbertos > 0) {
    const onde = quadroDosCartoes ? ` em ${quadroDosCartoes}` : ""
    frases.push(cartoesAbertos === 1 ? `Um cartão segue em aberto${onde}.` : `${cartoesAbertos} cartões seguem em aberto${onde}.`)
  }
  return frases.join(" ")
}
