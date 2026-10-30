"use client"

// Rafael Marques - 30/10/2026
// Seções da tela de apresentação: uma por funcionalidade, cada uma com o texto e uma ilustração grande,
// montada com os mesmos tons do app. As ilustrações respondem ao clique (marcar tarefa, mover cartão,
// recolher código…) para a pessoa experimentar antes de criar a conta. São exemplos, sem dados reais.

import { useState } from "react"
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  FileTextIcon,
  FlagIcon,
  FlameIcon,
  FolderIcon,
  GripVerticalIcon,
  HistoryIcon,
  KanbanIcon,
  LinkIcon,
  ListChecksIcon,
  LockIcon,
  MapPinIcon,
  MessageSquareIcon,
  NetworkIcon,
  RepeatIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

// ---------- Peças comuns ----------

function Janela({ icone: IconeJanela, titulo, className, children }: { icone: React.ElementType; titulo: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("min-w-0 rounded-xl border bg-card p-4 shadow-sm sm:p-5", className)}>
      <p className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <IconeJanela className="size-3.5" /> {titulo}
      </p>
      {children}
    </div>
  )
}

function Avatar({ iniciais, className }: { iniciais: string; className?: string }) {
  return (
    <span aria-hidden className={cn("flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background", className)}>
      {iniciais}
    </span>
  )
}

function Marcador({ feito, aoAlternar, rotulo }: { feito: boolean; aoAlternar: () => void; rotulo: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={feito}
      aria-label={rotulo}
      onClick={aoAlternar}
      className={cn(
        "flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        feito ? "border-foreground bg-foreground text-background" : "border-muted-foreground/50 hover:border-foreground"
      )}
    >
      {feito && <CheckIcon className="size-3" />}
    </button>
  )
}

// Seção da página: texto de um lado, ilustração do outro (alternando).
export function SecaoRecurso({
  id,
  titulo,
  frase,
  pontos,
  invertida = false,
  children,
}: {
  id: string
  titulo: string
  frase: string
  pontos: string[]
  invertida?: boolean
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={`titulo-${id}`} className="grid items-center gap-10 border-t py-16 md:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
      <div className={cn("max-w-md space-y-5", invertida && "lg:order-2")}>
        <h2 id={`titulo-${id}`} className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          {titulo}
        </h2>
        <p className="text-lg leading-relaxed text-pretty text-muted-foreground">{frase}</p>
        <ul className="space-y-2.5 text-sm">
          {pontos.map((ponto) => (
            <li key={ponto} className="flex gap-2.5">
              <CheckIcon className="mt-0.5 size-4 shrink-0" />
              <span>{ponto}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={cn("min-w-0", invertida && "lg:order-1")}>{children}</div>
    </section>
  )
}

// ---------- Notas ----------

export function IlustracaoNotas() {
  const [codigoAberto, setCodigoAberto] = useState(true)
  const [itens, setItens] = useState([true, false, false])
  const textos = ["Fechar o roteiro da página inicial", "Revisar os textos com a equipe", "Publicar na sexta"]
  return (
    <div className="grid gap-4 sm:grid-cols-[11rem_1fr]">
      <Janela icone={FolderIcon} titulo="Biblioteca" className="hidden sm:block">
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-center gap-2 font-medium">
            <ChevronDownIcon className="size-3.5 text-muted-foreground" /> <FolderIcon className="size-4 text-muted-foreground" /> Site novo
          </li>
          <li className="ml-6 flex items-center gap-2 rounded-md bg-muted px-1.5 py-0.5">
            <FileTextIcon className="size-4 text-muted-foreground" /> Lançamento
          </li>
          <li className="ml-6 flex items-center gap-2 px-1.5 text-muted-foreground">
            <FileTextIcon className="size-4" /> Checklist
          </li>
          <li className="ml-6 flex items-center gap-2 px-1.5 text-muted-foreground">
            <FileTextIcon className="size-4" /> Ideias
          </li>
          <li className="flex items-center gap-2 pt-1 font-medium">
            <ChevronRightIcon className="size-3.5 text-muted-foreground" /> <FolderIcon className="size-4 text-muted-foreground" /> Estudos
          </li>
        </ul>
      </Janela>
      <Janela icone={FileTextIcon} titulo="Site novo / Lançamento">
        <div className="space-y-4 text-sm">
          <p className="text-2xl font-semibold tracking-tight">Lançamento do site</p>
          <p className="leading-relaxed text-muted-foreground">
            O plano está em <span className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4">Checklist</span> e quem
            revisa é{" "}
            <span className="inline-flex items-center gap-1 rounded-md border bg-muted px-1.5 text-[0.85em] font-medium text-foreground">
              <KanbanIcon className="size-3" /> #12 Revisar textos
            </span>{" "}
            <span className="rounded bg-muted px-1 text-xs text-muted-foreground">#site</span>
          </p>
          <ul className="space-y-2">
            {textos.map((texto, indice) => (
              <li key={texto} className="flex items-center gap-2.5">
                <Marcador feito={itens[indice]} rotulo={texto} aoAlternar={() => setItens(itens.map((feito, posicao) => (posicao === indice ? !feito : feito)))} />
                <span className={cn(itens[indice] && "text-muted-foreground line-through")}>{texto}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-lg bg-muted/70 px-3 pt-2 pb-2.5">
            <button
              type="button"
              aria-expanded={codigoAberto}
              onClick={() => setCodigoAberto(!codigoAberto)}
              className="flex w-full items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              {codigoAberto ? <ChevronDownIcon className="size-3.5" /> : <ChevronRightIcon className="size-3.5" />}
              javascript
              {!codigoAberto && <span className="truncate opacity-70">— const site = await publicar(…)</span>}
              <span className="ml-auto">3 linhas</span>
            </button>
            {codigoAberto && (
              <pre className="mt-1.5 overflow-x-auto font-mono text-[0.78rem] leading-6">
                <span className="text-muted-foreground">const</span> site = <span className="text-muted-foreground">await</span> publicar({"{"}
                {"\n"}  data: <span className="font-semibold">&quot;sexta&quot;</span>,{"\n"}
                {"}"})
              </pre>
            )}
          </div>
        </div>
      </Janela>
    </div>
  )
}

// ---------- Grafo ----------

const nosGrafo = [
  { id: "site", x: 50, y: 32, rotulo: "Site novo", secao: true },
  { id: "lanc", x: 26, y: 16, rotulo: "Lançamento" },
  { id: "check", x: 72, y: 13, rotulo: "Checklist" },
  { id: "ideias", x: 80, y: 40, rotulo: "Ideias" },
  { id: "estudos", x: 18, y: 50, rotulo: "Estudos", secao: true },
  { id: "react", x: 36, y: 56, rotulo: "React" },
  { id: "design", x: 64, y: 57, rotulo: "Design" },
]
const ligacoesGrafo: [string, string][] = [
  ["site", "lanc"], ["site", "check"], ["site", "ideias"], ["lanc", "check"], ["estudos", "react"], ["react", "design"], ["design", "ideias"], ["site", "design"],
]

export function IlustracaoGrafo() {
  const [foco, setFoco] = useState<string | null>(null)
  const ligado = (id: string) => foco === null || foco === id || ligacoesGrafo.some(([a, b]) => (a === foco && b === id) || (b === foco && a === id))
  const no = (id: string) => nosGrafo.find((item) => item.id === id)!
  return (
    <Janela icone={NetworkIcon} titulo="Grafo de conexões">
      <svg viewBox="0 0 100 66" className="h-auto w-full" onPointerLeave={() => setFoco(null)}>
        {ligacoesGrafo.map(([de, ate]) => {
          const ativa = foco !== null && (de === foco || ate === foco)
          return (
            <line
              key={de + ate}
              x1={no(de).x}
              y1={no(de).y}
              x2={no(ate).x}
              y2={no(ate).y}
              stroke="var(--foreground)"
              strokeOpacity={ativa ? 0.8 : foco ? 0.08 : 0.25}
              strokeWidth={ativa ? 0.55 : 0.35}
              className="transition-[stroke-opacity]"
            />
          )
        })}
        {nosGrafo.map((item) => (
          <g
            key={item.id}
            tabIndex={0}
            role="button"
            aria-label={`${item.rotulo}${item.secao ? " (seção)" : ""}`}
            onPointerEnter={() => setFoco(item.id)}
            onFocus={() => setFoco(item.id)}
            onBlur={() => setFoco(null)}
            className="cursor-pointer outline-none transition-opacity"
            opacity={ligado(item.id) ? 1 : 0.25}
          >
            <circle cx={item.x} cy={item.y} r={6} fill="transparent" />
            {item.secao ? (
              <>
                <rect x={item.x - 3.4} y={item.y - 3.4} width={6.8} height={6.8} rx={1.5} fill="var(--foreground)" fillOpacity={0.14} stroke="var(--foreground)" strokeWidth={0.6} />
                <rect x={item.x - 1.5} y={item.y - 1.5} width={3} height={3} rx={0.6} fill="var(--foreground)" />
              </>
            ) : (
              <circle cx={item.x} cy={item.y} r={foco === item.id ? 2.4 : 1.9} fill="var(--foreground)" fillOpacity={0.8} />
            )}
            <text
              x={item.x}
              y={item.y + (item.secao ? 7.4 : 5.4)}
              textAnchor="middle"
              fontSize={item.secao ? 3.1 : 2.7}
              fontWeight={item.secao || foco === item.id ? 600 : 400}
              fill={item.secao || foco === item.id ? "var(--foreground)" : "var(--muted-foreground)"}
            >
              {item.rotulo}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-foreground/80" /> Nota
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] border border-foreground bg-foreground/15" /> Seção
        </span>
        <span>Passe o mouse num ponto para ver as ligações.</span>
      </p>
    </Janela>
  )
}

// ---------- Kanban ----------

type CartaoDemo = { numero: number; titulo: string; coluna: number; prazo?: string }
const colunasKanban = ["A fazer", "Em andamento", "Concluído"]

export function IlustracaoKanban() {
  const [cartoes, setCartoes] = useState<CartaoDemo[]>([
    { numero: 14, titulo: "Definir as cores da marca", coluna: 0 },
    { numero: 15, titulo: "Escrever a página Sobre", coluna: 0, prazo: "sex" },
    { numero: 12, titulo: "Revisar textos", coluna: 1, prazo: "hoje" },
    { numero: 9, titulo: "Ajustar fotos da capa", coluna: 2 },
  ])
  const [checklist, setChecklist] = useState([true, true, false])
  const [historico, setHistorico] = useState(["Ana moveu de A fazer para Em andamento"])
  const textosChecklist = ["Página inicial", "Sobre", "Contato"]
  const feitos = checklist.filter(Boolean).length

  function avancar(numero: number) {
    const cartao = cartoes.find((item) => item.numero === numero)
    if (!cartao || cartao.coluna >= colunasKanban.length - 1) return
    setCartoes(cartoes.map((item) => (item.numero === numero ? { ...item, coluna: item.coluna + 1 } : item)))
    if (numero === 12) setHistorico([`Você moveu de ${colunasKanban[cartao.coluna]} para ${colunasKanban[cartao.coluna + 1]}`, ...historico].slice(0, 3))
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
      <Janela icone={KanbanIcon} titulo="Kanban / Site novo">
        {/* No celular o quadro rola para o lado, como no app. */}
        <div className="-mx-1 grid grid-cols-[repeat(3,minmax(9rem,1fr))] gap-2 overflow-x-auto px-1 pb-1">
          {colunasKanban.map((coluna, indice) => (
            <div key={coluna} className="min-w-0 space-y-2 rounded-lg bg-muted/50 p-2">
              <p className="flex items-center justify-between px-0.5 text-xs font-medium">
                {coluna} <span className="text-muted-foreground tabular-nums">{cartoes.filter((cartao) => cartao.coluna === indice).length}</span>
              </p>
              {cartoes
                .filter((cartao) => cartao.coluna === indice)
                .map((cartao) => (
                  <div key={cartao.numero} className={cn("group/cartao rounded-md border bg-background p-2 text-xs shadow-xs", cartao.numero === 12 && "ring-2 ring-foreground/80")}>
                    <p className={cn("leading-snug font-medium", indice === 2 && "text-muted-foreground line-through")}>
                      <span className="mr-1 font-normal text-muted-foreground tabular-nums">#{cartao.numero}</span>
                      {cartao.titulo}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {cartao.prazo && (
                        <span className="flex items-center gap-0.5">
                          <CalendarIcon className="size-3" /> {cartao.prazo}
                        </span>
                      )}
                      {cartao.numero === 12 && (
                        <span className="flex items-center gap-0.5">
                          <ListChecksIcon className="size-3" /> {feitos}/3
                        </span>
                      )}
                      {indice < 2 && (
                        <button
                          type="button"
                          onClick={() => avancar(cartao.numero)}
                          aria-label={`Mover #${cartao.numero} para ${colunasKanban[indice + 1]}`}
                          title={`Mover para ${colunasKanban[indice + 1]}`}
                          className="ml-auto flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          <ArrowRightIcon className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </Janela>

      <Janela icone={KanbanIcon} titulo="Cartão aberto">
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-lg font-semibold tracking-tight">Revisar textos</p>
            <p className="text-xs text-muted-foreground">
              <span className="mr-1 rounded bg-muted px-1 font-mono text-foreground">#12</span>
              na lista {colunasKanban[cartoes.find((cartao) => cartao.numero === 12)!.coluna]}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <Avatar iniciais="AL" className="size-4 text-[8px]" /> Ana
            </span>
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <CalendarIcon className="size-3" /> hoje
            </span>
            <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
              <FlagIcon className="size-3" /> Alta
            </span>
          </div>
          <div className="space-y-2">
            <p className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <ListChecksIcon className="size-3.5" /> Checklist
              </span>
              <span className="text-muted-foreground tabular-nums">{Math.round((feitos / 3) * 100)}%</span>
            </p>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${(feitos / 3) * 100}%` }} />
            </div>
            {textosChecklist.map((texto, indice) => (
              <label key={texto} className="flex cursor-pointer items-center gap-2 text-sm">
                <Marcador feito={checklist[indice]} rotulo={texto} aoAlternar={() => setChecklist(checklist.map((feito, posicao) => (posicao === indice ? !feito : feito)))} />
                <span className={cn(checklist[indice] && "text-muted-foreground line-through")}>{texto}</span>
              </label>
            ))}
          </div>
          <div className="rounded-lg border">
            <p className="flex items-center gap-2 border-b px-3 py-1.5 text-xs">
              <MessageSquareIcon className="size-3.5 text-muted-foreground" /> <strong className="font-semibold">Rafael</strong>
              <span className="text-muted-foreground">há 5 min</span>
            </p>
            <p className="px-3 py-2">Pode revisar a página inicial até sexta?</p>
          </div>
          <ol className="ml-1 space-y-1.5 border-l pl-3 text-xs text-muted-foreground">
            {historico.map((linha) => (
              <li key={linha} className="flex items-center gap-1.5">
                <HistoryIcon className="size-3 shrink-0" /> {linha}
              </li>
            ))}
          </ol>
        </div>
      </Janela>
    </div>
  )
}

// ---------- Tarefas ----------

export function IlustracaoTarefas() {
  const [tarefas, setTarefas] = useState([
    { titulo: "Atualizar a documentação", prazo: "ontem", atrasada: true, prioridade: "Alta", feita: false, lista: "Trabalho" },
    { titulo: "Responder o fornecedor", prazo: "hoje", prioridade: "Média", feita: false, lista: "Trabalho" },
    { titulo: "Revisar textos", prazo: "hoje", prioridade: "Alta", feita: false, lista: "Site novo" },
    { titulo: "Marcar dentista", prazo: "hoje", prioridade: "Baixa", feita: false, lista: "Pessoal" },
    { titulo: "Enviar convite à equipe", prazo: "hoje", prioridade: "Média", feita: true, lista: "Site novo" },
  ])
  const feitas = tarefas.filter((tarefa) => tarefa.feita).length
  return (
    <Janela icone={ListChecksIcon} titulo="Tarefas / Hoje">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${(feitas / tarefas.length) * 100}%` }} />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {feitas} de {tarefas.length} feitas
        </span>
      </div>
      <ul className="divide-y text-sm">
        {tarefas.map((tarefa, indice) => (
          <li key={tarefa.titulo} className="flex items-center gap-3 py-2.5">
            <Marcador
              feito={tarefa.feita}
              rotulo={tarefa.titulo}
              aoAlternar={() => setTarefas(tarefas.map((item, posicao) => (posicao === indice ? { ...item, feita: !item.feita } : item)))}
            />
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate", tarefa.feita && "text-muted-foreground line-through")}>{tarefa.titulo}</span>
              <span className="text-xs text-muted-foreground">{tarefa.lista}</span>
            </span>
            <span className={cn("hidden rounded border px-1.5 text-[11px] sm:inline", tarefa.prioridade === "Alta" ? "border-foreground/40 text-foreground" : "text-muted-foreground")}>
              {tarefa.prioridade}
            </span>
            <span className={cn("w-12 text-right text-xs", tarefa.atrasada && !tarefa.feita ? "font-medium text-destructive" : "text-muted-foreground")}>{tarefa.prazo}</span>
          </li>
        ))}
      </ul>
    </Janela>
  )
}

// ---------- Hábitos e rotina ----------

const diasSemana = ["S", "T", "Q", "Q", "S", "S", "D"]
// Hoje é o 5º dia (sexta) nesta ilustração.
const HOJE = 4

function sequencia(feitos: boolean[]) {
  let dias = 0
  for (let indice = HOJE; indice >= 0 && feitos[indice]; indice--) dias++
  return dias
}

export function IlustracaoHabitos() {
  const [habitos, setHabitos] = useState([
    { nome: "Beber água", feitos: [true, true, true, true, false, false, false] },
    { nome: "Ler 20 minutos", feitos: [true, false, true, true, false, false, false] },
    { nome: "Academia", feitos: [true, false, true, false, false, false, false] },
  ])
  const rotina = [
    { hora: "08:00", titulo: "Café e planejamento", estado: "feito" },
    { hora: "09:30", titulo: "Reunião da equipe", estado: "feito" },
    { hora: "12:00", titulo: "Almoço", estado: "proximo" },
    { hora: "15:00", titulo: "Bloco de foco", estado: "" },
    { hora: "19:00", titulo: "Estudo", estado: "" },
  ]
  return (
    <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
      <Janela icone={RepeatIcon} titulo="Hábitos / Esta semana">
        <div className="space-y-4 text-sm">
          {habitos.map((habito, posicaoHabito) => {
            const dias = sequencia(habito.feitos)
            return (
              <div key={habito.nome} className="space-y-1.5">
                <p className="flex items-center justify-between">
                  <span className="font-medium">{habito.nome}</span>
                  <span className={cn("flex items-center gap-0.5 text-xs tabular-nums", dias ? "text-foreground" : "text-muted-foreground/60")}>
                    <FlameIcon className="size-3" /> {dias} {dias === 1 ? "dia" : "dias"}
                  </span>
                </p>
                <div className="grid grid-cols-7 gap-1">
                  {habito.feitos.map((feito, dia) => {
                    const hoje = dia === HOJE
                    const futuro = dia > HOJE
                    return (
                      <button
                        key={dia}
                        type="button"
                        disabled={!hoje}
                        aria-pressed={feito}
                        aria-label={hoje ? `Marcar ${habito.nome} hoje` : `${habito.nome}, ${diasSemana[dia]}`}
                        onClick={() =>
                          setHabitos(habitos.map((item, posicao) => (posicao === posicaoHabito ? { ...item, feitos: item.feitos.map((valor, indice) => (indice === dia ? !valor : valor)) } : item)))
                        }
                        className={cn(
                          "flex h-7 items-center justify-center rounded text-[10px] transition-colors",
                          feito ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                          hoje && "ring-2 ring-foreground/40 ring-offset-1 ring-offset-card hover:ring-foreground focus-visible:ring-foreground focus-visible:outline-none",
                          futuro && "opacity-40"
                        )}
                      >
                        {hoje && !feito ? "hoje" : diasSemana[dia]}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Janela>
      <Janela icone={RepeatIcon} titulo="Rotina / Hoje">
        <ol className="relative ml-1 space-y-3.5 border-l pl-4 text-sm">
          {rotina.map((item) => (
            <li key={item.hora} className="relative">
              <span
                className={cn(
                  "absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-card",
                  item.estado === "feito" ? "bg-muted-foreground/50" : item.estado === "proximo" ? "bg-foreground ring-2 ring-foreground/25" : "bg-muted"
                )}
              />
              <span className="mr-2 font-mono text-xs text-muted-foreground">{item.hora}</span>
              <span className={cn(item.estado === "feito" && "text-muted-foreground line-through", item.estado === "proximo" && "font-medium")}>{item.titulo}</span>
              {item.estado === "proximo" && <span className="ml-2 rounded bg-foreground px-1.5 text-[10px] font-medium text-background">a seguir</span>}
            </li>
          ))}
        </ol>
      </Janela>
    </div>
  )
}

// ---------- Início personalizável ----------

export function IlustracaoInicio() {
  const [personalizando, setPersonalizando] = useState(false)
  const [larguras, setLarguras] = useState<Record<string, number>>({ tarefas: 2, habitos: 1, rotina: 1, notas: 4 })
  const widgets = [
    {
      id: "tarefas",
      titulo: "Tarefas de hoje",
      conteudo: (
        <ul className="space-y-1.5 text-xs">
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-muted-foreground/50" /> Revisar textos</li>
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-muted-foreground/50" /> Responder o fornecedor</li>
        </ul>
      ),
    },
    {
      id: "habitos",
      titulo: "Hábitos",
      conteudo: <p className="text-2xl font-semibold tabular-nums">2/3</p>,
    },
    {
      id: "rotina",
      titulo: "A seguir",
      conteudo: <p className="text-xs"><span className="font-mono text-muted-foreground">12:00</span> Almoço</p>,
    },
    {
      id: "notas",
      titulo: "Notas recentes",
      conteudo: (
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><FileTextIcon className="size-3" /> Lançamento</span>
          <span className="flex items-center gap-1"><FileTextIcon className="size-3" /> Checklist</span>
          <span className="flex items-center gap-1"><FileTextIcon className="size-3" /> Ideias</span>
        </p>
      ),
    },
  ]
  const span: Record<number, string> = { 1: "col-span-1", 2: "col-span-2", 3: "col-span-3", 4: "col-span-4" }
  return (
    <div className="rounded-xl border bg-background p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Sexta-feira, 30 de outubro</p>
          <p className="text-xl font-semibold tracking-tight">Bom dia, Ana!</p>
        </div>
        <button
          type="button"
          aria-pressed={personalizando}
          onClick={() => setPersonalizando(!personalizando)}
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            personalizando ? "border-foreground bg-foreground text-background" : "hover:bg-muted"
          )}
        >
          {personalizando ? <CheckIcon className="size-3.5" /> : <Settings2Icon className="size-3.5" />} {personalizando ? "Concluir" : "Personalizar"}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {widgets.map((widget) => (
          <div key={widget.id} className={cn("min-w-0 rounded-lg border bg-card p-3 transition-all", span[larguras[widget.id]], personalizando && "outline-2 outline-offset-2 outline-dashed outline-border")}>
            <p className="mb-2 flex items-center gap-1 text-xs font-medium">
              {personalizando && <GripVerticalIcon className="size-3.5 shrink-0 text-muted-foreground" />}
              <span className="min-w-0 flex-1 truncate">{widget.titulo}</span>
              {personalizando && (
                <span className="flex shrink-0 rounded bg-muted p-0.5">
                  {[1, 2, 4].map((largura) => (
                    <button
                      key={largura}
                      type="button"
                      aria-label={`${widget.titulo}: ${largura === 4 ? "largura inteira" : `${largura} de 4 colunas`}`}
                      onClick={() => setLarguras({ ...larguras, [widget.id]: largura })}
                      className={cn("flex h-4 w-5 items-center justify-center gap-px rounded-sm", larguras[widget.id] === largura && "bg-background shadow-xs")}
                    >
                      {[0, 1, 2, 3].map((barra) => (
                        <span key={barra} className={cn("h-2 w-[2px] rounded-[1px] bg-current", barra >= largura && "opacity-25")} />
                      ))}
                    </button>
                  ))}
                </span>
              )}
            </p>
            <div className={cn(personalizando && "opacity-50")}>{widget.conteudo}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Equipe ----------

export function IlustracaoEquipe() {
  const papeis = ["Leitor", "Editor", "Dono"]
  const [membros, setMembros] = useState([
    { iniciais: "RM", nome: "Rafael", papel: 2 },
    { iniciais: "AL", nome: "Ana Lima", papel: 1 },
    { iniciais: "JS", nome: "João Souza", papel: 0 },
  ])
  const [copiado, setCopiado] = useState(false)
  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
      <Janela icone={UsersIcon} titulo="Equipe do site / Membros">
        <ul className="divide-y rounded-lg border text-sm">
          {membros.map((membro, indice) => (
            <li key={membro.nome} className="flex items-center gap-2.5 px-3 py-2">
              <Avatar iniciais={membro.iniciais} />
              <span className="min-w-0 flex-1 truncate">{membro.nome}</span>
              <button
                type="button"
                disabled={membro.papel === 2}
                title={membro.papel === 2 ? undefined : "Clique para trocar o papel"}
                onClick={() => setMembros(membros.map((item, posicao) => (posicao === indice ? { ...item, papel: (item.papel + 1) % 2 } : item)))}
                className="flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-muted-foreground enabled:hover:bg-muted enabled:hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {papeis[membro.papel]}
                {membro.papel !== 2 && <ChevronDownIcon className="size-3" />}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium">
            <LinkIcon className="size-3.5" /> Convidar por link
          </p>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-1.5 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">sprintnote.app/convite/7f3k…</span>
            <button
              type="button"
              onClick={() => setCopiado(true)}
              className="flex shrink-0 items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {copiado ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />} {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">O link vale por 7 dias e só pode ser usado uma vez.</p>
        </div>
      </Janela>
      <div className="space-y-4">
        <Janela icone={MessageSquareIcon} titulo="Cartão #12 / Comentários">
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <Avatar iniciais="RM" />
              <p className="min-w-0 flex-1 rounded-lg border px-2.5 py-1.5">Pode revisar a página inicial até sexta?</p>
            </div>
            <div className="flex gap-2">
              <Avatar iniciais="AL" />
              <p className="min-w-0 flex-1 rounded-lg border px-2.5 py-1.5">Combinado, já comecei.</p>
            </div>
          </div>
        </Janela>
        <Janela icone={LockIcon} titulo="Privacidade">
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex gap-2">
              <MapPinIcon className="mt-0.5 size-3.5 shrink-0 text-foreground" /> Dados guardados em São Paulo, de acordo com a LGPD.
            </li>
            <li className="flex gap-2">
              <LockIcon className="mt-0.5 size-3.5 shrink-0 text-foreground" /> Suas notas são só suas: a equipe vê apenas os quadros compartilhados.
            </li>
          </ul>
        </Janela>
      </div>
    </div>
  )
}
