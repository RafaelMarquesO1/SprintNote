"use client"

// Rafael Marques - 30/10/2026
// Topo do Início: o resumo do dia (números clicáveis, no lugar da frase fixa) e a captura rápida,
// que cria uma tarefa para hoje ou uma nota sem sair da tela.

import { useState } from "react"
import Link from "next/link"
import { CheckIcon, FileTextIcon, ListTodoIcon, PlusIcon } from "lucide-react"

import { useMetricas } from "@/components/inicio/widgets"
import { ResumoLinha } from "@/components/pagina"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useHoje } from "@/hooks/use-hoje"
import { useNotas } from "@/lib/estado/notas"
import { useTarefas } from "@/lib/estado/tarefas"

// "3/5" → [3, 5]
const fracao = (valor: React.ReactNode) => String(valor).split("/").map(Number)

export function ResumoDia() {
  const metricas = useMetricas()
  if (!metricas) return null
  const tarefasHoje = Number(metricas["tarefas-hoje"].valor)
  const atrasadas = Number(metricas["tarefas-atrasadas"].valor)
  const cartoesAtrasados = Number(metricas["cartoes-atrasados"].valor)
  const cartoesAbertos = Number(metricas["cartoes-abertos"].valor)
  const [habitosFeitos, habitosTotal] = fracao(metricas["habitos-feitos"].valor)
  const [rotinaFeita, rotinaTotal] = fracao(metricas["rotina-feitas"].valor)
  const proxima = metricas["proxima-rotina"]

  return (
    <ResumoLinha
      itens={[
        { valor: tarefasHoje, texto: tarefasHoje === 1 ? "tarefa para hoje" : "tarefas para hoje", href: "/tarefas" },
        atrasadas > 0 && { valor: atrasadas, texto: atrasadas === 1 ? "atrasada" : "atrasadas", alerta: true, href: "/tarefas" },
        cartoesAbertos > 0 && { valor: cartoesAbertos, texto: cartoesAbertos === 1 ? "cartão em aberto" : "cartões em aberto", href: "/kanban" },
        cartoesAtrasados > 0 && { valor: cartoesAtrasados, texto: cartoesAtrasados === 1 ? "cartão atrasado" : "cartões atrasados", alerta: true, href: "/kanban" },
        habitosTotal > 0 && { valor: `${habitosFeitos}/${habitosTotal}`, texto: "hábitos", href: "/habitos" },
        rotinaTotal > 0 && { valor: `${rotinaFeita}/${rotinaTotal}`, texto: "da rotina", href: "/rotina" },
        proxima.valor !== "—" && { valor: proxima.valor, texto: proxima.detalhe ? `próxima: ${proxima.detalhe}` : "próxima atividade", href: "/rotina" },
      ]}
    />
  )
}

// Rafael Marques - 30/10/2026: a opção "Cartão" saiu (não dava para escolher o quadro nem preencher o resto).
type TipoCaptura = "tarefa" | "nota"

const rotulos: Record<TipoCaptura, { placeholder: string; botao: string }> = {
  tarefa: { placeholder: "Anotar uma tarefa para hoje…", botao: "Criar tarefa" },
  nota: { placeholder: "Título de uma nota nova…", botao: "Criar nota" },
}

export function CapturaRapida() {
  const hoje = useHoje()
  const adicionarTarefa = useTarefas((estado) => estado.adicionarTarefa)
  const criarNota = useNotas((estado) => estado.criarNota)
  const [tipo, setTipo] = useState<TipoCaptura>("tarefa")
  const [texto, setTexto] = useState("")
  const [aviso, setAviso] = useState<{ texto: string; href: string } | null>(null)

  function criar() {
    const titulo = texto.trim()
    if (!titulo) return
    if (tipo === "tarefa") {
      adicionarTarefa({ titulo, prazo: hoje || null })
      setAviso({ texto: `Tarefa “${titulo}” criada para hoje.`, href: "/tarefas" })
    } else {
      const nota = criarNota({ titulo })
      setAviso({ texto: `Nota “${titulo}” criada.`, href: `/notas/${nota.id}` })
    }
    setTexto("")
  }

  return (
    <div className="space-y-1.5">
      <form
        className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-1.5 shadow-xs sm:flex-nowrap"
        onSubmit={(evento) => {
          evento.preventDefault()
          criar()
        }}
      >
        <ToggleGroup
          value={[tipo]}
          onValueChange={(valor) => valor[0] && setTipo(valor[0] as TipoCaptura)}
          variant="outline"
          size="sm"
          aria-label="O que criar"
          className="shrink-0"
        >
          <ToggleGroupItem value="tarefa" aria-label="Tarefa" title="Tarefa para hoje"><ListTodoIcon /> <span className="max-sm:hidden">Tarefa</span></ToggleGroupItem>
          <ToggleGroupItem value="nota" aria-label="Nota" title="Nota"><FileTextIcon /> <span className="max-sm:hidden">Nota</span></ToggleGroupItem>
        </ToggleGroup>
        <Input
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value)
            if (aviso) setAviso(null)
          }}
          placeholder={rotulos[tipo].placeholder}
          aria-label={rotulos[tipo].placeholder}
          className="h-8 min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <Button type="submit" size="sm" disabled={!texto.trim()} className="max-sm:w-full">
          <PlusIcon /> {rotulos[tipo].botao}
        </Button>
      </form>
      {aviso && (
        <p role="status" className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
          <CheckIcon className="size-3.5 text-foreground" /> {aviso.texto}
          <Link href={aviso.href} className="font-medium text-foreground underline-offset-2 hover:underline">
            Abrir
          </Link>
        </p>
      )}
    </div>
  )
}
