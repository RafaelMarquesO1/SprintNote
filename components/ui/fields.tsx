"use client"

import { CalendarIcon, CheckIcon, ClockIcon, ListIcon, PlusIcon } from "lucide-react"
import { useId, useState } from "react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PriorityIcon } from "@/components/ui/status-icon"
import { chaveHoje, formatarDataRelativa, somarDias } from "@/lib/datas"
import type { Prioridade } from "@/lib/tipos"

// Um só padrão de campo para Tarefas, Rotina e Cartões (seção 6): gatilho de 40px + popover.

const gatilho =
  "h-control gap-2 rounded-md border border-line-strong bg-transparent px-3 text-ui font-medium text-ink hover:bg-raised data-popup-open:bg-raised"

// ---------- DateField ----------
export function DateField({
  value,
  onChange,
  label = "Data",
  placeholder = "Sem data",
  className,
}: {
  value: string | null
  onChange: (data: string | null) => void
  label?: string
  placeholder?: string
  className?: string
}) {
  const id = useId()
  const [aberto, setAberto] = useState(false)
  const hoje = chaveHoje()
  const atalhos = [
    { rotulo: "Hoje", valor: hoje },
    { rotulo: "Amanhã", valor: somarDias(hoje, 1) },
    { rotulo: "Daqui a uma semana", valor: somarDias(hoje, 7) },
  ]
  const ehHoje = value === hoje
  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger render={<Button variant="secondary" className={cn(gatilho, className)} aria-label={`${label}: ${value ? formatarDataRelativa(value) : placeholder}`} />}>
        <CalendarIcon className={cn(ehHoje ? "text-ember" : "text-ink-soft")} />
        <span className={cn(ehHoje && "text-ember", !value && "text-ink-soft")}>{value ? formatarDataRelativa(value) : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className="w-64 gap-1 p-1.5">
        {atalhos.map((atalho) => (
          <button
            key={atalho.rotulo}
            type="button"
            onClick={() => {
              onChange(atalho.valor)
              setAberto(false)
            }}
            className="flex h-control items-center justify-between rounded-sm px-2.5 text-left text-ui text-ink hover:bg-raised"
          >
            {atalho.rotulo}
            {value === atalho.valor ? <CheckIcon className="size-4" /> : null}
          </button>
        ))}
        <div className="mt-1 border-t border-line px-1 pt-2 pb-1">
          <Label htmlFor={id} className="mb-1.5">
            Escolher data
          </Label>
          <Input
            id={id}
            type="date"
            value={value ?? ""}
            onChange={(evento) => {
              onChange(evento.target.value || null)
              setAberto(false)
            }}
          />
        </div>
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setAberto(false)
            }}
            className="h-control rounded-sm px-2.5 text-left text-ui text-ink-soft hover:bg-raised hover:text-paper"
          >
            Remover data
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

// ---------- TimeField ----------
export function TimeField({
  value,
  onChange,
  label,
  optional = false,
  className,
}: {
  value: string
  onChange: (hora: string) => void
  label: string
  optional?: boolean
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn("relative", className)}>
      <Label htmlFor={id} srOnly>
        {label}
        {optional ? " (opcional)" : ""}
      </Label>
      <ClockIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
      <Input id={id} type="time" value={value} onChange={(evento) => onChange(evento.target.value)} className="w-36 pl-9 tabular-nums" />
    </div>
  )
}

// ---------- PriorityPicker ----------
const PRIORIDADES: { valor: Prioridade; rotulo: string }[] = [
  { valor: "baixa", rotulo: "Baixa" },
  { valor: "media", rotulo: "Média" },
  { valor: "alta", rotulo: "Alta" },
]

export function PriorityPicker({ value, onChange, className }: { value: Prioridade; onChange: (prioridade: Prioridade) => void; className?: string }) {
  const [aberto, setAberto] = useState(false)
  const atual = PRIORIDADES.find((item) => item.valor === value) ?? PRIORIDADES[1]
  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger render={<Button variant="secondary" className={cn(gatilho, className)} aria-label={`Prioridade: ${atual.rotulo}`} />}>
        <PriorityIcon priority={value} />
        <span>{atual.rotulo}</span>
      </PopoverTrigger>
      <PopoverContent className="w-48 gap-0.5 p-1.5" role="listbox" aria-label="Prioridade">
        {PRIORIDADES.map((item) => (
          <button
            key={item.valor}
            type="button"
            role="option"
            aria-selected={item.valor === value}
            onClick={() => {
              onChange(item.valor)
              setAberto(false)
            }}
            className="flex h-control items-center gap-2.5 rounded-sm px-2.5 text-left text-ui text-ink hover:bg-raised"
          >
            <PriorityIcon priority={item.valor} />
            <span className="flex-1">{item.rotulo}</span>
            {item.valor === value ? <CheckIcon className="size-4" /> : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

// ---------- ListPicker ----------
export function ListPicker({
  value,
  onChange,
  lists,
  placeholder = "Sem lista",
  className,
}: {
  value: string
  onChange: (lista: string) => void
  lists: string[]
  placeholder?: string
  className?: string
}) {
  const id = useId()
  const [aberto, setAberto] = useState(false)
  const [nova, setNova] = useState("")
  const escolher = (lista: string) => {
    onChange(lista)
    setNova("")
    setAberto(false)
  }
  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger render={<Button variant="secondary" className={cn(gatilho, className)} aria-label={`Lista: ${value || placeholder}`} />}>
        <ListIcon className="text-ink-soft" />
        <span className={cn("max-w-32 truncate", !value && "text-ink-soft")}>{value || placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className="w-60 gap-0.5 p-1.5">
        <button type="button" onClick={() => escolher("")} className="flex h-control items-center justify-between rounded-sm px-2.5 text-left text-ui text-ink-soft hover:bg-raised">
          {placeholder}
          {!value ? <CheckIcon className="size-4" /> : null}
        </button>
        {lists.map((lista) => (
          <button key={lista} type="button" onClick={() => escolher(lista)} className="flex h-control items-center justify-between rounded-sm px-2.5 text-left text-ui text-ink hover:bg-raised">
            <span className="truncate">{lista}</span>
            {lista === value ? <CheckIcon className="size-4" /> : null}
          </button>
        ))}
        <form
          className="mt-1 flex gap-1.5 border-t border-line pt-2"
          onSubmit={(evento) => {
            evento.preventDefault()
            if (nova.trim()) escolher(nova.trim())
          }}
        >
          <Label htmlFor={id} srOnly>
            Nova lista
          </Label>
          <Input id={id} inputSize="sm" value={nova} onChange={(evento) => setNova(evento.target.value)} placeholder="Nova lista" />
          <Button type="submit" size="icon-sm" variant="secondary" aria-label="Criar lista">
            <PlusIcon />
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
