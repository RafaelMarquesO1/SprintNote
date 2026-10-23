"use client"

import { useEffect } from "react"
import { Undo2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { dispensarDesfazer, useDesfazerKanban } from "@/lib/estado/desfazer-kanban"

const DURACAO = 8000

// Rafael Marques - 23/10/2026
// Aviso no canto da tela: "Desfazer" depois de excluir ou arquivar um cartão, e
// recados como "Filtro aplicado" (com botão para remover o filtro).
export function AvisoDesfazer() {
  const atual = useDesfazerKanban((estado) => estado.atual)

  useEffect(() => {
    if (!atual) return
    const tempo = setTimeout(dispensarDesfazer, DURACAO)
    return () => clearTimeout(tempo)
  }, [atual])

  if (!atual) return null
  const { acao } = atual
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 bottom-4 left-4 z-50 mx-auto flex max-w-md items-center gap-2 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg sm:right-auto sm:left-1/2 sm:-translate-x-1/2"
    >
      <span className="min-w-0 flex-1 truncate">{atual.mensagem}</span>
      {acao && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            acao()
            dispensarDesfazer()
          }}
        >
          <Undo2Icon /> {atual.rotulo}
        </Button>
      )}
      <Button size="icon-sm" variant="ghost" aria-label="Fechar aviso" onClick={dispensarDesfazer}>
        <XIcon />
      </Button>
    </div>
  )
}
