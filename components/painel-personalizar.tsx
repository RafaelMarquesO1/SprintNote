"use client"

import { CheckIcon, RotateCcwIcon, SlidersHorizontalIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"

// Rafael Marques - 21/10/2026
// Painel "Personalizar" usado em todas as telas: abre ao lado do botão, não
// fecha a cada clique (dá para ver a página mudando na hora) e mostra as
// opções lado a lado — botões, interruptores, cores e miniaturas.

export function PainelPersonalizar({
  titulo = "Personalizar",
  descricao,
  aoRestaurar,
  tamanhoBotao = "default",
  children,
}: {
  titulo?: string
  descricao?: string
  aoRestaurar?: () => void
  tamanhoBotao?: "default" | "sm"
  children: React.ReactNode
}) {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size={tamanhoBotao} />}>
        <SlidersHorizontalIcon /> <span className="max-sm:hidden">Personalizar</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <PopoverHeader className="border-b px-4 py-3">
          <PopoverTitle>{titulo}</PopoverTitle>
          {descricao && <PopoverDescription>{descricao}</PopoverDescription>}
        </PopoverHeader>
        <div className="rolagem-fina max-h-[min(70vh,560px)] space-y-5 overflow-y-auto px-4 py-4">{children}</div>
        {aoRestaurar && (
          <div className="border-t px-2 py-2">
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={aoRestaurar}>
              <RotateCcwIcon /> Voltar ao padrão
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function SecaoPersonalizar({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{titulo}</h3>
      {children}
    </section>
  )
}

// Escolha única com botões lado a lado (ex.: Pequeno / Normal / Grande).
export function OpcoesLadoALado<T extends string>({
  valor,
  opcoes,
  aoMudar,
  rotulo,
}: {
  valor: T
  opcoes: { valor: T; rotulo: string; icone?: React.ElementType }[]
  aoMudar: (valor: T) => void
  rotulo: string
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1">
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor
        return (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => aoMudar(opcao.valor)}
            className={cn(
              "flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              ativo ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opcao.icone && <opcao.icone className="size-3.5 shrink-0" />}
            <span className="truncate">{opcao.rotulo}</span>
          </button>
        )
      })}
    </div>
  )
}

// Liga/desliga com interruptor (a linha inteira é clicável).
export function Interruptor({
  rotulo,
  descricao,
  marcado,
  aoMudar,
}: {
  rotulo: string
  descricao?: string
  marcado: boolean
  aoMudar: (marcado: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md py-1">
      <span className="min-w-0">
        <span className="block text-sm">{rotulo}</span>
        {descricao && <span className="block text-xs text-muted-foreground">{descricao}</span>}
      </span>
      <Switch checked={marcado} onCheckedChange={aoMudar} />
    </label>
  )
}

// Bolinhas de cor (com opção "padrão").
export function SeletorCores({
  valor,
  cores,
  aoMudar,
  rotuloPadrao = "Padrão",
}: {
  valor: string | null | undefined
  cores: { valor: string; nome: string }[]
  aoMudar: (valor: string | null) => void
  rotuloPadrao?: string
}) {
  return (
    <div role="radiogroup" aria-label="Cor" className="flex flex-wrap gap-2">
      <button
        type="button"
        role="radio"
        aria-checked={!valor}
        title={rotuloPadrao}
        aria-label={rotuloPadrao}
        onClick={() => aoMudar(null)}
        className={cn(
          "flex size-7 items-center justify-center rounded-full border bg-primary text-primary-foreground ring-offset-2 ring-offset-popover",
          !valor && "ring-2 ring-ring"
        )}
      >
        {!valor && <CheckIcon className="size-3.5" />}
      </button>
      {cores.map((cor) => (
        <button
          key={cor.valor}
          type="button"
          role="radio"
          aria-checked={valor === cor.valor}
          title={cor.nome}
          aria-label={cor.nome}
          onClick={() => aoMudar(cor.valor)}
          className={cn("flex size-7 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-popover", valor === cor.valor && "ring-2 ring-ring")}
          style={{ background: cor.valor }}
        >
          {valor === cor.valor && <CheckIcon className="size-3.5" />}
        </button>
      ))}
    </div>
  )
}

// Miniaturas clicáveis (ex.: fontes "Aa" e fundos da página).
export function MiniaturasOpcoes<T extends string>({
  valor,
  opcoes,
  aoMudar,
  rotulo,
  colunas = 3,
}: {
  valor: T
  opcoes: { valor: T; rotulo: string; previa: React.ReactNode }[]
  aoMudar: (valor: T) => void
  rotulo: string
  colunas?: 2 | 3 | 4
}) {
  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className={cn("grid gap-2", colunas === 2 ? "grid-cols-2" : colunas === 4 ? "grid-cols-4" : "grid-cols-3")}
    >
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor
        return (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => aoMudar(opcao.valor)}
            className="group/miniatura space-y-1 text-center"
          >
            <span
              className={cn(
                "flex h-12 items-center justify-center overflow-hidden rounded-lg border bg-background transition-colors",
                ativo ? "border-primary ring-2 ring-primary/30" : "group-hover/miniatura:border-foreground/30"
              )}
            >
              {opcao.previa}
            </span>
            <span className={cn("block truncate text-[11px]", ativo ? "font-medium text-foreground" : "text-muted-foreground")}>
              {opcao.rotulo}
            </span>
          </button>
        )
      })}
    </div>
  )
}
