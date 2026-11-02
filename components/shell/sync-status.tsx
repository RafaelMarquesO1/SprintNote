"use client"

import { useEffect, useState, useSyncExternalStore } from "react"

import { useSincronizacao } from "@/lib/estado/sincronizacao"

function assinarConexao(avisar: () => void) {
  window.addEventListener("online", avisar)
  window.addEventListener("offline", avisar)
  return () => {
    window.removeEventListener("online", avisar)
    window.removeEventListener("offline", avisar)
  }
}

// Status de sincronização (7.1 / 8.15): "Tudo salvo", "Salvando…", "Sem conexão: salvo neste aparelho".
// Ao voltar a internet, mostra "Sincronizado" por 3s.
export function useTextoSincronizacao() {
  const estado = useSincronizacao((dados) => dados.estado)
  const online = useSyncExternalStore(assinarConexao, () => navigator.onLine, () => true)
  const [voltou, setVoltou] = useState(false)
  const [estavaOffline, setEstavaOffline] = useState(false)

  if (!online && !estavaOffline) setEstavaOffline(true)
  if (online && estavaOffline) {
    setEstavaOffline(false)
    setVoltou(true)
  }
  useEffect(() => {
    if (!voltou) return
    const id = setTimeout(() => setVoltou(false), 3000)
    return () => clearTimeout(id)
  }, [voltou])

  if (!online) return { texto: "Sem conexão: salvo neste aparelho", alerta: true }
  if (estado === "erro") return { texto: "Sem conexão: salvo neste aparelho", alerta: true }
  if (estado === "salvando" || estado === "pendente") return { texto: "Salvando…", alerta: false }
  if (voltou) return { texto: "Sincronizado", alerta: false }
  return { texto: "Tudo salvo", alerta: false }
}

export function SyncStatus({ className }: { className?: string }) {
  const { texto } = useTextoSincronizacao()
  return (
    <span role="status" aria-live="polite" className={className}>
      {texto}
    </span>
  )
}
