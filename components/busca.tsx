"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { create } from "zustand"
import {
  InfoIcon,
  BookPlusIcon,
  CircleUserRoundIcon,
  HashIcon,
  CalendarClockIcon,
  CircleCheckIcon,
  CircleIcon,
  FilePlusIcon,
  WorkflowIcon,
  HouseIcon,
  KanbanIcon,
  SquareCheckBigIcon,
  UsersIcon,
  ListTodoIcon,
  NetworkIcon,
  RepeatIcon,
  SearchIcon,
  SquareCheckIcon,
  SunMoonIcon,
} from "lucide-react"

import { useConta } from "@/components/conta/portao-conta"
import { Icone } from "@/components/icone"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { useHabitos } from "@/lib/estado/habitos"
import { localDoCartao, useKanban } from "@/lib/estado/kanban"
import { aplicarFiltroAtribuidosAMim } from "@/lib/estado/filtro-atribuidos"
import { abrirPainelKanban } from "@/lib/estado/paineis-kanban"
import { useTarefas } from "@/lib/estado/tarefas"
import { contarTags } from "@/lib/tags"
import { useNotas } from "@/lib/estado/notas"
import { textoDoQuadro } from "@/lib/quadro/modelo"
import { alternarTema } from "@/lib/theme"

// Rafael Marques - 20/10/2026
// Estado de aberto/fechado da busca, para qualquer botão poder abri-la.
const useBuscaAberta = create<{ aberta: boolean }>(() => ({ aberta: false }))

export function abrirBusca() {
  useBuscaAberta.setState({ aberta: true })
}

function definirAberta(aberta: boolean) {
  useBuscaAberta.setState({ aberta })
}

// Botão do cabeçalho que abre a busca.
export function BotaoBusca() {
  return (
    <Button variant="outline" size="sm" onClick={abrirBusca} className="gap-2 text-muted-foreground">
      <SearchIcon />
      <span className="max-sm:hidden">Buscar</span>
      <Kbd className="max-sm:hidden">Ctrl K</Kbd>
    </Button>
  )
}

// Resumo do conteúdo sem a sintaxe Markdown, para aparecer nos resultados.
function resumir(conteudo: string) {
  return conteudo
    .replace(/[#>*`\-\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80)
}

// Rafael Marques - 20/10/2026
// Busca global (Ctrl + K): notas, tarefas, hábitos, cartões do Kanban e ações rápidas.
export function DialogoBusca() {
  const router = useRouter()
  const aberta = useBuscaAberta((estado) => estado.aberta)
  const notas = useNotas((estado) => estado.notas)
  const livros = useNotas((estado) => estado.livros)
  const criarNota = useNotas((estado) => estado.criarNota)
  const criarLivro = useNotas((estado) => estado.criarLivro)
  const tags = useMemo(() => (aberta ? contarTags(notas) : []), [aberta, notas])
  const cartoes = useKanban((estado) => estado.cartoes)
  // Rafael Marques - 23/10/2026: o atalho "atribuídos a mim" precisa saber quem sou eu.
  const meuId = useConta()?.usuario.id ?? null
  const colunasKanban = useKanban((estado) => estado.colunas)
  const quadros = useKanban((estado) => estado.quadros)
  const definirQuadroAtivo = useKanban((estado) => estado.definirQuadroAtivo)
  const tarefas = useTarefas((estado) => estado.tarefas)
  const alternarConcluida = useTarefas((estado) => estado.alternarConcluida)
  const habitos = useHabitos((estado) => estado.habitos)

  useEffect(() => {
    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key.toLowerCase() === "k" && (evento.ctrlKey || evento.metaKey)) {
        evento.preventDefault()
        definirAberta(!useBuscaAberta.getState().aberta)
      }
    }
    window.addEventListener("keydown", aoPressionarTecla)
    return () => window.removeEventListener("keydown", aoPressionarTecla)
  }, [])

  function executar(acao: () => void) {
    definirAberta(false)
    acao()
  }

  return (
    <CommandDialog
      open={aberta}
      onOpenChange={definirAberta}
      title="Buscar"
      description="Busque notas, tarefas, hábitos, cartões e ações"
      className="sm:max-w-lg"
    >
      <Command>
        <CommandInput placeholder="Buscar livros, notas, tarefas, hábitos ou ações..." />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>

          {livros.length > 0 && (
            <CommandGroup heading="Livros">
              {livros.map((livro) => (
                <CommandItem
                  key={livro.id}
                  value={`livro-${livro.id}`}
                  keywords={[livro.titulo, livro.descricao]}
                  onSelect={() => executar(() => router.push(`/livros/${livro.id}`))}
                >
                  <Icone nome={livro.icone} />
                  <span className="truncate font-medium">{livro.titulo}</span>
                  <CommandShortcut className="tracking-normal">
                    {notas.filter((nota) => nota.livroId === livro.id).length} nota(s)
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {tags.length > 0 && (
            <CommandGroup heading="Tags">
              {tags.slice(0, 15).map(({ tag, total }) => (
                <CommandItem
                  key={tag}
                  value={`tag-${tag}`}
                  keywords={[`#${tag}`, tag]}
                  onSelect={() => executar(() => router.push(`/tags?tag=${encodeURIComponent(tag)}`))}
                >
                  <HashIcon className="text-muted-foreground" />
                  <span>{tag}</span>
                  <CommandShortcut className="tracking-normal">{total} nota(s)</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {notas.length > 0 && (
            <CommandGroup heading="Notas">
              {notas.map((nota) => (
                <CommandItem
                  key={nota.id}
                  value={`nota-${nota.id}`}
                  keywords={[nota.titulo, nota.tipo === "quadro" ? textoDoQuadro(nota.conteudo) : nota.conteudo, livros.find((livro) => livro.id === nota.livroId)?.titulo ?? ""]}
                  onSelect={() => executar(() => router.push(`/notas/${nota.id}`))}
                >
                  <Icone nome={nota.icone} className="text-muted-foreground" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">
                      {nota.titulo}
                      <span className="text-xs text-muted-foreground">
                        {" "}· {livros.find((livro) => livro.id === nota.livroId)?.titulo ?? "Nota solta"}
                      </span>
                    </span>
                    {(nota.tipo === "quadro" ? textoDoQuadro(nota.conteudo) : nota.conteudo) && (
                      <span className="truncate text-xs text-muted-foreground">
                        {resumir(nota.tipo === "quadro" ? textoDoQuadro(nota.conteudo) : nota.conteudo)}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {tarefas.length > 0 && (
            <CommandGroup heading="Tarefas">
              {tarefas.map((tarefa) => (
                <CommandItem
                  key={tarefa.id}
                  value={`tarefa-${tarefa.id}`}
                  keywords={[tarefa.titulo, tarefa.descricao, tarefa.lista]}
                  onSelect={() => executar(() => alternarConcluida(tarefa.id))}
                >
                  {tarefa.concluida ? <CircleCheckIcon /> : <CircleIcon />}
                  <span className={tarefa.concluida ? "truncate text-muted-foreground line-through" : "truncate"}>
                    {tarefa.titulo}
                  </span>
                  <CommandShortcut className="tracking-normal">
                    {tarefa.concluida ? "reabrir" : "concluir"}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {habitos.length > 0 && (
            <CommandGroup heading="Hábitos">
              {habitos.map((habito) => (
                <CommandItem
                  key={habito.id}
                  value={`habito-${habito.id}`}
                  keywords={[habito.nome]}
                  onSelect={() => executar(() => router.push("/habitos"))}
                >
                  <Icone nome={habito.icone} className="text-muted-foreground" />
                  <span className="truncate">{habito.nome}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {cartoes.length > 0 && (
            <CommandGroup heading="Cartões do Kanban">
              {/* Rafael Marques - 23/10/2026: sem cartões arquivados */}
              {cartoes.filter((cartao) => !cartao.arquivado).map((cartao) => (
                <CommandItem
                  key={cartao.id}
                  value={`cartao-${cartao.id}`}
                  keywords={[cartao.titulo, cartao.descricao]}
                  onSelect={() =>
                    executar(() => {
                      const quadroId = colunasKanban.find((coluna) => coluna.id === cartao.colunaId)?.quadroId
                      if (quadroId) definirQuadroAtivo(quadroId)
                      router.push("/kanban")
                    })
                  }
                >
                  <SquareCheckIcon />
                  <span className="truncate">{cartao.titulo}</span>
                  <CommandShortcut className="tracking-normal">
                    {localDoCartao(cartao, colunasKanban, quadros)}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />
          <CommandGroup heading="Ações">
            <CommandItem
              value="acao-nova-nota"
              keywords={["nova nota", "criar"]}
              onSelect={() => executar(() => router.push(`/notas/${criarNota().id}`))}
            >
              <FilePlusIcon />
              Nova nota solta
            </CommandItem>
            <CommandItem
              value="acao-novo-quadro"
              keywords={["quadro", "canvas", "diagrama", "fluxograma", "mapa mental", "criar"]}
              onSelect={() => executar(() => router.push(`/notas/${criarNota({ titulo: "Novo quadro", tipo: "quadro" }).id}`))}
            >
              <WorkflowIcon />
              Novo quadro (formas e setas)
            </CommandItem>
            <CommandItem value="acao-conta" keywords={["conta", "perfil", "senha", "backup", "exportar", "importar", "dados", "privacidade"]} onSelect={() => executar(() => router.push("/conta"))}>
              <CircleUserRoundIcon />
              Minha conta
            </CommandItem>
            <CommandItem
              value="acao-novo-livro"
              keywords={["novo livro", "criar livro", "caderno"]}
              onSelect={() => executar(() => router.push(`/livros/${criarLivro().id}`))}
            >
              <BookPlusIcon />
              Novo livro
            </CommandItem>
            <CommandItem value="acao-grafo" keywords={["grafo", "conexões", "mapa", "obsidian"]} onSelect={() => executar(() => router.push("/grafo"))}>
              <NetworkIcon />
              Abrir o grafo de conexões
            </CommandItem>
            <CommandItem value="acao-inicio" keywords={["início", "home"]} onSelect={() => executar(() => router.push("/"))}>
              <HouseIcon />
              Ir para o início
            </CommandItem>
            <CommandItem value="acao-tarefas" keywords={["tarefas", "to-do", "afazeres"]} onSelect={() => executar(() => router.push("/tarefas"))}>
              <ListTodoIcon />
              Abrir Tarefas
            </CommandItem>
            <CommandItem value="acao-habitos" keywords={["hábitos", "habitos"]} onSelect={() => executar(() => router.push("/habitos"))}>
              <RepeatIcon />
              Abrir Hábitos
            </CommandItem>
            <CommandItem value="acao-rotina" keywords={["rotina", "agenda", "horários"]} onSelect={() => executar(() => router.push("/rotina"))}>
              <CalendarClockIcon />
              Abrir Rotina
            </CommandItem>
            <CommandItem value="acao-kanban" keywords={["kanban", "quadro"]} onSelect={() => executar(() => router.push("/kanban"))}>
              <KanbanIcon />
              Abrir o Kanban
            </CommandItem>
            {/* Rafael Marques - 23/10/2026: equipes */}
            <CommandItem value="acao-meus-cartoes" keywords={["meus cartões", "atribuídos a mim", "responsável", "equipe", "filtro"]} onSelect={() => executar(() => { aplicarFiltroAtribuidosAMim(meuId); router.push("/kanban") })}>
              <SquareCheckBigIcon />
              Kanban: cartões atribuídos a mim
            </CommandItem>
            <CommandItem value="acao-equipes" keywords={["equipes", "times", "convite", "membros"]} onSelect={() => executar(() => { abrirPainelKanban("equipes"); router.push("/kanban") })}>
              <UsersIcon />
              Kanban: equipes
            </CommandItem>
            <CommandItem value="acao-creditos" keywords={["créditos", "creditos", "sobre", "tecnologias"]} onSelect={() => executar(() => router.push("/creditos"))}>
              <InfoIcon />
              Abrir os créditos
            </CommandItem>
            <CommandItem value="acao-tema" keywords={["tema", "escuro", "claro"]} onSelect={() => executar(alternarTema)}>
              <SunMoonIcon />
              Alternar tema
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
