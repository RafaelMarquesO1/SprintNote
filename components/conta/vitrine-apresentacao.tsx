"use client"

// Rafael Marques - 30/10/2026
// Ilustração do topo da tela de apresentação: uma nota que cita o cartão #12, a lista de hoje e o cartão
// no Kanban. Uma linha liga a citação ao cartão (a única animação da página): notas, tarefas e projetos
// ligados entre si. É ilustração (a descrição fica no aria-label).

import { useEffect, useRef, useState } from "react"
import { CheckIcon, FileTextIcon, KanbanIcon, ListChecksIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Painel({ icone: IconePainel, titulo, className, children }: { icone: React.ElementType; titulo: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}>
      <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <IconePainel className="size-3.5" /> {titulo}
      </p>
      {children}
    </div>
  )
}

function Avatar({ iniciais, className }: { iniciais: string; className?: string }) {
  return (
    <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background", className)}>
      {iniciais}
    </span>
  )
}

function Cartao({ numero, titulo, destaque, children }: { numero: number; titulo: string; destaque?: boolean; children?: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border bg-background p-2.5 text-sm shadow-xs", destaque && "ring-2 ring-foreground/80")}>
      <p className="font-medium">
        <span className="mr-1 text-xs font-normal text-muted-foreground tabular-nums">#{numero}</span>
        {titulo}
      </p>
      {children}
    </div>
  )
}

// ---------- Notas: a citação do cartão, ligada a ele por uma linha ----------

type Linha = { d: string; largura: number; altura: number } | null

function useLinhaEntre(caixa: React.RefObject<HTMLDivElement | null>, de: React.RefObject<HTMLElement | null>, ate: React.RefObject<HTMLElement | null>) {
  const [linha, setLinha] = useState<Linha>(null)
  useEffect(() => {
    const elementoCaixa = caixa.current
    if (!elementoCaixa) return
    const medir = () => {
      const origem = de.current?.getBoundingClientRect()
      const destino = ate.current?.getBoundingClientRect()
      const base = elementoCaixa.getBoundingClientRect()
      if (!origem || !destino) return
      // Só com os painéis lado a lado: empilhados (celular), a linha atravessaria o texto da nota.
      if (destino.left <= origem.right) {
        setLinha(null)
        return
      }
      const x1 = origem.right - base.left
      const y1 = origem.top + origem.height / 2 - base.top
      const x2 = destino.left - base.left
      const y2 = destino.top + destino.height / 2 - base.top
      const meio = (x2 - x1) * 0.55
      setLinha({ d: `M ${x1} ${y1} C ${x1 + meio} ${y1}, ${x2 - meio} ${y2}, ${x2} ${y2}`, largura: base.width, altura: base.height })
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(elementoCaixa)
    return () => observador.disconnect()
  }, [caixa, de, ate])
  return linha
}

function CenaNotas() {
  const caixa = useRef<HTMLDivElement>(null)
  const citacao = useRef<HTMLSpanElement>(null)
  const cartao = useRef<HTMLDivElement>(null)
  const linha = useLinhaEntre(caixa, citacao, cartao)
  return (
    <div ref={caixa} className="relative grid gap-4 sm:grid-cols-[1.15fr_1fr]">
      <Painel icone={FileTextIcon} titulo="Notas / Trabalho" className="sm:row-span-2">
        <div className="space-y-3 text-sm">
          <p className="text-lg font-semibold tracking-tight">Lançamento do site</p>
          <p className="leading-relaxed text-muted-foreground">
            Antes de publicar, revisar os textos com a equipe. O roteiro está em{" "}
            <span className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4">Checklist de lançamento</span>.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Quem cuida da revisão:{" "}
            <span ref={citacao} className="inline-flex items-center gap-1 rounded-md border bg-muted px-1.5 text-[0.85em] font-medium text-foreground">
              <KanbanIcon className="size-3" /> #12 Revisar textos
            </span>
          </p>
          <div className="rounded-lg bg-muted/70 px-3 py-2 font-mono text-[0.78rem] leading-6 text-muted-foreground">
            <span className="text-foreground">publicar</span>(site, {"{"} data: <span className="text-foreground">&quot;sexta&quot;</span> {"}"})
          </div>
        </div>
      </Painel>
      <Painel icone={ListChecksIcon} titulo="Tarefas / Hoje">
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2 text-muted-foreground line-through">
            <span className="flex size-4 items-center justify-center rounded-full bg-foreground text-background">
              <CheckIcon className="size-3" />
            </span>
            Enviar convite à equipe
          </li>
          <li className="flex items-center gap-2">
            <span className="size-4 rounded-full border-2 border-muted-foreground/50" />
            Revisar textos
          </li>
        </ul>
      </Painel>
      <Painel icone={KanbanIcon} titulo="Kanban / Em andamento">
        <div ref={cartao}>
          <Cartao numero={12} titulo="Revisar textos" destaque>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Hoje</span>
              <Avatar iniciais="AL" />
            </div>
          </Cartao>
        </div>
      </Painel>
      {linha && (
        <svg className="pointer-events-none absolute inset-0 overflow-visible" width={linha.largura} height={linha.altura}>
          <path d={linha.d} fill="none" stroke="var(--foreground)" strokeWidth={1.5} strokeLinecap="round" className="linha-vitrine" pathLength={1} />
        </svg>
      )}
    </div>
  )
}

export function VitrineApresentacao() {
  return (
    <div role="img" aria-label="Exemplo do SprintNote: uma nota cita o cartão #12 do Kanban, que também aparece na lista de tarefas de hoje.">
      <div aria-hidden className="select-none">
        <CenaNotas />
      </div>
    </div>
  )
}
