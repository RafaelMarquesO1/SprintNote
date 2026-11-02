"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import { Suspense } from "react"
import { BookPlusIcon, FilePlusIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, PlusIcon, SearchIcon, WorkflowIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { LogoMark, Wordmark } from "@/components/brand/logo"
import { ArvoreBiblioteca } from "@/components/biblioteca/arvore"
import { enderecoDaSelecao, selecaoDaUrl } from "@/components/biblioteca/selecao"
import { spring } from "@/components/motion/presets"
import { abrirPaleta } from "@/components/shell/command-palette"
import { useContadores } from "@/components/shell/contadores"
import { useShell } from "@/components/shell/estado"
import { MenuAvatar } from "@/components/shell/menu-avatar"
import { ITEM_HOJE, ITENS_BIBLIOTECA, ITENS_FAZER, itemAtivo, type ItemNav } from "@/components/shell/navegacao"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Kbd } from "@/components/ui/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useHidratado } from "@/hooks/use-hidratado"
import { useNotas } from "@/lib/estado/notas"

// Menu lateral (7.1 / 7.2): 248px, ou 64px recolhido (Ctrl \, M12). Item ativo: fundo "selected" que desliza (M2),
// ícone Brasa, texto paper 600, aria-current="page".
export function Sidebar() {
  const recolhido = useShell((estado) => estado.recolhido)
  const alternar = useShell((estado) => estado.alternarRecolhido)

  return (
    <motion.aside
      initial={false}
      animate={{ width: recolhido ? 64 : 248 }}
      transition={spring.layout}
      className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-night md:flex"
    >
      <div className={cn("flex h-topbar shrink-0 items-center gap-2.5 px-4", recolhido && "justify-center px-0")}>
        <Link href="/" aria-label="SprintNote, ir para Hoje" className="flex min-w-0 items-center gap-2.5 rounded-sm">
          <LogoMark size={28} />
          {recolhido ? null : <Wordmark />}
        </Link>
      </div>

      <div className={cn("px-3 pt-2", recolhido && "px-2")}>
        <BotaoBusca recolhido={recolhido} />
      </div>

      <nav aria-label="Principal" className="flex min-h-0 flex-1 flex-col pt-4">
        <Suspense fallback={null}>
          <Navegacao recolhido={recolhido} />
        </Suspense>
      </nav>

      <div className={cn("shrink-0 space-y-1 border-t border-line p-3", recolhido && "px-2")}>
        <MenuAvatar recolhido={recolhido} />
        <Tooltip>
          <TooltipTrigger
            onClick={alternar}
            aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
            className={cn("flex h-control-sm w-full items-center gap-2 rounded-sm px-2 text-small text-ink-muted hover:bg-raised hover:text-paper", recolhido && "justify-center px-0")}
          >
            {recolhido ? <PanelLeftOpenIcon className="size-4" /> : <PanelLeftCloseIcon className="size-4" />}
            {recolhido ? null : (
              <>
                Recolher menu <Kbd className="ml-auto">Mod \</Kbd>
              </>
            )}
          </TooltipTrigger>
          {recolhido ? <TooltipContent side="right">Expandir menu</TooltipContent> : null}
        </Tooltip>
      </div>
    </motion.aside>
  )
}

function BotaoBusca({ recolhido }: { recolhido: boolean }) {
  if (recolhido) {
    return (
      <Tooltip>
        <TooltipTrigger onClick={abrirPaleta} aria-label="Buscar ou criar" className="flex size-control w-full items-center justify-center rounded-sm border border-line-strong text-ink-soft hover:bg-raised hover:text-paper">
          <SearchIcon className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="right">Buscar ou criar</TooltipContent>
      </Tooltip>
    )
  }
  return (
    <button
      type="button"
      onClick={abrirPaleta}
      className="flex h-control w-full items-center gap-2.5 rounded-md border border-line-strong bg-panel px-3 text-ui text-ink-soft hover:border-ink-muted hover:text-paper"
    >
      <SearchIcon className="size-4" />
      <span className="flex-1 text-left">Buscar ou criar</span>
      <Kbd>Mod K</Kbd>
    </button>
  )
}

function Navegacao({ recolhido }: { recolhido: boolean }) {
  const caminho = usePathname()
  const contadores = useContadores()

  return (
    <>
      <ul className={cn("space-y-0.5 px-3", recolhido && "px-2")}>
        <LinkNav item={ITEM_HOJE} ativo={itemAtivo(caminho, ITEM_HOJE.href)} recolhido={recolhido} />
      </ul>

      <Grupo titulo="Fazer" recolhido={recolhido}>
        {ITENS_FAZER.map((item) => (
          <LinkNav key={item.href} item={item} ativo={itemAtivo(caminho, item.href)} recolhido={recolhido} contagem={contadores[item.href]} />
        ))}
      </Grupo>

      <Grupo titulo="Biblioteca" recolhido={recolhido} acao={recolhido ? null : <CriarNaBiblioteca />} href="/notas" ativo={caminho === "/notas"}>
        {recolhido ? null : (
          <li className="min-h-0">
            <Suspense fallback={null}>
              <ArvoreLateral />
            </Suspense>
          </li>
        )}
        {recolhido ? null : <li aria-hidden="true" className="mx-2 my-2 h-px bg-line" />}
        {ITENS_BIBLIOTECA.map((item) => (
          <LinkNav key={item.href} item={item} ativo={itemAtivo(caminho, item.href)} recolhido={recolhido} />
        ))}
      </Grupo>
    </>
  )
}

function Grupo({
  titulo,
  recolhido,
  acao,
  href,
  ativo,
  children,
}: {
  titulo: string
  recolhido: boolean
  acao?: React.ReactNode
  href?: string
  ativo?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn("mt-5 min-h-0", titulo === "Biblioteca" && "flex flex-1 flex-col")}>
      {recolhido ? (
        <div aria-hidden="true" className="mx-4 mb-2 h-px bg-line" />
      ) : (
        <div className="mb-1 flex h-7 items-center justify-between px-5">
          {href ? (
            <Link href={href} aria-current={ativo ? "page" : undefined} className={cn("rounded-xs text-micro font-medium hover:text-paper", ativo ? "text-paper" : "text-ink-muted")}>
              {titulo}
            </Link>
          ) : (
            <span className="text-micro font-medium text-ink-muted">{titulo}</span>
          )}
          {acao}
        </div>
      )}
      <ul className={cn("space-y-0.5 px-3", recolhido && "px-2", titulo === "Biblioteca" && "rolagem-fina min-h-0 flex-1 overflow-y-auto pb-3")}>{children}</ul>
    </div>
  )
}

function LinkNav({ item, ativo, recolhido, contagem }: { item: ItemNav; ativo: boolean; recolhido: boolean; contagem?: string | null }) {
  const Icone = item.icone
  const conteudo = (
    <Link
      href={item.href}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-3 rounded-sm px-2.5 text-ui outline-none",
        ativo ? "font-semibold text-paper" : "font-medium text-ink-soft hover:bg-raised hover:text-paper",
        recolhido && "justify-center px-0"
      )}
    >
      {ativo ? <motion.span layoutId="nav-active" transition={spring.snappy} className="absolute inset-0 rounded-sm bg-selected" /> : null}
      <Icone aria-hidden="true" className={cn("relative size-4.5 shrink-0", ativo ? "text-ember" : "text-ink-soft")} />
      {recolhido ? <span className="sr-only">{item.rotulo}</span> : <span className="relative flex-1 truncate">{item.rotulo}</span>}
      {!recolhido && contagem ? (
        <span className="relative text-micro text-ink-muted tabular-nums" aria-label={`${contagem} em aberto`}>
          {contagem}
        </span>
      ) : null}
    </Link>
  )
  if (!recolhido) return <li>{conteudo}</li>
  return (
    <li>
      <Tooltip>
        <TooltipTrigger render={conteudo} />
        <TooltipContent side="right">{item.rotulo}</TooltipContent>
      </Tooltip>
    </li>
  )
}

function CriarNaBiblioteca() {
  const router = useRouter()
  const criarNota = useNotas((estado) => estado.criarNota)
  const criarLivro = useNotas((estado) => estado.criarLivro)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Criar na biblioteca" className="flex size-7 items-center justify-center rounded-xs text-ink-muted hover:bg-raised hover:text-paper data-popup-open:bg-raised">
        <PlusIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => router.push(enderecoDaSelecao({ tipo: "livro", id: criarLivro().id }))}>
          <BookPlusIcon /> Novo caderno
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/notas/${criarNota().id}`)}>
          <FilePlusIcon /> Nova nota
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/notas/${criarNota({ titulo: "Novo quadro", tipo: "quadro" }).id}`)}>
          <WorkflowIcon /> Novo quadro livre
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// A mesma árvore do explorador (/notas), no modo lateral.
function ArvoreLateral() {
  const hidratado = useHidratado()
  const router = useRouter()
  const caminho = usePathname()
  const parametros = useSearchParams()
  const [, rota, idRota] = caminho.split("/")
  const notaAtiva = rota === "notas" ? (idRota ?? null) : null
  const selecao = caminho === "/notas" ? selecaoDaUrl(parametros) : { tipo: "livro" as const, id: "" }
  if (!hidratado) return null
  return (
    <div className="text-ink-soft">
      <ArvoreBiblioteca modo="lateral" notaAtiva={notaAtiva} selecao={selecao} aoSelecionar={(nova) => router.push(enderecoDaSelecao(nova))} />
    </div>
  )
}
