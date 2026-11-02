"use client"

import { useRouter } from "next/navigation"
import { FilePlusIcon, ListPlusIcon, RepeatIcon, SquarePlusIcon, type LucideIcon } from "lucide-react"

import { useCriar } from "@/components/shell/estado"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { useNotas } from "@/lib/estado/notas"

// "Criar" (7.3 tecla C; 10: botão + da barra inferior): Tarefa, Nota, Hábito ou Cartão.
// Cada opção leva à tela certa com o campo de criação em foco (?criar=1).
export function DialogoCriar() {
  const aberto = useCriar((estado) => estado.aberto)
  const router = useRouter()
  const criarNota = useNotas((estado) => estado.criarNota)
  const fechar = () => useCriar.setState({ aberto: false })
  const ir = (href: string) => {
    fechar()
    router.push(href)
  }

  const opcoes: { rotulo: string; descricao: string; icone: LucideIcon; acao: () => void }[] = [
    { rotulo: "Tarefa", descricao: "Algo para fazer, com ou sem data.", icone: ListPlusIcon, acao: () => ir("/tarefas?criar=1") },
    { rotulo: "Nota", descricao: "Uma página em branco para escrever.", icone: FilePlusIcon, acao: () => ir(`/notas/${criarNota().id}`) },
    { rotulo: "Hábito", descricao: "Algo para repetir em certos dias.", icone: RepeatIcon, acao: () => ir("/habitos?criar=1") },
    { rotulo: "Cartão", descricao: "Um item no quadro do projeto.", icone: SquarePlusIcon, acao: () => ir("/kanban?criar=1") },
  ]

  return (
    <ResponsiveDialog open={aberto} onOpenChange={(valor) => useCriar.setState({ aberto: valor })} title="Criar" width="sm">
      <ul className="grid gap-1">
        {opcoes.map(({ rotulo, descricao, icone: Icone, acao }) => (
          <li key={rotulo}>
            <button type="button" onClick={acao} className="flex min-h-14 w-full items-center gap-4 rounded-md px-3 text-left hover:bg-raised">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-line-strong">
                <Icone aria-hidden="true" className="size-4.5" />
              </span>
              <span className="grid">
                <span className="text-ui font-semibold text-paper">{rotulo}</span>
                <span className="text-small text-ink-soft">{descricao}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </ResponsiveDialog>
  )
}
