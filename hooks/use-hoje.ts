import { useSyncExternalStore } from "react"

import { chaveHoje } from "@/lib/datas"
import { horarioAtual } from "@/lib/estado/rotina"

// Avisa a cada 30s para a tela acompanhar a virada do dia / do horário.
function inscrever(aoMudar: () => void) {
  const intervalo = window.setInterval(aoMudar, 30_000)
  return () => window.clearInterval(intervalo)
}

// Data de hoje (AAAA-MM-DD). Vazia no servidor: a data certa é a do navegador.
export function useHoje() {
  return useSyncExternalStore(inscrever, chaveHoje, () => "")
}

// Horário atual "HH:MM". Vazio no servidor.
export function useHorario() {
  return useSyncExternalStore(inscrever, horarioAtual, () => "")
}

// Minuto atual (em ms, arredondado): base para "há 5 min", "ontem"...
// Vale 0 no servidor; atualiza a cada 30s no navegador.
export function useAgora() {
  return useSyncExternalStore(
    inscrever,
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => 0
  )
}

export function tempoRelativo(momento: number, agora: number) {
  if (!agora) return ""
  const minutos = Math.max(0, Math.round((agora - momento) / 60_000))
  if (minutos < 1) return "agora"
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.round(horas / 24)
  if (dias === 1) return "ontem"
  if (dias < 30) return `há ${dias} dias`
  return new Date(momento).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
}
