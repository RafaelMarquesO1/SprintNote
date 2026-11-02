"use client"

import { useSyncExternalStore } from "react"

// Hora atual, atualizada a cada "intervalo" ms (alinhada à virada do minuto quando o intervalo é ≥ 1 min).
// No servidor e antes de hidratar devolve null (evita diferença de hidratação).
const relogios = new Map<number, { valor: number; ouvintes: Set<() => void>; parar?: () => void }>()

function relogio(intervalo: number) {
  let atual = relogios.get(intervalo)
  if (!atual) {
    atual = { valor: arredondar(Date.now(), intervalo), ouvintes: new Set() }
    relogios.set(intervalo, atual)
  }
  return atual
}

function arredondar(agora: number, intervalo: number) {
  return intervalo >= 60_000 ? agora - (agora % 60_000) : agora
}

function assinar(intervalo: number, ouvinte: () => void) {
  const estado = relogio(intervalo)
  estado.ouvintes.add(ouvinte)
  if (!estado.parar) {
    const tique = () => {
      estado.valor = arredondar(Date.now(), intervalo)
      estado.ouvintes.forEach((avisar) => avisar())
    }
    let repeticao: ReturnType<typeof setInterval> | undefined
    const atraso = intervalo >= 60_000 ? 60_000 - (Date.now() % 60_000) : intervalo
    const primeiro = setTimeout(() => {
      tique()
      repeticao = setInterval(tique, intervalo)
    }, atraso)
    estado.valor = arredondar(Date.now(), intervalo)
    estado.parar = () => {
      clearTimeout(primeiro)
      clearInterval(repeticao)
    }
  }
  return () => {
    estado.ouvintes.delete(ouvinte)
    if (estado.ouvintes.size === 0) {
      estado.parar?.()
      estado.parar = undefined
    }
  }
}

export function useNow(intervalo = 60_000): Date | null {
  const valor = useSyncExternalStore(
    (ouvinte) => assinar(intervalo, ouvinte),
    () => relogio(intervalo).valor,
    () => null
  )
  return valor === null ? null : new Date(valor)
}
