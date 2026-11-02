"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DateField, ListPicker, PriorityPicker } from "@/components/ui/fields"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Textarea } from "@/components/ui/textarea"
import { useTarefas } from "@/lib/estado/tarefas"
import type { Tarefa } from "@/lib/tipos"

// Detalhe da tarefa: título, descrição, data, prioridade e lista. Salva sozinho.
export function DetalheTarefa({ tarefa, listas, aoFechar }: { tarefa: Tarefa | null; listas: string[]; aoFechar: () => void }) {
  return (
    <ResponsiveDialog open={tarefa !== null} onOpenChange={(aberto) => !aberto && aoFechar()} title="Tarefa" description="As alterações são salvas sozinhas.">
      {tarefa ? <Formulario key={tarefa.id} tarefa={tarefa} listas={listas} aoFechar={aoFechar} /> : null}
    </ResponsiveDialog>
  )
}

function Formulario({ tarefa, listas, aoFechar }: { tarefa: Tarefa; listas: string[]; aoFechar: () => void }) {
  const atualizar = useTarefas((estado) => estado.atualizarTarefa)
  const excluir = useTarefas((estado) => estado.excluirTarefa)
  const [titulo, setTitulo] = useState(tarefa.titulo)
  const [confirmando, setConfirmando] = useState(false)

  return (
    <div className="grid gap-5">
      <div className="grid gap-1.5">
        <Label htmlFor="tarefa-titulo">Título</Label>
        <Input
          id="tarefa-titulo"
          value={titulo}
          onChange={(evento) => {
            setTitulo(evento.target.value)
            if (evento.target.value.trim()) atualizar(tarefa.id, { titulo: evento.target.value.trim() })
          }}
          onBlur={() => setTitulo(tarefa.titulo)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="tarefa-descricao">Descrição</Label>
        <Textarea id="tarefa-descricao" value={tarefa.descricao} onChange={(evento) => atualizar(tarefa.id, { descricao: evento.target.value })} />
      </div>
      <div className="flex flex-wrap gap-2">
        <DateField value={tarefa.prazo} onChange={(prazo) => atualizar(tarefa.id, { prazo })} />
        <PriorityPicker value={tarefa.prioridade} onChange={(prioridade) => atualizar(tarefa.id, { prioridade })} />
        <ListPicker value={tarefa.lista} onChange={(lista) => atualizar(tarefa.id, { lista })} lists={listas} />
      </div>
      <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4">
        {confirmando ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-small text-ink-soft">Isto não pode ser desfeito.</span>
            <Button
              variant="danger"
              onClick={() => {
                excluir(tarefa.id)
                aoFechar()
              }}
            >
              Excluir tarefa
            </Button>
            <Button variant="ghost" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmando(true)}>
            Excluir…
          </Button>
        )}
        <Button variant="secondary" onClick={aoFechar}>
          Fechar
        </Button>
      </div>
    </div>
  )
}
