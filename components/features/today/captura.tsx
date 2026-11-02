"use client"

import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import { CalendarIcon, ListIcon } from "lucide-react"

import { fade } from "@/components/motion/presets"
import { Chip } from "@/components/ui/chip"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Segmented } from "@/components/ui/segmented"
import { PriorityIcon } from "@/components/ui/status-icon"
import { toast } from "@/components/ui/toast"
import { useHoje } from "@/hooks/use-hoje"
import { formatarDataRelativa } from "@/lib/datas"
import { interpretarCaptura } from "@/lib/domain/captura"
import { useNotas } from "@/lib/estado/notas"
import { useTarefas } from "@/lib/estado/tarefas"

type Tipo = "tarefa" | "nota"

// Captura rápida (8.4): Tarefa aceita "@amanhã !alta #lista" e mostra a prévia em chips; Nota cria e abre.
export function CapturaRapida() {
  const router = useRouter()
  const hoje = useHoje()
  const adicionarTarefa = useTarefas((estado) => estado.adicionarTarefa)
  const excluirTarefa = useTarefas((estado) => estado.excluirTarefa)
  const criarNota = useNotas((estado) => estado.criarNota)
  const [tipo, setTipo] = useState<Tipo>("tarefa")
  const [texto, setTexto] = useState("")

  const previa = tipo === "tarefa" && hoje ? interpretarCaptura(texto, hoje) : null
  const temMarcas = Boolean(previa && (previa.prazo || previa.prioridade || previa.lista))

  function criar() {
    const titulo = tipo === "tarefa" ? previa?.titulo : texto.trim()
    if (!titulo) return
    if (tipo === "nota") {
      setTexto("")
      router.push(`/notas/${criarNota({ titulo }).id}`)
      return
    }
    const antes = new Set(useTarefas.getState().tarefas.map((tarefa) => tarefa.id))
    adicionarTarefa({
      titulo,
      prazo: previa?.prazo ?? hoje,
      ...(previa?.prioridade ? { prioridade: previa.prioridade } : {}),
      ...(previa?.lista ? { lista: previa.lista } : {}),
    })
    const nova = useTarefas.getState().tarefas.find((tarefa) => !antes.has(tarefa.id))
    setTexto("")
    toast.comDesfazer("Tarefa criada.", () => nova && excluirTarefa(nova.id))
  }

  return (
    <div className="space-y-2">
      <form
        className="flex items-center gap-3 rounded-lg border border-line bg-panel p-1.5 pr-4 focus-within:border-line-strong"
        onSubmit={(evento) => {
          evento.preventDefault()
          criar()
        }}
      >
        <Segmented
          size="sm"
          label="O que anotar"
          value={tipo}
          onChange={setTipo}
          options={[
            { value: "tarefa", label: "Tarefa" },
            { value: "nota", label: "Nota" },
          ]}
        />
        <Input
          variant="bare"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          aria-label={tipo === "tarefa" ? "Anotar uma tarefa para hoje" : "Título da nota nova"}
          aria-describedby="captura-dica"
          placeholder={tipo === "tarefa" ? "Anotar uma tarefa para hoje" : "Título da nota nova"}
          className="h-control-sm"
        />
        <span id="captura-dica" className="hidden shrink-0 items-center gap-1.5 text-micro text-ink-muted sm:flex">
          <Kbd>Enter</Kbd> para salvar
        </span>
      </form>
      <AnimatePresence initial={false}>
        {temMarcas && previa ? (
          <motion.div {...fade} className="flex flex-wrap items-center gap-1.5 px-1" aria-live="polite">
            {previa.prazo ? (
              <Chip className={previa.prazo === hoje ? "border-ember text-ember" : undefined}>
                <CalendarIcon aria-hidden="true" /> {formatarDataRelativa(previa.prazo)}
              </Chip>
            ) : null}
            {previa.prioridade ? (
              <Chip>
                <PriorityIcon priority={previa.prioridade} /> {previa.prioridade === "alta" ? "Alta" : previa.prioridade === "baixa" ? "Baixa" : "Média"}
              </Chip>
            ) : null}
            {previa.lista ? (
              <Chip>
                <ListIcon aria-hidden="true" /> {previa.lista}
              </Chip>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
