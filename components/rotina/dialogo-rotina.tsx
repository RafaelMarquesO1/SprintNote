"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

import { Icone, iconesRotina } from "@/components/icone"
import { SeletorCor } from "@/components/kanban/dialogos-quadro"
import { SeletorDias } from "@/components/seletor-dias"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { duracao, useRotina } from "@/lib/estado/rotina"
import type { ItemRotina } from "@/lib/tipos"

// Grade de ícones para escolher (usada no diálogo e no formulário rápido).
export function SeletorIconeRotina({ valor, aoMudar }: { valor: string; aoMudar: (icone: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-1" role="radiogroup" aria-label="Ícone">
      {iconesRotina.map((icone) => (
        <button
          key={icone}
          type="button"
          role="radio"
          aria-checked={valor === icone}
          aria-label={icone}
          title={icone}
          onClick={() => aoMudar(icone)}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg border transition-colors",
            valor === icone ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:bg-muted"
          )}
        >
          <Icone nome={icone} />
        </button>
      ))}
    </div>
  )
}

function FormularioItemRotina({ item, aoFechar }: { item: ItemRotina; aoFechar: () => void }) {
  const atualizarItem = useRotina((estado) => estado.atualizarItem)
  const excluirItem = useRotina((estado) => estado.excluirItem)
  // O título fica num rascunho só para permitir apagar tudo enquanto digita.
  const [titulo, setTitulo] = useState(item.titulo)
  const atualizar = (mudancas: Parameters<typeof atualizarItem>[1]) => atualizarItem(item.id, mudancas)
  const tempo = duracao(item)

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Atividade da rotina</DialogTitle>
        <DialogDescription>As alterações são salvas automaticamente.</DialogDescription>
      </DialogHeader>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Nome</span>
        <Input
          value={titulo}
          onChange={(evento) => {
            setTitulo(evento.target.value)
            if (evento.target.value.trim()) atualizar({ titulo: evento.target.value })
          }}
          onBlur={() => setTitulo(item.titulo)}
          autoFocus
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Início</span>
          <Input type="time" value={item.horario} onChange={(evento) => evento.target.value && atualizar({ horario: evento.target.value })} required />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">
            Término <span className="font-normal text-muted-foreground">{tempo ? `· ${tempo}` : "(opcional)"}</span>
          </span>
          <Input type="time" value={item.fim ?? ""} onChange={(evento) => atualizar({ fim: evento.target.value || null })} />
        </label>
      </div>

      <div className="grid gap-1.5 text-sm">
        <span className="font-medium">Dias</span>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorDias dias={item.dias} aoMudar={(dias) => atualizar({ dias })} />
          <Button type="button" variant="ghost" size="sm" onClick={() => atualizar({ dias: [1, 2, 3, 4, 5] })}>Dias úteis</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => atualizar({ dias: [0, 1, 2, 3, 4, 5, 6] })}>Todos</Button>
        </div>
      </div>

      <div className="grid gap-1.5 text-sm">
        <span className="font-medium">Cor</span>
        <SeletorCor valor={item.cor ?? null} aoMudar={(cor) => atualizar({ cor })} permitirNenhuma />
      </div>

      <div className="grid gap-1.5 text-sm">
        <span className="font-medium">Ícone</span>
        <SeletorIconeRotina valor={item.icone ?? "feito"} aoMudar={(icone) => atualizar({ icone })} />
      </div>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Observação</span>
        <Textarea
          value={item.observacao ?? ""}
          onChange={(evento) => atualizar({ observacao: evento.target.value })}
          placeholder="Ex.: levar garrafa d'água, treino A"
          className="min-h-16"
        />
      </label>

      <DialogFooter className="sm:justify-between">
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            excluirItem(item.id)
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

// Rafael Marques - 21/10/2026
// Diálogo de edição de uma atividade da rotina (nome, horários, dias, cor, ícone e observação).
export function DialogoItemRotina({ item, aoFechar }: { item: ItemRotina | null; aoFechar: () => void }) {
  return (
    <Dialog open={item !== null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="sm:max-w-lg">
        {item && <FormularioItemRotina key={item.id} item={item} aoFechar={aoFechar} />}
      </DialogContent>
    </Dialog>
  )
}
