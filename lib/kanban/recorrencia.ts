// Rafael Marques - 26/10/2026
// Cartões que se repetem: ao concluir, nasce o próximo com o prazo seguinte. Sem dependências
// (roda em Node: veja recorrencia.teste.ts).

export type FrequenciaRecorrencia = "diaria" | "semanal" | "mensal" | "anual"
export type RecorrenciaCartao = { frequencia: FrequenciaRecorrencia; intervalo: number }

export const nomesFrequencia: Record<FrequenciaRecorrencia, { um: string; varios: string }> = {
  diaria: { um: "dia", varios: "dias" },
  semanal: { um: "semana", varios: "semanas" },
  mensal: { um: "mês", varios: "meses" },
  anual: { um: "ano", varios: "anos" },
}

export function descreverRecorrencia(recorrencia: RecorrenciaCartao) {
  if (recorrencia.intervalo <= 1) return { diaria: "Todo dia", semanal: "Toda semana", mensal: "Todo mês", anual: "Todo ano" }[recorrencia.frequencia]
  return `A cada ${recorrencia.intervalo} ${nomesFrequencia[recorrencia.frequencia].varios}`
}

const doisDigitos = (valor: number) => String(valor).padStart(2, "0")

// "AAAA-MM-DD" + recorrência → próximo prazo. Meses curtos: 31/01 + 1 mês = 28 ou 29/02 (fim do mês).
export function proximoPrazo(prazo: string, recorrencia: RecorrenciaCartao): string {
  const [ano, mes, dia] = prazo.split("-").map(Number)
  const passo = Math.max(1, Math.round(recorrencia.intervalo))
  if (recorrencia.frequencia === "diaria" || recorrencia.frequencia === "semanal") {
    const dias = recorrencia.frequencia === "semanal" ? passo * 7 : passo
    const data = new Date(Date.UTC(ano, mes - 1, dia + dias))
    return `${data.getUTCFullYear()}-${doisDigitos(data.getUTCMonth() + 1)}-${doisDigitos(data.getUTCDate())}`
  }
  const mesesSomados = recorrencia.frequencia === "anual" ? passo * 12 : passo
  const total = ano * 12 + (mes - 1) + mesesSomados
  const novoAno = Math.floor(total / 12)
  const novoMes = total % 12
  const ultimoDia = new Date(Date.UTC(novoAno, novoMes + 1, 0)).getUTCDate()
  return `${novoAno}-${doisDigitos(novoMes + 1)}-${doisDigitos(Math.min(dia, ultimoDia))}`
}

// Próximo prazo de um cartão concluído: segue a série e nunca cai no passado. Sem prazo, conta a partir de hoje.
export function prazoDaProxima(prazoAtual: string | null, recorrencia: RecorrenciaCartao, hoje: string) {
  let prazo = prazoAtual ?? hoje
  for (let volta = 0; volta < 400; volta++) {
    prazo = proximoPrazo(prazo, recorrencia)
    if (prazo >= hoje) break
  }
  return prazo
}
