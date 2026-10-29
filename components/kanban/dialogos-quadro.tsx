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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { classeSelect } from "@/components/tarefas/dialogo-tarefa"
import { ehCorPersonalizada, paletaCores } from "@/lib/cores"
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
      {/* Rafael Marques - 29/10/2026: qualquer cor, pelo seletor do sistema. */}
      <label
        title="Outra cor…"
        className={cn(
          "relative flex size-6 cursor-pointer items-center justify-center rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground ring-offset-2 ring-offset-background focus-within:ring-2 focus-within:ring-ring/50",
          ehCorPersonalizada(valor) && "border-solid ring-2 ring-ring"
        )}
        style={ehCorPersonalizada(valor) ? { background: valor ?? undefined } : undefined}
      >
        {!ehCorPersonalizada(valor) && <PlusIcon className="size-3.5" />}
        <input
          type="color"
          aria-label="Outra cor"
          value={ehCorPersonalizada(valor) && valor?.startsWith("#") ? valor : "#3b82f6"}
          onChange={(evento) => aoMudar(evento.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
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

        {/* Rafael Marques - 29/10/2026: lista compacta; a paleta abre só ao clicar na bolinha. */}
        {quadro.etiquetas.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">Nenhuma etiqueta ainda. Crie a primeira abaixo.</p>
        ) : (
          <ul className="-mx-1 max-h-64 space-y-0.5 overflow-y-auto px-1">
            {quadro.etiquetas.map((etiqueta) => (
              <li key={etiqueta.id} className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted/60">
                <Popover>
                  <PopoverTrigger
                    aria-label={`Trocar a cor da etiqueta ${etiqueta.nome}`}
                    title="Trocar a cor"
                    className="flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-background"
                  >
                    <span className="size-3.5 rounded-full" style={{ background: etiqueta.cor }} />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto">
                    <SeletorCor valor={etiqueta.cor} aoMudar={(nova) => nova && atualizarEtiqueta(quadro.id, etiqueta.id, { cor: nova })} />
                  </PopoverContent>
                </Popover>
                <Input
                  value={etiqueta.nome}
                  onChange={(evento) => atualizarEtiqueta(quadro.id, etiqueta.id, { nome: evento.target.value })}
                  aria-label="Nome da etiqueta"
                  className="h-7 border-transparent bg-transparent px-1.5 shadow-none hover:border-input focus-visible:border-input dark:bg-transparent"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Excluir a etiqueta ${etiqueta.nome}`}
                  onClick={() => excluirEtiqueta(quadro.id, etiqueta.id)}
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive max-sm:opacity-100"
                >
                  <Trash2Icon />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form
          className="space-y-3 rounded-lg border bg-muted/30 p-3"
          onSubmit={(evento) => {
            evento.preventDefault()
            if (!nome.trim()) return
            criarEtiqueta(quadro.id, nome, cor)
            setNome("")
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Nova etiqueta</p>
            {/* Prévia de como a etiqueta aparece no cartão. */}
            <span
              className="max-w-40 truncate rounded px-2 py-0.5 text-xs font-medium text-white"
              style={{ background: cor }}
            >
              {nome.trim() || "Prévia"}
            </span>
          </div>
          <div className="flex gap-2">
            <Input value={nome} onChange={(evento) => setNome(evento.target.value)} placeholder="Ex.: Urgente" aria-label="Nome da nova etiqueta" className="bg-background" />
            <Button type="submit" disabled={!nome.trim()}><PlusIcon /> Criar</Button>
          </div>
          <SeletorCor valor={cor} aoMudar={(nova) => nova && setCor(nova)} />
        </form>
      </DialogContent>
    </Dialog>
  )
}
