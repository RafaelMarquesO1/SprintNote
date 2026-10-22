"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { prioridades, useTarefas } from "@/lib/estado/tarefas"
import type { Prioridade, Tarefa } from "@/lib/tipos"

export const classeSelect =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

function FormularioTarefa({ tarefa, listas, aoFechar }: { tarefa: Tarefa; listas: string[]; aoFechar: () => void }) {
  const atualizarTarefa = useTarefas((estado) => estado.atualizarTarefa)
  const excluirTarefa = useTarefas((estado) => estado.excluirTarefa)
  // O título fica num rascunho só para permitir apagar tudo enquanto digita.
  const [titulo, setTitulo] = useState(tarefa.titulo)
  const atualizar = (mudancas: Parameters<typeof atualizarTarefa>[1]) => atualizarTarefa(tarefa.id, mudancas)

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Tarefa</DialogTitle>
        <DialogDescription>
          {tarefa.concluida ? "Concluída" : "Pendente"} · as alterações são salvas automaticamente
        </DialogDescription>
      </DialogHeader>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Título</span>
        <Input
          value={titulo}
          onChange={(evento) => {
            setTitulo(evento.target.value)
            if (evento.target.value.trim()) atualizar({ titulo: evento.target.value.trim() })
          }}
          onBlur={() => setTitulo(tarefa.titulo)}
          autoFocus
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Descrição</span>
        <Textarea value={tarefa.descricao} onChange={(evento) => atualizar({ descricao: evento.target.value })} className="min-h-20" />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Prazo</span>
          <Input type="date" value={tarefa.prazo ?? ""} onChange={(evento) => atualizar({ prazo: evento.target.value || null })} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Prioridade</span>
          <select value={tarefa.prioridade} onChange={(evento) => atualizar({ prioridade: evento.target.value as Prioridade })} className={classeSelect}>
            {prioridades.map((item) => (
              <option key={item.id} value={item.id}>{item.titulo}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Lista</span>
          <Input value={tarefa.lista} onChange={(evento) => atualizar({ lista: evento.target.value })} list="listas-tarefas-dialogo" placeholder="Ex.: Trabalho" />
          <datalist id="listas-tarefas-dialogo">
            {listas.map((item) => <option key={item} value={item} />)}
          </datalist>
        </label>
      </div>

      <DialogFooter className="sm:justify-between">
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            excluirTarefa(tarefa.id)
            aoFechar()
          }}
        >
          <Trash2Icon /> Excluir
        </Button>
        <Button type="button" variant="outline" onClick={aoFechar}>Fechar</Button>
      </DialogFooter>
    </div>
  )
}

// Rafael Marques - 20/10/2026
// Diálogo de edição de uma tarefa.
export function DialogoTarefa({
  tarefa,
  listas,
  aoFechar,
}: {
  tarefa: Tarefa | null
  listas: string[]
  aoFechar: () => void
}) {
  return (
    <Dialog open={tarefa !== null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="sm:max-w-lg">
        {tarefa && <FormularioTarefa key={tarefa.id} tarefa={tarefa} listas={listas} aoFechar={aoFechar} />}
      </DialogContent>
    </Dialog>
  )
}
