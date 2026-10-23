"use client"

import { ArchiveRestoreIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useKanban } from "@/lib/estado/kanban"
import type { CartaoKanban } from "@/lib/tipos"

// Rafael Marques - 23/10/2026
// Cartões arquivados do quadro: abrir, restaurar ou excluir de vez.
export function DialogoArquivados({
  cartoes,
  aberto,
  aoMudarAberto,
  aoAbrirCartao,
}: {
  cartoes: CartaoKanban[]
  aberto: boolean
  aoMudarAberto: (aberto: boolean) => void
  aoAbrirCartao: (cartao: CartaoKanban) => void
}) {
  const arquivarCartao = useKanban((estado) => estado.arquivarCartao)
  const excluirCartao = useKanban((estado) => estado.excluirCartao)

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle>Cartões arquivados</DialogTitle>
        <DialogDescription>Ficam fora do quadro e dos números. Restaure quando quiser.</DialogDescription>
        {cartoes.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum cartão arquivado.</p>
        ) : (
          <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
            {cartoes.map((cartao) => (
              <li key={cartao.id} className="flex items-center gap-2 rounded-lg border p-2">
                <button type="button" onClick={() => aoAbrirCartao(cartao)} className="min-w-0 flex-1 truncate text-left text-sm hover:underline">
                  {cartao.titulo}
                </button>
                <Button size="sm" variant="outline" onClick={() => arquivarCartao(cartao.id, false)}>
                  <ArchiveRestoreIcon /> Restaurar
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label={`Excluir ${cartao.titulo}`} onClick={() => excluirCartao(cartao.id)}>
                  <Trash2Icon />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
