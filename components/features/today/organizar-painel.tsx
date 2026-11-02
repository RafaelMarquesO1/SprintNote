"use client"

import { Reorder, useDragControls } from "motion/react"
import { useState } from "react"
import { GripVerticalIcon, LockIcon } from "lucide-react"

import { Button, IconButton } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Switch } from "@/components/ui/switch"
import { blocosPadrao, useInicio, type BlocoHoje, type ConfigBloco } from "@/lib/estado/inicio"

export const NOMES_BLOCOS: Record<BlocoHoje, string> = {
  quadros: "Quadros",
  "habitos-semana": "Hábitos da semana",
  "notas-recentes": "Notas recentes",
  "tarefas-proximas": "Tarefas próximas",
  tags: "Tags mais usadas",
}

// "Organizar painel" (8.4): arraste para ordenar e ligue/desligue cada bloco. "Seu dia" é fixo.
export function OrganizarPainel({ aberto, aoMudarAberto }: { aberto: boolean; aoMudarAberto: (aberto: boolean) => void }) {
  const salvos = useInicio((estado) => estado.blocos)
  const definirBlocos = useInicio((estado) => estado.definirBlocos)
  const [rascunho, setRascunho] = useState<ConfigBloco[]>(salvos)
  const [abertoAntes, setAbertoAntes] = useState(aberto)
  if (aberto !== abertoAntes) {
    setAbertoAntes(aberto)
    if (aberto) setRascunho(salvos)
  }

  const mover = (indice: number, passo: number) => {
    const destino = indice + passo
    if (destino < 0 || destino >= rascunho.length) return
    const lista = [...rascunho]
    const [bloco] = lista.splice(indice, 1)
    lista.splice(destino, 0, bloco)
    setRascunho(lista)
  }

  return (
    <ResponsiveDialog open={aberto} onOpenChange={aoMudarAberto} title="Organizar painel" description="Arraste para mudar a ordem. Desligue o que não quer ver no Hoje.">
      <div className="space-y-4">
        <div className="flex min-h-row items-center gap-3 rounded-md border border-line px-3 text-ui text-ink-soft">
          <LockIcon aria-hidden="true" className="size-4" />
          <span className="flex-1">Seu dia</span>
          <span className="text-small">Sempre visível</span>
        </div>
        <Reorder.Group axis="y" values={rascunho} onReorder={setRascunho} className="space-y-1.5">
          {rascunho.map((bloco, indice) => (
            <ItemBloco
              key={bloco.id}
              bloco={bloco}
              aoAlternar={(visivel) => setRascunho(rascunho.map((item) => (item.id === bloco.id ? { ...item, visivel } : item)))}
              aoMover={(passo) => mover(indice, passo)}
            />
          ))}
        </Reorder.Group>
        <div className="flex flex-wrap justify-between gap-2 pt-2">
          <Button variant="ghost" onClick={() => setRascunho(blocosPadrao())}>
            Voltar ao padrão
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => aoMudarAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                definirBlocos(rascunho)
                aoMudarAberto(false)
              }}
            >
              Salvar alterações
            </Button>
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  )
}

function ItemBloco({ bloco, aoAlternar, aoMover }: { bloco: ConfigBloco; aoAlternar: (visivel: boolean) => void; aoMover: (passo: number) => void }) {
  const controles = useDragControls()
  const nome = NOMES_BLOCOS[bloco.id]
  return (
    <Reorder.Item value={bloco} dragListener={false} dragControls={controles} className="flex min-h-row items-center gap-2 rounded-md border border-line bg-panel pr-3">
      <IconButton
        aria-label={`Mover ${nome}. Use as setas para cima e para baixo.`}
        size="sm"
        className="cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(evento) => controles.start(evento)}
        onKeyDown={(evento) => {
          if (evento.key === "ArrowUp") {
            evento.preventDefault()
            aoMover(-1)
          } else if (evento.key === "ArrowDown") {
            evento.preventDefault()
            aoMover(1)
          }
        }}
      >
        <GripVerticalIcon />
      </IconButton>
      <span className="flex-1 text-ui text-paper">{nome}</span>
      <Switch checked={bloco.visivel} onCheckedChange={aoAlternar} aria-label={`Mostrar ${nome}`} />
    </Reorder.Item>
  )
}
