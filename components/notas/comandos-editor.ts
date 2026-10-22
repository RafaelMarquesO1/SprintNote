// Rafael Marques - 20/10/2026
// Comandos do menu "/" dos editores. No editor em blocos, "tipo" diz em qual
// bloco o comando se transforma; no editor de Markdown, insere "antes" + "depois"
// e deixa o cursor entre os dois.

import {
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  LinkIcon,
  ListChecksIcon,
  MessageSquareWarningIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PilcrowIcon,
  QuoteIcon,
  TableIcon,
  type LucideIcon,
} from "lucide-react"

import type { TipoBloco } from "@/lib/blocos"
import { semAcento } from "@/lib/links-wiki"

export type ComandoEditor = {
  id: string
  rotulo: string
  descricao: string
  icone: LucideIcon
  palavrasChave: string[]
  // Atalho de Markdown equivalente, mostrado no menu.
  atalho?: string
  antes: string
  depois?: string
  // Blocos precisam começar no início da linha.
  bloco?: boolean
  tipo?: TipoBloco
  // Só aparece no editor em blocos.
  soBlocos?: boolean
}

const TABELA = "| Coluna 1 | Coluna 2 |\n| --- | --- |\n|  |  |"

export const comandosEditor: ComandoEditor[] = [
  { id: "texto", rotulo: "Texto", descricao: "Parágrafo comum", icone: PilcrowIcon, palavrasChave: ["texto", "paragrafo"], antes: "", tipo: "paragrafo", soBlocos: true },
  { id: "h1", rotulo: "Título 1", descricao: "Título grande", icone: Heading1Icon, palavrasChave: ["h1", "titulo"], atalho: "#", antes: "# ", bloco: true, tipo: "titulo1" },
  { id: "h2", rotulo: "Título 2", descricao: "Título médio", icone: Heading2Icon, palavrasChave: ["h2", "titulo", "subtitulo"], atalho: "##", antes: "## ", bloco: true, tipo: "titulo2" },
  { id: "h3", rotulo: "Título 3", descricao: "Título pequeno", icone: Heading3Icon, palavrasChave: ["h3", "titulo"], atalho: "###", antes: "### ", bloco: true, tipo: "titulo3" },
  { id: "lista", rotulo: "Lista", descricao: "Lista com marcadores", icone: ListIcon, palavrasChave: ["lista", "bullet", "marcadores"], atalho: "-", antes: "- ", bloco: true, tipo: "lista" },
  { id: "numerada", rotulo: "Lista numerada", descricao: "Lista com números", icone: ListOrderedIcon, palavrasChave: ["numerada", "ordenada"], atalho: "1.", antes: "1. ", bloco: true, tipo: "numerada" },
  { id: "tarefas", rotulo: "Lista de tarefas", descricao: "Checklist com caixas", icone: ListChecksIcon, palavrasChave: ["tarefa", "checklist", "todo"], atalho: "[]", antes: "- [ ] ", bloco: true, tipo: "tarefa" },
  { id: "citacao", rotulo: "Citação", descricao: "Destaque de um trecho", icone: QuoteIcon, palavrasChave: ["citacao", "quote"], atalho: ">", antes: "> ", bloco: true, tipo: "citacao" },
  { id: "destaque", rotulo: "Destaque", descricao: "Caixa colorida com ícone (info, dica, aviso…)", icone: MessageSquareWarningIcon, palavrasChave: ["destaque", "callout", "aviso", "dica", "info", "caixa"], antes: "> [!info] ", bloco: true, tipo: "destaque" },
  { id: "codigo", rotulo: "Bloco de código", descricao: "Código com formatação", icone: CodeIcon, palavrasChave: ["codigo", "code"], atalho: "```", antes: "```\n", depois: "\n```", bloco: true, tipo: "codigo" },
  { id: "tabela", rotulo: "Tabela", descricao: "Tabela de 2 colunas", icone: TableIcon, palavrasChave: ["tabela", "table"], antes: "| Coluna 1 | Coluna 2 |\n| --- | --- |\n| ", depois: " |  |", bloco: true, tipo: "tabela" },
  { id: "divisor", rotulo: "Divisor", descricao: "Linha horizontal", icone: MinusIcon, palavrasChave: ["divisor", "linha", "hr"], atalho: "---", antes: "---\n", bloco: true, tipo: "divisor" },
  { id: "link", rotulo: "Link para nota ou livro", descricao: "Conecta com [[ ]]", icone: LinkIcon, palavrasChave: ["link", "nota", "livro", "wiki", "conectar"], atalho: "[[", antes: "[[" },
]

export const textoInicialTabela = TABELA

export function filtrarComandos(consulta: string, editorBlocos = false) {
  const procurado = semAcento(consulta)
  return comandosEditor
    .filter((comando) => editorBlocos || !comando.soBlocos)
    .filter(
      (comando) =>
        !procurado ||
        [comando.rotulo, ...comando.palavrasChave].some((texto) => semAcento(texto).includes(procurado))
    )
}

export { semAcento }
