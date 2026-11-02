"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Command, useCommandState } from "cmdk"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { create } from "zustand"
import {
  BookIcon,
  BookPlusIcon,
  CheckSquareIcon,
  CircleUserRoundIcon,
  FilePlusIcon,
  FileTextIcon,
  HashIcon,
  InfoIcon,
  KanbanIcon,
  ListPlusIcon,
  LogOutIcon,
  PanelLeftIcon,
  RepeatIcon,
  SearchIcon,
  SquarePlusIcon,
  SunMoonIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import { spring } from "@/components/motion/presets"
import { useConta } from "@/components/conta/portao-conta"
import { useShell } from "@/components/shell/estado"
import { ITEM_BIBLIOTECA, ITEM_HOJE, ITENS_BIBLIOTECA, ITENS_FAZER } from "@/components/shell/navegacao"
import { Kbd } from "@/components/ui/kbd"
import { chaveHoje } from "@/lib/datas"
import { aplicarFiltroAtribuidosAMim } from "@/lib/estado/filtro-atribuidos"
import { useHabitos, todosOsDias } from "@/lib/estado/habitos"
import { colunasDoQuadro, numeroDoCartao, useKanban } from "@/lib/estado/kanban"
import { useNotas } from "@/lib/estado/notas"
import { abrirPainelKanban } from "@/lib/estado/paineis-kanban"
import { useTarefas } from "@/lib/estado/tarefas"
import { semAcento } from "@/lib/links-wiki"
import { textoDoQuadro } from "@/lib/quadro/modelo"
import { contarTags } from "@/lib/tags"
import { alternarTema } from "@/lib/theme"

// Paleta de comando (8.17, M10): Ctrl/⌘ K. Busca e cria a partir do mesmo campo.
// Prefixos: ">" ações, "#" tags. O texto digitado vira o título no grupo "Criar".

const usePaleta = create<{ aberta: boolean }>(() => ({ aberta: false }))
export const abrirPaleta = () => usePaleta.setState({ aberta: true })
export const alternarPaleta = () => usePaleta.setState({ aberta: !usePaleta.getState().aberta })
const fecharPaleta = () => usePaleta.setState({ aberta: false })

function resumir(conteudo: string) {
  return conteudo.replace(/[#>*`\-\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 90)
}

// Filtro sem acento: começo da palavra vale mais que meio do texto.
function filtrar(valor: string, busca: string, palavras?: string[]) {
  const termo = semAcento(busca.replace(/^[>#@]/, "").trim())
  if (!termo) return 1
  const alvo = semAcento([valor, ...(palavras ?? [])].join(" "))
  if (alvo.startsWith(termo) || alvo.includes(` ${termo}`)) return 1
  return alvo.includes(termo) ? 0.5 : 0
}

export function CommandPalette() {
  const aberta = usePaleta((estado) => estado.aberta)
  const [busca, setBusca] = useState("")

  return (
    <DialogPrimitive.Root
      open={aberta}
      onOpenChange={(aberto) => {
        usePaleta.setState({ aberta: aberto })
        if (!aberto) setBusca("")
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-(--z-palette) bg-black/60 transition-opacity duration-fast data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup
          aria-label="Buscar ou criar"
          className="paleta fixed left-1/2 z-(--z-palette) -translate-x-1/2 overflow-hidden rounded-xl bg-panel shadow-float outline-none transition-[opacity,translate,scale] duration-fast ease-out data-ending-style:translate-y-1 data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:translate-y-1.5 data-starting-style:scale-98 data-starting-style:opacity-0"
        >
          <DialogPrimitive.Title className="sr-only">Buscar ou criar</DialogPrimitive.Title>
          {aberta ? <ConteudoPaleta busca={busca} setBusca={setBusca} /> : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function ConteudoPaleta({ busca, setBusca }: { busca: string; setBusca: (valor: string) => void }) {
  const router = useRouter()
  const conta = useConta()
  const notas = useNotas((estado) => estado.notas)
  const livros = useNotas((estado) => estado.livros)
  const criarNota = useNotas((estado) => estado.criarNota)
  const criarLivro = useNotas((estado) => estado.criarLivro)
  const adicionarTarefa = useTarefas((estado) => estado.adicionarTarefa)
  const adicionarHabito = useHabitos((estado) => estado.adicionarHabito)
  const kanban = useKanban()
  const alternarMenu = useShell((estado) => estado.alternarRecolhido)

  const modo = busca.startsWith(">") ? "acoes" : busca.startsWith("#") ? "tags" : "tudo"
  const texto = busca.replace(/^[>#@]/, "").trim()
  const tags = contarTags(notas)
  const meuId = conta?.usuario.id ?? null

  const ir = (href: string) => {
    fecharPaleta()
    router.push(href)
  }
  const executar = (acao: () => void) => {
    fecharPaleta()
    acao()
  }

  const criarCartao = () => {
    const quadro = kanban.quadros.find((item) => item.id === kanban.quadroAtivoId) ?? kanban.quadros[0]
    const primeira = colunasDoQuadro(kanban.colunas, quadro?.id ?? null)[0]
    if (!primeira) return ir("/kanban")
    const id = kanban.adicionarCartao(primeira.id, texto)
    const numero = id ? numeroDoCartao(useKanban.getState(), id) : null
    ir(numero && quadro ? `/kanban?quadro=${quadro.id}&cartao=${numero}` : "/kanban")
  }

  return (
    <Command label="Buscar ou criar" filter={filtrar} loop className="paleta-corpo flex flex-col">
      <div className="flex h-14 items-center gap-3 border-b border-line px-4">
        <SearchIcon aria-hidden="true" className="size-4.5 shrink-0 text-ink-soft" />
        <Command.Input
          value={busca}
          onValueChange={setBusca}
          placeholder="Buscar ou criar"
          className="h-full flex-1 bg-transparent text-body text-paper outline-none placeholder:text-ink-muted"
        />
        <Kbd>Esc</Kbd>
      </div>
      <Command.List className="rolagem-fina min-h-0 flex-1 overflow-y-auto p-2">
        {/* No modo geral o grupo "Criar" está sempre lá (Enter cria a nota); o vazio só aparece em ">" e "#". */}
        {modo !== "tudo" ? <Command.Empty className="px-3 py-8 text-center text-ui text-ink-soft">Nada encontrado para “{texto}”.</Command.Empty> : null}

        {modo === "tudo" ? (
          <Grupo titulo="Ir para">
            {[ITEM_HOJE, ...ITENS_FAZER, ITEM_BIBLIOTECA, ...ITENS_BIBLIOTECA].map((item) => (
              <Item key={item.href} valor={`ir ${item.rotulo}`} icone={item.icone} aoEscolher={() => ir(item.href)} atalho={item.tecla ? `G ${item.tecla}` : undefined}>
                {item.rotulo}
              </Item>
            ))}
            <Item valor="ir minha conta" palavras={["perfil", "senha", "backup", "dados"]} icone={CircleUserRoundIcon} aoEscolher={() => ir("/conta")}>
              Minha conta
            </Item>
          </Grupo>
        ) : null}

        {modo === "tudo" && texto ? (
          <Grupo titulo="Criar" forcar>
            <Item valor={`criar nota ${texto}`} icone={FilePlusIcon} forcar aoEscolher={() => ir(`/notas/${criarNota({ titulo: texto }).id}`)}>
              Criar nota “{texto}”
            </Item>
            <Item valor={`criar tarefa ${texto}`} icone={ListPlusIcon} forcar aoEscolher={() => executar(() => adicionarTarefa({ titulo: texto, prazo: chaveHoje() }))}>
              Criar tarefa “{texto}”
            </Item>
            <Item valor={`criar habito ${texto}`} icone={RepeatIcon} forcar aoEscolher={() => executar(() => adicionarHabito({ nome: texto, icone: "feito", dias: todosOsDias }))}>
              Criar hábito “{texto}”
            </Item>
            <Item valor={`criar cartao ${texto}`} icone={SquarePlusIcon} forcar aoEscolher={criarCartao}>
              Criar cartão “{texto}”
            </Item>
            <Item valor={`criar caderno ${texto}`} icone={BookPlusIcon} forcar aoEscolher={() => ir(`/notas?livro=${criarLivro({ titulo: texto }).id}`)}>
              Criar caderno “{texto}”
            </Item>
          </Grupo>
        ) : null}

        {modo === "tudo" && texto ? (
          <>
            <Grupo titulo="Notas">
              {notas.map((nota) => {
                const corpo = nota.tipo === "quadro" ? textoDoQuadro(nota.conteudo) : nota.conteudo
                const caderno = livros.find((livro) => livro.id === nota.livroId)?.titulo ?? "Sem caderno"
                return (
                  <Item key={nota.id} valor={`nota ${nota.id} ${nota.titulo}`} palavras={[corpo.slice(0, 2000), caderno]} icone={FileTextIcon} aoEscolher={() => ir(`/notas/${nota.id}`)} detalhe={caderno}>
                    <span className="grid min-w-0">
                      <span className="truncate">{nota.titulo || "Sem título"}</span>
                      {corpo ? <span className="truncate text-small text-ink-muted">{resumir(corpo)}</span> : null}
                    </span>
                  </Item>
                )
              })}
            </Grupo>
            <Grupo titulo="Cadernos">
              {livros.map((livro) => (
                <Item key={livro.id} valor={`caderno ${livro.id} ${livro.titulo}`} icone={BookIcon} aoEscolher={() => ir(`/notas?livro=${livro.id}`)}>
                  {livro.titulo}
                </Item>
              ))}
            </Grupo>
            <Grupo titulo="Cartões">
              {kanban.cartoes
                .filter((cartao) => !cartao.arquivado)
                .map((cartao) => {
                  const numero = numeroDoCartao(kanban, cartao.id)
                  return (
                    <Item
                      key={cartao.id}
                      valor={`cartao ${cartao.id} ${numero ? `#${numero}` : ""} ${cartao.titulo}`}
                      palavras={[cartao.descricao ?? ""]}
                      icone={KanbanIcon}
                      aoEscolher={() => {
                        const quadroId = kanban.colunas.find((coluna) => coluna.id === cartao.colunaId)?.quadroId
                        if (quadroId) kanban.definirQuadroAtivo(quadroId)
                        ir(quadroId && numero ? `/kanban?quadro=${quadroId}&cartao=${numero}` : "/kanban")
                      }}
                    >
                      {numero ? <span className="font-mono text-code text-ink-muted">#{numero}</span> : null}
                      <span className="truncate">{cartao.titulo}</span>
                    </Item>
                  )
                })}
            </Grupo>
          </>
        ) : null}

        {modo === "tags" || (modo === "tudo" && texto) ? (
          <Grupo titulo="Tags">
            {tags.slice(0, modo === "tags" ? 50 : 12).map(({ tag, total }) => (
              <Item key={tag} valor={`tag ${tag}`} icone={HashIcon} aoEscolher={() => ir(`/tags?tag=${encodeURIComponent(tag)}`)} detalhe={`${total} ${total === 1 ? "nota" : "notas"}`}>
                #{tag}
              </Item>
            ))}
          </Grupo>
        ) : null}

        {modo !== "tags" ? (
          <Grupo titulo="Ações">
            <Item valor="acao alternar tema" palavras={["escuro", "claro"]} icone={SunMoonIcon} aoEscolher={() => executar(() => alternarTema())}>
              Alternar tema
            </Item>
            <Item valor="acao recolher menu" palavras={["sidebar", "menu lateral"]} icone={PanelLeftIcon} atalho="Mod \" aoEscolher={() => executar(alternarMenu)}>
              Recolher ou expandir o menu
            </Item>
            <Item valor="acao cartoes atribuidos a mim" palavras={["meus cartões", "responsável"]} icone={CheckSquareIcon} aoEscolher={() => executar(() => { aplicarFiltroAtribuidosAMim(meuId); router.push("/kanban") })}>
              Cartões atribuídos a mim
            </Item>
            <Item valor="acao equipes" palavras={["membros", "convite", "times"]} icone={UsersIcon} aoEscolher={() => executar(() => { abrirPainelKanban("equipes"); router.push("/kanban") })}>
              Equipes
            </Item>
            <Item valor="acao creditos" palavras={["sobre", "tecnologias"]} icone={InfoIcon} aoEscolher={() => ir("/creditos")}>
              Créditos
            </Item>
            {conta ? (
              <Item valor="acao sair" palavras={["logout", "sair da conta"]} icone={LogOutIcon} aoEscolher={() => executar(() => void conta.sair())}>
                Sair
              </Item>
            ) : null}
          </Grupo>
        ) : null}
      </Command.List>
      <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-micro text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <Kbd>Enter</Kbd> abrir
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>&gt;</Kbd> ações
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>#</Kbd> tags
        </span>
      </div>
    </Command>
  )
}

function Grupo({ titulo, children, forcar }: { titulo: string; children: React.ReactNode; forcar?: boolean }) {
  return (
    <Command.Group
      heading={titulo}
      forceMount={forcar}
      className="mb-1 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1.5 **:[[cmdk-group-heading]]:text-micro **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-ink-muted"
    >
      {children}
    </Command.Group>
  )
}

function Item({
  valor,
  palavras,
  icone: Icone,
  aoEscolher,
  atalho,
  detalhe,
  forcar,
  children,
}: {
  valor: string
  palavras?: string[]
  icone: LucideIcon
  aoEscolher: () => void
  atalho?: string
  detalhe?: string
  forcar?: boolean
  children: React.ReactNode
}) {
  const ativo = useCommandState((estado) => estado.value === valor)
  return (
    <Command.Item
      value={valor}
      keywords={palavras}
      onSelect={aoEscolher}
      forceMount={forcar}
      className="relative flex h-11 cursor-default items-center gap-3 rounded-sm px-3 text-ui text-ink outline-none select-none data-[selected=true]:text-paper"
    >
      {ativo ? <motion.span layoutId="paleta-ativa" transition={spring.snappy} className="absolute inset-0 rounded-sm bg-selected" /> : null}
      <Icone aria-hidden="true" className="relative size-4 shrink-0 text-ink-soft" />
      <span className="relative flex min-w-0 flex-1 items-center gap-2">{children}</span>
      {detalhe ? <span className="relative shrink-0 text-small text-ink-muted">{detalhe}</span> : null}
      {atalho ? <Kbd className="relative">{atalho}</Kbd> : null}
    </Command.Item>
  )
}
