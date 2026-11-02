"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { FilePlusIcon } from "lucide-react"

import { useConta } from "@/components/conta/portao-conta"
import { BlocoHabitosSemana, BlocoNotasRecentes, BlocoQuadros, BlocoTags, BlocoTarefasProximas } from "@/components/features/today/blocos"
import { CapturaRapida } from "@/components/features/today/captura"
import { Onboarding } from "@/components/features/today/onboarding"
import { OrganizarPainel } from "@/components/features/today/organizar-painel"
import { SeuDia } from "@/components/features/today/seu-dia"
import { TopbarSlot } from "@/components/shell/estado"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { useHoje } from "@/hooks/use-hoje"
import { useNow } from "@/hooks/use-now"
import { itensDeHoje, useTarefasUnificadas } from "@/hooks/use-tarefas-unificadas"
import { diaDaSemana, lerChave } from "@/lib/datas"
import { fraseResumo, saudacao } from "@/lib/domain/hoje"
import { valeNoDia } from "@/lib/domain/habitos"
import { useHabitos } from "@/lib/estado/habitos"
import { useInicio, type BlocoHoje } from "@/lib/estado/inicio"
import { cartaoConcluido, cartoesRelevantes, useKanban } from "@/lib/estado/kanban"
import { useNotas } from "@/lib/estado/notas"
import { itensDoDia, useRotina } from "@/lib/estado/rotina"

// Hoje (8.4): "o que é meu agora e o que vem a seguir" numa olhada.
export function PaginaHoje() {
  const hoje = useHoje()
  const agora = useNow(60_000)
  const router = useRouter()
  const conta = useConta()
  const criarNota = useNotas((estado) => estado.criarNota)
  const blocos = useInicio((estado) => estado.blocos)
  const [organizando, setOrganizando] = useState(false)
  const resumo = useResumo(hoje, agora)

  const primeiroNome = (conta?.usuario.nome || "").split(" ")[0]
  const dataLonga = hoje ? lerChave(hoje).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : ""
  // "domingo, 1 de novembro" → "Domingo, 1 de novembro"
  const data = dataLonga.charAt(0).toUpperCase() + dataLonga.slice(1)

  const RENDER: Record<BlocoHoje, React.ReactNode> = {
    quadros: <BlocoQuadros />,
    "habitos-semana": hoje ? <BlocoHabitosSemana hoje={hoje} /> : null,
    "notas-recentes": <BlocoNotasRecentes />,
    "tarefas-proximas": hoje ? <BlocoTarefasProximas hoje={hoje} /> : null,
    tags: <BlocoTags />,
  }
  const visiveis = blocos.filter((bloco) => bloco.visivel)
  // Notas recentes vai para baixo do "Seu dia" quando visível (como no artboard); o resto fica à direita.
  const esquerda = visiveis.filter((bloco) => bloco.id === "notas-recentes")
  const direita = visiveis.filter((bloco) => bloco.id !== "notas-recentes")

  return (
    <div className="space-y-8">
      <TopbarSlot
        acoes={
          <Button variant="secondary" size="sm" onClick={() => setOrganizando(true)}>
            Organizar painel
          </Button>
        }
      />
      <PageHeader
        eyebrow={data}
        title={agora ? `${saudacao(agora.getHours())}${primeiroNome ? `, ${primeiroNome}` : ""}.` : <Skeleton variant="line" className="h-12 w-80" />}
        description={resumo}
        actions={
          <Button data-icon="inline-start" onClick={() => router.push(`/notas/${criarNota().id}`)}>
            <FilePlusIcon /> Nova nota
          </Button>
        }
      />

      <CapturaRapida />

      {hoje ? (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <SeuDia hoje={hoje} onboarding={<Onboarding />} />
            {esquerda.map((bloco) => (
              <div key={bloco.id}>{RENDER[bloco.id]}</div>
            ))}
          </div>
          <div className="space-y-5">
            {direita.map((bloco) => (
              <div key={bloco.id}>{RENDER[bloco.id]}</div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton variant="block" className="h-96 rounded-xl" />
          <div className="space-y-5">
            <Skeleton variant="block" className="h-48 rounded-xl" />
            <Skeleton variant="block" className="h-40 rounded-xl" />
          </div>
        </div>
      )}

      <OrganizarPainel aberto={organizando} aoMudarAberto={setOrganizando} />
    </div>
  )
}

// Lista vazia fixa: um [] novo a cada leitura faria o seletor do Zustand renderizar sem parar.
const NENHUM: string[] = []

function useResumo(hoje: string, agora: Date | null) {
  const meuId = useConta()?.usuario.id ?? null
  const { itens } = useTarefasUnificadas(hoje)
  const habitos = useHabitos((estado) => estado.habitos)
  const rotina = useRotina((estado) => estado.itens)
  const feitosRotina = useRotina((estado) => (hoje ? (estado.feitosPorDia[hoje] ?? NENHUM) : NENHUM))
  const kanban = useKanban(useShallow((estado) => ({ quadros: estado.quadros, colunas: estado.colunas, cartoes: estado.cartoes })))
  if (!hoje || !agora) return null

  const pendentes = itensDeHoje(itens, hoje)
  const habitosRestantes = habitos.filter((habito) => valeNoDia(habito, hoje) && !habito.feitos.includes(hoje)).length
  const horaAgora = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`
  const proxima = itensDoDia(rotina, diaDaSemana(hoje)).find((item) => item.horario > horaAgora && !feitosRotina.includes(item.id))
  const abertos = cartoesRelevantes(kanban.cartoes, kanban.colunas, kanban.quadros, meuId).filter((cartao) => !cartaoConcluido(cartao, kanban.colunas))
  const quadrosDosAbertos = new Set(abertos.map((cartao) => kanban.colunas.find((coluna) => coluna.id === cartao.colunaId)?.quadroId))
  const quadroUnico = quadrosDosAbertos.size === 1 ? kanban.quadros.find((quadro) => quadrosDosAbertos.has(quadro.id))?.titulo ?? null : null

  return fraseResumo({
    tarefas: pendentes.length,
    atrasadas: pendentes.filter((item) => item.prazo! < hoje).length,
    habitosRestantes,
    proximaRotina: proxima ? { titulo: proxima.titulo, horario: proxima.horario } : null,
    cartoesAbertos: abertos.length,
    quadroDosCartoes: quadroUnico,
  })
}
