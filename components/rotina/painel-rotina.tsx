"use client"

import { useState } from "react"
import {
  CalendarClockIcon,
  CalendarDaysIcon,
  LayoutGridIcon,
  PencilIcon,
  PlusIcon,
  Rows3Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { CabecalhoPagina, Pagina, ResumoLinha } from "@/components/pagina"
import { Icone } from "@/components/icone"
import { SeletorCor } from "@/components/kanban/dialogos-quadro"
import { DialogoItemRotina, SeletorIconeRotina } from "@/components/rotina/dialogo-rotina"
import { SeletorDias, descreverDias } from "@/components/seletor-dias"
import { MarcadorConcluida } from "@/components/tarefas/lista-tarefas"
import { Button } from "@/components/ui/button"
import { Interruptor, OpcoesLadoALado, PainelPersonalizar, SecaoPersonalizar } from "@/components/painel-personalizar"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useHoje, useHorario } from "@/hooks/use-hoje"
import { diaDaSemana, nomesDias, nomesDiasCompletos } from "@/lib/datas"
import { duracao, exibicaoRotinaPadrao, itensDoDia, useRotina } from "@/lib/estado/rotina"
import type { ExibicaoRotina, ItemRotina } from "@/lib/tipos"

const ordemDias = [1, 2, 3, 4, 5, 6, 0]

// Cor da atividade com transparência (para fundos e realces).
const misturar = (cor: string, porcento: number) => `color-mix(in oklch, ${cor} ${porcento}%, transparent)`

// Formulário rápido: o essencial numa linha; o resto se ajusta depois no diálogo.
function NovaAtividade({ diaInicial }: { diaInicial: number }) {
  const adicionarItem = useRotina((estado) => estado.adicionarItem)
  const [titulo, setTitulo] = useState("")
  const [horario, setHorario] = useState("08:00")
  const [fim, setFim] = useState("")
  const [icone, setIcone] = useState("feito")
  const [cor, setCor] = useState<string | null>(null)
  const [dias, setDias] = useState<number[]>([diaInicial])

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault()
        if (!titulo.trim()) return
        adicionarItem({ titulo, horario, fim: fim || null, icone, cor, dias })
        setTitulo("")
      }}
      className="flex flex-col gap-3 rounded-xl border bg-card p-3"
    >
      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Escolher ícone e cor"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border hover:bg-muted"
            style={cor ? { color: cor, background: misturar(cor, 14), borderColor: misturar(cor, 40) } : undefined}
          >
            <Icone nome={icone} />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-auto space-y-2 p-2">
            <SeletorIconeRotina valor={icone} aoMudar={setIcone} />
            <DropdownMenuSeparator />
            <SeletorCor valor={cor} aoMudar={setCor} permitirNenhuma />
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-1">
          <Input type="time" value={horario} onChange={(evento) => setHorario(evento.target.value)} aria-label="Início" className="w-28" required />
          <span className="text-xs text-muted-foreground">até</span>
          <Input type="time" value={fim} onChange={(evento) => setFim(evento.target.value)} aria-label="Término (opcional)" className="w-28" />
        </div>
        <Input
          value={titulo}
          onChange={(evento) => setTitulo(evento.target.value)}
          placeholder="Nova atividade, ex.: Academia"
          aria-label="Atividade"
          className="min-w-48 flex-1"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SeletorDias dias={dias} aoMudar={setDias} />
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setDias([1, 2, 3, 4, 5])}>Dias úteis</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setDias([0, 1, 2, 3, 4, 5, 6])}>Todos</Button>
          <Button type="submit" size="sm"><PlusIcon /> Adicionar</Button>
        </div>
      </div>
    </form>
  )
}

// Quadradinho com o ícone da atividade, pintado com a cor dela.
function IconeAtividade({ item, tamanho = "normal" }: { item: ItemRotina; tamanho?: "normal" | "pequeno" }) {
  // O ícone leva a cor nos dois estilos ("No ícone" e "Tracejado").
  const colorir = Boolean(item.cor)
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        tamanho === "normal" ? "size-9" : "size-6 rounded-md",
        !colorir && "bg-muted text-muted-foreground"
      )}
      style={colorir ? { color: item.cor!, background: misturar(item.cor!, 15) } : undefined}
    >
      <Icone nome={item.icone ?? "feito"} className={tamanho === "pequeno" ? "size-3.5" : undefined} />
    </span>
  )
}

// Estilo do contêiner da atividade conforme "Cor das atividades".
function estiloCor(item: ItemRotina, exibicao: ExibicaoRotina): React.CSSProperties | undefined {
  if (!item.cor) return undefined
  // Rafael Marques - 22/10/2026: contorno tracejado na cor da atividade (sem fundo; o ícone já leva a cor)
  if (exibicao.estiloCor === "fundo")
    return {
      outline: `1.5px dashed ${misturar(item.cor, 65)}`,
      outlineOffset: 0,
    }
  return undefined
}

function Detalhes({ item, exibicao }: { item: ItemRotina; exibicao: ExibicaoRotina }) {
  const partes = [
    exibicao.mostrarDias && descreverDias(item.dias),
    exibicao.mostrarDuracao && duracao(item),
  ].filter(Boolean)
  return (
    <>
      {partes.length > 0 && <p className="truncate text-xs text-muted-foreground">{partes.join(" · ")}</p>}
      {exibicao.mostrarObservacao && item.observacao && (
        <p className="line-clamp-2 text-xs text-foreground/70">{item.observacao}</p>
      )}
    </>
  )
}

type PropsLista = {
  itens: ItemRotina[]
  exibicao: ExibicaoRotina
  ehHoje: boolean
  feitos: string[]
  idAgora?: string
  aoAlternar: (id: string) => void
  aoAbrir: (item: ItemRotina) => void
}

const horarios = (item: ItemRotina) => (item.fim ? `${item.horario}–${item.fim}` : item.horario)

function SeloAgora() {
  return <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">agora</span>
}

// Visão "Linha do tempo".
function LinhaDoTempo({ itens, exibicao, ehHoje, feitos, idAgora, aoAlternar, aoAbrir }: PropsLista) {
  return (
    <Card className="gap-0 py-2">
      <ol className="relative mx-4 border-l pl-5">
        {itens.map((item) => {
          const feito = ehHoje && feitos.includes(item.id)
          const agora = item.id === idAgora
          return (
            <li
              key={item.id}
              className={cn("group relative my-1 flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50", agora && "bg-primary/5")}
              style={estiloCor(item, exibicao)}
            >
              <span
                className={cn(
                  "absolute top-1/2 -left-[27px] size-3 -translate-y-1/2 rounded-full border-2 border-card",
                  agora && "ring-4 ring-primary/20",
                  !item.cor && (agora ? "bg-primary" : feito ? "bg-primary/60" : "bg-muted-foreground/30")
                )}
                style={item.cor ? { background: item.cor } : undefined}
              />
              <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{horarios(item)}</span>
              {ehHoje && (
                <MarcadorConcluida concluida={feito} aoAlternar={() => aoAlternar(item.id)} rotulo={`Marcar “${item.titulo}” como feito`} />
              )}
              <IconeAtividade item={item} />
              <button type="button" onClick={() => aoAbrir(item)} className="min-w-0 flex-1 text-left">
                <p className={cn("text-sm", feito && "text-muted-foreground line-through", agora && "font-semibold")}>
                  {item.titulo}
                  {agora && <SeloAgora />}
                </p>
                <Detalhes item={item} exibicao={exibicao} />
              </button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Editar ${item.titulo}`}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => aoAbrir(item)}
              >
                <PencilIcon />
              </Button>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

// Visão "Cartões".
function Cartoes({ itens, exibicao, ehHoje, feitos, idAgora, aoAlternar, aoAbrir }: PropsLista) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {itens.map((item) => {
        const feito = ehHoje && feitos.includes(item.id)
        const agora = item.id === idAgora
        return (
          <Card
            key={item.id}
            size="sm"
            className={cn("group relative gap-2 px-4 transition-shadow hover:shadow-md", agora && "ring-2 ring-primary/40", feito && "opacity-70")}
            style={estiloCor(item, exibicao)}
          >
            <div className="flex items-center gap-3">
              <IconeAtividade item={item} />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-muted-foreground tabular-nums">{horarios(item)}</p>
                <button type="button" onClick={() => aoAbrir(item)} className="block max-w-full text-left">
                  <p className={cn("truncate text-sm font-medium", feito && "text-muted-foreground line-through")}>{item.titulo}</p>
                </button>
              </div>
              {ehHoje && (
                <MarcadorConcluida concluida={feito} aoAlternar={() => aoAlternar(item.id)} rotulo={`Marcar “${item.titulo}” como feito`} />
              )}
            </div>
            <div>
              {agora && <span className="mb-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">agora</span>}
              <Detalhes item={item} exibicao={exibicao} />
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Editar ${item.titulo}`}
              className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => aoAbrir(item)}
            >
              <PencilIcon />
            </Button>
          </Card>
        )
      })}
    </div>
  )
}

// Visão "Semana": os sete dias lado a lado.
function Semana({
  itens,
  exibicao,
  diaHoje,
  feitos,
  aoAlternar,
  aoAbrir,
}: {
  itens: ItemRotina[]
  exibicao: ExibicaoRotina
  diaHoje: number
  feitos: string[]
  aoAlternar: (id: string) => void
  aoAbrir: (item: ItemRotina) => void
}) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className="grid min-w-[760px] grid-cols-7 divide-x">
        {ordemDias.map((dia) => {
          const doDia = itensDoDia(itens, dia).filter((item) => !(dia === diaHoje && exibicao.ocultarFeitas && feitos.includes(item.id)))
          const ehHoje = dia === diaHoje
          return (
            <div key={dia} className={cn("flex min-h-64 flex-col", ehHoje && "bg-primary/5")}>
              <p className={cn("border-b px-2 py-2 text-center text-xs font-medium", ehHoje ? "text-primary" : "text-muted-foreground")}>
                {nomesDias[dia]}
                {ehHoje && " · hoje"}
              </p>
              <div className="flex flex-col gap-1 p-1.5">
                {doDia.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground/60">—</p>}
                {doDia.map((item) => {
                  const feito = ehHoje && feitos.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      className="group flex items-start gap-1.5 rounded-md border bg-background/60 p-1.5 hover:bg-muted/60"
                      style={estiloCor(item, exibicao)}
                    >
                      <IconeAtividade item={item} tamanho="pequeno" />
                      <button type="button" onClick={() => aoAbrir(item)} className="min-w-0 flex-1 text-left">
                        <p className="font-mono text-[10px] leading-tight text-muted-foreground tabular-nums">{item.horario}</p>
                        <p className={cn("line-clamp-2 text-xs break-words", feito && "text-muted-foreground line-through")}>{item.titulo}</p>
                      </button>
                      {ehHoje && (
                        <MarcadorConcluida concluida={feito} aoAlternar={() => aoAlternar(item.id)} rotulo={`Marcar “${item.titulo}” como feito`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Menu "Personalizar" (mesmo modelo do Kanban).
function MenuPersonalizar({ exibicao }: { exibicao: ExibicaoRotina }) {
  const definirExibicao = useRotina((estado) => estado.definirExibicao)
  return (
    <PainelPersonalizar
      titulo="Aparência da rotina"
      descricao="As mudanças aparecem na hora."
      tamanhoBotao="sm"
      aoRestaurar={() => definirExibicao(exibicaoRotinaPadrao)}
    >
      <SecaoPersonalizar titulo="Cor das atividades">
        <OpcoesLadoALado
          rotulo="Cor das atividades"
          valor={exibicao.estiloCor === "fundo" ? "fundo" : "icone"}
          aoMudar={(estiloCor) => definirExibicao({ estiloCor })}
          opcoes={[
            { valor: "icone", rotulo: "No ícone" },
            { valor: "fundo", rotulo: "Tracejado" },
          ]}
        />
      </SecaoPersonalizar>
      <SecaoPersonalizar titulo="Mostrar">
        <Interruptor rotulo="Dias da semana" marcado={exibicao.mostrarDias} aoMudar={(marcado) => definirExibicao({ mostrarDias: marcado })} />
        <Interruptor rotulo="Duração" marcado={exibicao.mostrarDuracao} aoMudar={(marcado) => definirExibicao({ mostrarDuracao: marcado })} />
        <Interruptor rotulo="Observação" marcado={exibicao.mostrarObservacao} aoMudar={(marcado) => definirExibicao({ mostrarObservacao: marcado })} />
        <Interruptor rotulo="Destacar o que é “agora”" marcado={exibicao.destacarAgora} aoMudar={(marcado) => definirExibicao({ destacarAgora: marcado })} />
        <Interruptor
          rotulo="Esconder as já feitas"
          descricao="Só no dia de hoje."
          marcado={exibicao.ocultarFeitas}
          aoMudar={(marcado) => definirExibicao({ ocultarFeitas: marcado })}
        />
      </SecaoPersonalizar>
    </PainelPersonalizar>
  )
}

// Rafael Marques - 20/10/2026 (personalização: 21/10/2026)
// Rotina diária: atividades com horário, cor e ícone por dia da semana.
// No dia de hoje dá para marcar o que já foi feito e ver o que vem agora.
export function PainelRotina() {
  const hoje = useHoje()
  const horario = useHorario()
  const itens = useRotina((estado) => estado.itens)
  const feitosPorDia = useRotina((estado) => estado.feitosPorDia)
  const alternarFeito = useRotina((estado) => estado.alternarFeito)
  const exibicaoSalva = useRotina((estado) => estado.exibicao)
  const definirExibicao = useRotina((estado) => estado.definirExibicao)
  const [idAberto, setIdAberto] = useState<string | null>(null)
  const [diaEscolhido, setDiaEscolhido] = useState<number | null>(null)

  if (!hoje) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const exibicao = { ...exibicaoRotinaPadrao, ...exibicaoSalva }
  const diaHoje = diaDaSemana(hoje)
  const dia = diaEscolhido ?? diaHoje
  const ehHoje = dia === diaHoje
  const feitos = feitosPorDia[hoje] ?? []
  const doDia = itensDoDia(itens, dia)
  const visiveis = ehHoje && exibicao.ocultarFeitas ? doDia.filter((item) => !feitos.includes(item.id)) : doDia
  // Item "agora": o último que já começou (e ainda não terminou, se tiver término).
  const atual = ehHoje ? [...doDia].reverse().find((item) => item.horario <= horario) : undefined
  const idAgora = exibicao.destacarAgora && atual && (!atual.fim || atual.fim > horario || atual.fim < atual.horario) ? atual.id : undefined
  // Números de hoje (independem do dia escolhido nas abas).
  const rotinaDeHoje = itensDoDia(itens, diaHoje)
  const feitasHoje = rotinaDeHoje.filter((item) => feitos.includes(item.id)).length
  const proxima = rotinaDeHoje.find((item) => item.horario > horario && !feitos.includes(item.id))
  const aberto = itens.find((item) => item.id === idAberto) ?? null

  const props: PropsLista = {
    itens: visiveis,
    exibicao,
    ehHoje,
    feitos,
    idAgora,
    aoAlternar: (id) => alternarFeito(id, hoje),
    aoAbrir: (item) => setIdAberto(item.id),
  }

  return (
    <Pagina>
      <CabecalhoPagina
        secao="Organização"
        icone={CalendarClockIcon}
        titulo="Rotina"
        descricao={
          exibicao.visao === "semana"
            ? "Sua semana inteira. Clique numa atividade para editar."
            : ehHoje
              ? `Hoje, ${nomesDiasCompletos[dia].toLowerCase()}: marque o que já fez.`
              : `Rotina de ${nomesDiasCompletos[dia].toLowerCase()}.`
        }
        acoes={<MenuPersonalizar exibicao={exibicao} />}
        resumo={
          <ResumoLinha
            itens={[
              { valor: `${feitasHoje}/${rotinaDeHoje.length}`, texto: "feitas hoje" },
              proxima && { valor: proxima.horario, texto: `próxima: ${proxima.titulo}` },
              { valor: itens.length, texto: itens.length === 1 ? "atividade na semana" : "atividades na semana" },
            ]}
          />
        }
      />

      <NovaAtividade key={dia} diaInicial={dia} />

      {/* Barra de ferramentas: dia + modo de exibição */}
      <div className="flex flex-wrap items-center gap-2">
        {exibicao.visao !== "semana" && (
          <Tabs value={String(dia)} onValueChange={(valor) => setDiaEscolhido(Number(valor))}>
            <TabsList aria-label="Dia da semana">
              {ordemDias.map((item) => (
                <TabsTrigger key={item} value={String(item)} className="relative px-2.5">
                  {nomesDias[item]}
                  {item === diaHoje && <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary" />}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        <ToggleGroup
          value={[exibicao.visao]}
          onValueChange={(valor) => valor[0] && definirExibicao({ visao: valor[0] as ExibicaoRotina["visao"] })}
          variant="outline"
          size="sm"
          aria-label="Modo de exibição"
          className="ml-auto"
        >
          <ToggleGroupItem value="linha" aria-label="Linha do tempo" title="Linha do tempo"><Rows3Icon /></ToggleGroupItem>
          <ToggleGroupItem value="cartoes" aria-label="Cartões" title="Cartões"><LayoutGridIcon /></ToggleGroupItem>
          <ToggleGroupItem value="semana" aria-label="Semana" title="Semana inteira"><CalendarDaysIcon /></ToggleGroupItem>
        </ToggleGroup>
      </div>

      {exibicao.visao !== "semana" && ehHoje && doDia.length > 0 && (
        // Rafael Marques - 22/10/2026: rótulo para a barra não parecer solta quando está vazia
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso de hoje · {feitasHoje} de {doDia.length} feitas</span>
            <span className="font-medium text-foreground tabular-nums">{Math.round((feitasHoje / doDia.length) * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" aria-label={`${feitasHoje} de ${doDia.length} feitas`}>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(feitasHoje / doDia.length) * 100}%` }} />
          </div>
        </div>
      )}

      {exibicao.visao === "semana" ? (
        <Semana
          itens={itens}
          exibicao={exibicao}
          diaHoje={diaHoje}
          feitos={feitos}
          aoAlternar={props.aoAlternar}
          aoAbrir={props.aoAbrir}
        />
      ) : visiveis.length === 0 ? (
        <Card className="items-center py-10 text-center text-sm text-muted-foreground">
          {doDia.length > 0
            ? "Tudo feito por hoje!"
            : `Nada na rotina de ${nomesDiasCompletos[dia].toLowerCase()}. Adicione acima.`}
        </Card>
      ) : exibicao.visao === "cartoes" ? (
        <Cartoes {...props} />
      ) : (
        <LinhaDoTempo {...props} />
      )}

      <DialogoItemRotina item={aberto} aoFechar={() => setIdAberto(null)} />
    </Pagina>
  )
}
