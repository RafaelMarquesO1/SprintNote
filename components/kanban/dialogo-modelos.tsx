"use client"

// Rafael Marques - 26/10/2026
// Criar um quadro a partir de um modelo (Sprint, Projeto, Estudos, Minha semana, Atendimento,
// Conteúdo), com ou sem cartões de exemplo.

import { useState } from "react"
import { CheckIcon } from "lucide-react"

import { Icone } from "@/components/icone"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useKanban } from "@/lib/estado/kanban"
import { modelosKanban } from "@/lib/kanban/modelos"
import { cn } from "@/lib/utils"

export function DialogoModelos({ aberto, aoMudarAberto }: { aberto: boolean; aoMudarAberto: (aberto: boolean) => void }) {
  const criarQuadroDeModelo = useKanban((estado) => estado.criarQuadroDeModelo)
  const [escolhidoId, setEscolhidoId] = useState(modelosKanban[0].id)
  const [comExemplos, setComExemplos] = useState(true)
  const escolhido = modelosKanban.find((modelo) => modelo.id === escolhidoId) ?? modelosKanban[0]

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="flex max-h-[90svh] flex-col gap-3 sm:max-w-2xl">
        <div className="pr-8">
          <DialogTitle>Novo quadro a partir de um modelo</DialogTitle>
          <DialogDescription>Escolha um ponto de partida. Dá para mudar colunas, etiquetas e tudo o mais depois.</DialogDescription>
        </div>

        <div className="rolagem-fina grid min-h-0 flex-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2" role="radiogroup" aria-label="Modelos de quadro">
          {modelosKanban.map((modelo) => {
            const ativo = modelo.id === escolhidoId
            return (
              <button
                key={modelo.id}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => setEscolhidoId(modelo.id)}
                className={cn("space-y-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50", ativo && "border-foreground bg-muted/50")}
              >
                <span className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <Icone nome={modelo.icone} className="text-muted-foreground" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium">{modelo.nome}</span>
                  {ativo && <CheckIcon className="size-4" />}
                </span>
                <span className="block text-xs text-muted-foreground">{modelo.descricao}</span>
                <span className="flex flex-wrap gap-1">
                  {modelo.colunas.map((coluna) => (
                    <span key={coluna.titulo} className="rounded-full border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      {coluna.titulo}
                    </span>
                  ))}
                </span>
              </button>
            )
          })}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={comExemplos} onChange={(evento) => setComExemplos(evento.target.checked)} className="size-4 accent-[var(--foreground)]" />
          Incluir cartões de exemplo
        </label>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => aoMudarAberto(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              criarQuadroDeModelo(escolhido, comExemplos)
              aoMudarAberto(false)
            }}
          >
            Criar “{escolhido.nome}”
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
