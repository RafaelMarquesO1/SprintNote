"use client"

import { useState } from "react"
import { BanIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { classeSelect } from "@/components/tarefas/dialogo-tarefa"
import { paletaCores } from "@/lib/cores"
import { useKanban } from "@/lib/estado/kanban"
import type { ColunaKanban, QuadroKanban } from "@/lib/tipos"

// Seletor de cor em bolinhas (usado nas etiquetas e no cartão).
export function SeletorCor({ valor, aoMudar, permitirNenhuma = false }: { valor: string | null; aoMudar: (cor: string | null) => void; permitirNenhuma?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Cor">
      {permitirNenhuma && (
        <button
          type="button"
          role="radio"
          aria-checked={valor === null}
          aria-label="Sem cor"
          title="Sem cor"
          onClick={() => aoMudar(null)}
          className={cn(
            "flex size-6 items-center justify-center rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground ring-offset-2 ring-offset-background",
            valor === null && "ring-2 ring-ring"
          )}
        >
          <BanIcon className="size-3.5" />
        </button>
      )}
      {paletaCores.map((cor) => (
        <button
          key={cor.id}
          type="button"
          role="radio"
          aria-checked={valor === cor.valor}
          aria-label={cor.nome}
          title={cor.nome}
          onClick={() => aoMudar(cor.valor)}
          className={cn("size-6 rounded-full ring-offset-2 ring-offset-background", valor === cor.valor && "ring-2 ring-ring")}
          style={{ background: cor.valor }}
        />
      ))}
    </div>
  )
}

// Rafael Marques - 21/10/2026
// Excluir coluna: os cartões vão para outra coluna ou são excluídos junto.
export function DialogoExcluirColuna({
  coluna,
  outras,
  totalCartoes,
  aoFechar,
}: {
  coluna: ColunaKanban | null
  outras: ColunaKanban[]
  totalCartoes: number
  aoFechar: () => void
}) {
  const excluirColuna = useKanban((estado) => estado.excluirColuna)
  const [destino, setDestino] = useState("")
  const destinoValido = outras.some((item) => item.id === destino) ? destino : (outras[0]?.id ?? "")

  return (
    <AlertDialog open={coluna !== null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir a coluna “{coluna?.titulo}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {totalCartoes > 0 ? `Ela tem ${totalCartoes} cartão(ões).` : "A coluna está vazia."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {totalCartoes > 0 && outras.length > 0 && (
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Mover os cartões para</span>
            <select value={destinoValido} onChange={(evento) => setDestino(evento.target.value)} className={classeSelect}>
              {outras.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}
            </select>
          </label>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {totalCartoes > 0 && outras.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                if (coluna) excluirColuna(coluna.id, destinoValido)
                aoFechar()
              }}
            >
              Mover e excluir
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => {
              if (coluna) excluirColuna(coluna.id, null)
              aoFechar()
            }}
          >
            {totalCartoes > 0 ? "Excluir com os cartões" : "Excluir"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Etiquetas do quadro: criar, renomear, trocar a cor e excluir.
export function DialogoEtiquetas({ quadro, aberto, aoMudarAberto }: { quadro: QuadroKanban; aberto: boolean; aoMudarAberto: (aberto: boolean) => void }) {
  const criarEtiqueta = useKanban((estado) => estado.criarEtiqueta)
  const atualizarEtiqueta = useKanban((estado) => estado.atualizarEtiqueta)
  const excluirEtiqueta = useKanban((estado) => estado.excluirEtiqueta)
  const [nome, setNome] = useState("")
  const [cor, setCor] = useState<string>(paletaCores[0].valor)

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Etiquetas do quadro</DialogTitle>
          <DialogDescription>Use etiquetas para classificar os cartões (ex.: Urgente, Bug, Estudo).</DialogDescription>
        </DialogHeader>

        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {quadro.etiquetas.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma etiqueta ainda.</li>}
          {quadro.etiquetas.map((etiqueta) => (
            <li key={etiqueta.id} className="space-y-1.5 rounded-lg border p-2">
              <div className="flex items-center gap-2">
                <span className="size-3 shrink-0 rounded-full" style={{ background: etiqueta.cor }} />
                <Input
                  value={etiqueta.nome}
                  onChange={(evento) => atualizarEtiqueta(quadro.id, etiqueta.id, { nome: evento.target.value })}
                  aria-label="Nome da etiqueta"
                  className="h-7"
                />
                <Button variant="ghost" size="icon-sm" aria-label={`Excluir a etiqueta ${etiqueta.nome}`} onClick={() => excluirEtiqueta(quadro.id, etiqueta.id)}>
                  <Trash2Icon />
                </Button>
              </div>
              <SeletorCor valor={etiqueta.cor} aoMudar={(nova) => nova && atualizarEtiqueta(quadro.id, etiqueta.id, { cor: nova })} />
            </li>
          ))}
        </ul>

        <form
          className="space-y-2 border-t pt-3"
          onSubmit={(evento) => {
            evento.preventDefault()
            if (!nome.trim()) return
            criarEtiqueta(quadro.id, nome, cor)
            setNome("")
          }}
        >
          <p className="text-sm font-medium">Nova etiqueta</p>
          <div className="flex gap-2">
            <Input value={nome} onChange={(evento) => setNome(evento.target.value)} placeholder="Nome da etiqueta" aria-label="Nome da nova etiqueta" />
            <Button type="submit"><PlusIcon /> Criar</Button>
          </div>
          <SeletorCor valor={cor} aoMudar={(nova) => nova && setCor(nova)} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
