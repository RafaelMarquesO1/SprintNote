"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DayPicker } from "@/components/ui/day-picker"
import { TimeField } from "@/components/ui/fields"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Textarea } from "@/components/ui/textarea"
import { useRotina } from "@/lib/estado/rotina"
import type { ItemRotina } from "@/lib/tipos"

// Editar uma atividade da rotina: título, horários, dias, observação. Salva sozinho.
export function EditarAtividade({ item, hojeSemana, aoFechar }: { item: ItemRotina | null; hojeSemana: number; aoFechar: () => void }) {
  return (
    <ResponsiveDialog open={item !== null} onOpenChange={(aberto) => !aberto && aoFechar()} title="Atividade" description="As alterações são salvas sozinhas.">
      {item ? <Formulario key={item.id} item={item} hojeSemana={hojeSemana} aoFechar={aoFechar} /> : null}
    </ResponsiveDialog>
  )
}

function Formulario({ item, hojeSemana, aoFechar }: { item: ItemRotina; hojeSemana: number; aoFechar: () => void }) {
  const atualizar = useRotina((estado) => estado.atualizarItem)
  const excluir = useRotina((estado) => estado.excluirItem)
  const [titulo, setTitulo] = useState(item.titulo)
  const [confirmando, setConfirmando] = useState(false)
  return (
    <div className="grid gap-5">
      <div className="grid gap-1.5">
        <Label htmlFor="atividade-titulo">Atividade</Label>
        <Input
          id="atividade-titulo"
          value={titulo}
          onChange={(evento) => {
            setTitulo(evento.target.value)
            if (evento.target.value.trim()) atualizar(item.id, { titulo: evento.target.value })
          }}
          onBlur={() => setTitulo(item.titulo)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TimeField label="Início" value={item.horario} onChange={(horario) => horario && atualizar(item.id, { horario })} />
        <span className="text-ink-muted">até</span>
        <TimeField label="Fim" optional value={item.fim ?? ""} onChange={(fim) => atualizar(item.id, { fim: fim || null })} />
      </div>
      <div className="grid gap-1.5">
        <span className="text-small font-medium text-ink-soft">Dias</span>
        <DayPicker value={item.dias} onChange={(dias) => atualizar(item.id, { dias })} today={hojeSemana} shortcuts />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="atividade-obs">Observação</Label>
        <Textarea id="atividade-obs" value={item.observacao ?? ""} onChange={(evento) => atualizar(item.id, { observacao: evento.target.value })} />
      </div>
      <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4">
        {confirmando ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-small text-ink-soft">Isto não pode ser desfeito.</span>
            <Button
              variant="danger"
              onClick={() => {
                excluir(item.id)
                aoFechar()
              }}
            >
              Excluir atividade
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
