"use client"

// Rafael Marques - 23/10/2026
// Escolha de uma nota para virar cartão no quadro.

import { useState } from "react"
import { useShallow } from "zustand/react/shallow"

import { Icone } from "@/components/icone"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useNotas } from "@/lib/estado/notas"
import { semAcento } from "@/lib/links-wiki"

export function EscolherNota({ aberto, aoMudarAberto, aoEscolher, ignorarId }: { aberto: boolean; aoMudarAberto: (aberto: boolean) => void; aoEscolher: (notaId: string) => void; ignorarId?: string }) {
  const biblioteca = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const [busca, setBusca] = useState("")
  const termo = semAcento(busca.trim())
  const lista = biblioteca.notas
    .filter((nota) => nota.id !== ignorarId && nota.tipo !== "quadro" && (!termo || semAcento(nota.titulo).includes(termo)))
    .sort((a, b) => b.atualizadoEm - a.atualizadoEm)
    .slice(0, 40)

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="sm:max-w-md">
        <div>
          <DialogTitle>Adicionar uma nota ao quadro</DialogTitle>
          <DialogDescription>O cartão mostra a nota e abre ela com um clique.</DialogDescription>
        </div>
        <Input autoFocus placeholder="Buscar nota…" value={busca} onChange={(evento) => setBusca(evento.target.value)} aria-label="Buscar nota" />
        <ul className="max-h-72 space-y-0.5 overflow-y-auto">
          {lista.map((nota) => {
            const livro = biblioteca.livros.find((item) => item.id === nota.livroId)
            return (
              <li key={nota.id}>
                <button
                  type="button"
                  onClick={() => {
                    aoEscolher(nota.id)
                    aoMudarAberto(false)
                    setBusca("")
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <Icone nome={nota.icone} className="text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{nota.titulo}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{livro ? livro.titulo : "Solta"}</span>
                </button>
              </li>
            )
          })}
          {lista.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted-foreground">Nenhuma nota encontrada.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
