"use client"

import Link from "next/link"
import { useShallow } from "zustand/react/shallow"
import { AlertTriangleIcon, CalendarClockIcon } from "lucide-react"

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useHoje } from "@/hooks/use-hoje"
import { useTarefasUnificadas } from "@/hooks/use-tarefas-unificadas"
import { formatarDataRelativa } from "@/lib/datas"
import { useConta } from "@/components/conta/portao-conta"
import { cartaoConcluido, cartoesRelevantes, useKanban } from "@/lib/estado/kanban"

// Rafael Marques - 22/10/2026 (cartões arquivados fora dos avisos em 23/10/2026)
// Avisos de prazo (Alert do shadcn) no topo das páginas: o que está atrasado
// e o que vence hoje, em tarefas e cartões do Kanban.

type Area = "tarefas" | "kanban"
type Pendencia = { titulo: string; prazo: string }

type Aviso = {
  chave: string
  atrasado: boolean
  titulo: string
  descricao: string
  href: string
  rotuloLink: string
}

const plural = (quantidade: number, um: string, varios: string) => `${quantidade} ${quantidade === 1 ? um : varios}`

// Lista os primeiros títulos: "“A”, “B” e mais 2".
function resumirTitulos(itens: Pendencia[]) {
  const nomes = itens.slice(0, 2).map((item) => `“${item.titulo}”`)
  const resto = itens.length - nomes.length
  return resto > 0 ? `${nomes.join(", ")} e mais ${resto}` : nomes.join(" e ")
}

function montarAvisos(area: Area, pendentes: Pendencia[], hoje: string): Aviso[] {
  const atrasadas = pendentes.filter((item) => item.prazo < hoje).sort((a, b) => a.prazo.localeCompare(b.prazo))
  const deHoje = pendentes.filter((item) => item.prazo === hoje)
  const tarefas = area === "tarefas"
  const href = tarefas ? "/tarefas" : "/kanban"
  const rotuloLink = tarefas ? "Ver tarefas" : "Ver Kanban"
  const avisos: Aviso[] = []

  if (atrasadas.length > 0) {
    const maisAntiga = atrasadas[0]
    avisos.push({
      chave: `${area}-atrasadas`,
      atrasado: true,
      titulo: tarefas
        ? `${plural(atrasadas.length, "tarefa atrasada", "tarefas atrasadas")}`
        : `${plural(atrasadas.length, "cartão atrasado", "cartões atrasados")}`,
      descricao: `${resumirTitulos(atrasadas)}. A mais antiga venceu ${formatarDataRelativa(maisAntiga.prazo).toLowerCase()}.`,
      href,
      rotuloLink,
    })
  }
  if (deHoje.length > 0) {
    avisos.push({
      chave: `${area}-hoje`,
      atrasado: false,
      titulo: tarefas
        ? `${plural(deHoje.length, "tarefa vence", "tarefas vencem")} hoje`
        : `${plural(deHoje.length, "cartão vence", "cartões vencem")} hoje`,
      descricao: `${resumirTitulos(deHoje)}.`,
      href,
      rotuloLink,
    })
  }
  return avisos
}

export function AvisosPrazo({
  areas,
  quadroId,
  comLinks = true,
}: {
  areas: Area[]
  // No Kanban, mostra só os cartões deste quadro.
  quadroId?: string
  // Esconde o botão quando o aviso já está na página de destino.
  comLinks?: boolean
}) {
  const hoje = useHoje()
  const { itens } = useTarefasUnificadas(hoje)
  const { cartoes, colunas, quadros } = useKanban(useShallow((estado) => ({ cartoes: estado.cartoes, colunas: estado.colunas, quadros: estado.quadros })))
  const meuId = useConta()?.usuario.id ?? null
  if (!hoje) return null

  const avisos: Aviso[] = []
  if (areas.includes("tarefas")) {
    const pendentes = itens
      .filter((item) => !item.concluida && item.prazo !== null)
      .map((item) => ({ titulo: item.titulo, prazo: item.prazo! }))
    avisos.push(...montarAvisos("tarefas", pendentes, hoje))
  }
  if (areas.includes("kanban")) {
    const idsColunas = quadroId ? new Set(colunas.filter((coluna) => coluna.quadroId === quadroId).map((coluna) => coluna.id)) : null
    // Rafael Marques - 23/10/2026: fora de um quadro, só cartões seus (pessoais ou de equipe atribuídos a você).
    const base = quadroId ? cartoes : cartoesRelevantes(cartoes, colunas, quadros, meuId)
    const pendentes = base
      .filter((cartao) => cartao.prazo && !cartao.arquivado && !cartaoConcluido(cartao, colunas) && (!idsColunas || idsColunas.has(cartao.colunaId)))
      .map((cartao) => ({ titulo: cartao.titulo, prazo: cartao.prazo! }))
    avisos.push(...montarAvisos("kanban", pendentes, hoje))
  }
  if (avisos.length === 0) return null

  // Atrasados primeiro.
  avisos.sort((a, b) => Number(b.atrasado) - Number(a.atrasado))

  return (
    <div className="space-y-2">
      {avisos.map((aviso) => {
        const Icone = aviso.atrasado ? AlertTriangleIcon : CalendarClockIcon
        return (
          <Alert key={aviso.chave} variant={aviso.atrasado ? "destructive" : "default"}>
            <Icone />
            <AlertTitle>{aviso.titulo}</AlertTitle>
            <AlertDescription className="truncate">{aviso.descricao}</AlertDescription>
            {comLinks && (
              <AlertAction>
                <Button variant="outline" size="xs" nativeButton={false} render={<Link href={aviso.href} />}>
                  {aviso.rotuloLink}
                </Button>
              </AlertAction>
            )}
          </Alert>
        )
      })}
    </div>
  )
}
