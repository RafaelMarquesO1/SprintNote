// Regras puras dos hábitos: sequência, percentual e resumos de dias.

import { diaDaSemana, nomesDias, somarDias } from "@/lib/datas"
import type { Habito } from "@/lib/tipos"

export function valeNoDia(habito: Habito, data: string) {
  return habito.dias.includes(diaDaSemana(data))
}

// Sequência atual: dias programados seguidos em que o hábito foi feito.
// Hoje só quebra a sequência depois que o dia acaba.
export function calcularSequencia(habito: Habito, hoje: string) {
  let sequencia = 0
  let data = hoje
  for (let passo = 0; passo < 366; passo++) {
    if (valeNoDia(habito, data)) {
      if (habito.feitos.includes(data)) sequencia++
      else if (data !== hoje) break
    }
    data = somarDias(data, -1)
  }
  return sequencia
}

// Percentual de dias programados feitos nos últimos "dias" (até hoje, inclusive).
export function percentualRecente(habito: Habito, hoje: string, dias = 30) {
  let programados = 0
  let feitos = 0
  for (let passo = 0; passo < dias; passo++) {
    const data = somarDias(hoje, -passo)
    if (!valeNoDia(habito, data)) continue
    programados++
    if (habito.feitos.includes(data)) feitos++
  }
  return programados ? Math.round((feitos / programados) * 100) : 0
}

// "Seg, Qua e Sex", "Todos os dias", "Dias úteis".
export function resumoDias(dias: number[]) {
  const ordenados = [...new Set(dias)].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
  if (ordenados.length === 7) return "Todos os dias"
  if (ordenados.length === 5 && [1, 2, 3, 4, 5].every((dia) => ordenados.includes(dia))) return "Dias úteis"
  if (ordenados.length === 2 && ordenados.includes(0) && ordenados.includes(6)) return "Fins de semana"
  const nomes = ordenados.map((dia) => nomesDias[dia])
  if (nomes.length <= 1) return nomes[0] ?? "Nenhum dia"
  return `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}`
}

// Maior sequência já feita (dias programados seguidos).
export function maiorSequencia(habito: Habito, hoje: string, limiteDias = 366) {
  let maior = 0
  let atual = 0
  for (let passo = limiteDias - 1; passo >= 0; passo--) {
    const data = somarDias(hoje, -passo)
    if (!valeNoDia(habito, data)) continue
    if (habito.feitos.includes(data)) {
      atual++
      maior = Math.max(maior, atual)
    } else if (data !== hoje) atual = 0
  }
  return maior
}

// Os 7 dias (Seg…Dom) da semana que contém "data".
export function semanaDe(data: string) {
  const segunda = somarDias(data, -((diaDaSemana(data) + 6) % 7))
  return Array.from({ length: 7 }, (_, indice) => somarDias(segunda, indice))
}
