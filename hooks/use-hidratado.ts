import { useSyncExternalStore } from "react"

const inscrever = () => () => {}

// false no servidor e na hidratação; true depois que o navegador assumiu.
// Evita diferenças de HTML entre servidor e cliente com dados do localStorage.
export function useHidratado() {
  return useSyncExternalStore(
    inscrever,
    () => true,
    () => false
  )
}
