// Rafael Marques - 23/10/2026
// Comandos do menu "/" (como no Notion): o texto digitado depois da barra filtra a lista.
// Se o bloco onde a pessoa digitou já tem texto, o comando cria o bloco novo logo abaixo.

import type { ChainedCommands, Editor, Range } from "@tiptap/core"
import {
  CalendarIcon,
  CalendarPlusIcon,
  CalendarSearchIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  HashIcon,
  ImageIcon,
  InfoIcon,
  LightbulbIcon,
  LinkIcon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  OctagonAlertIcon,
  PilcrowIcon,
  QuoteIcon,
  StickyNoteIcon,
  TableIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react"

import { ganchosDo } from "@/components/notas/editor/ganchos"
import type { ItemSugestao } from "@/components/notas/editor/lista-sugestoes"
import { semAcento } from "@/lib/links-wiki"
import type { VarianteDestaque } from "@/lib/editor/markdown-documento"

export type ComandoBarra = {
  id: string
  rotulo: string
  descricao: string
  grupo: string
  palavras: string[]
  atalho?: string
  icone: LucideIcon
  // "bloco": vira um bloco (cria um novo abaixo se o atual tem texto). Os demais só inserem.
  bloco?: boolean
  aplicar: (cadeia: ChainedCommands, editor: Editor) => ChainedCommands | void
}

// Apaga o "/texto" e deixa o cursor num bloco vazio onde o comando possa agir.
function prepararBloco(editor: Editor, range: Range) {
  editor.chain().focus().deleteRange(range).run()
  const { $from } = editor.state.selection
  if ($from.parent.content.size > 0) {
    const fim = $from.after(1)
    editor.chain().insertContentAt(fim, { type: "paragraph" }).focus(fim + 1).run()
  }
}

const destaque = (variante: VarianteDestaque, rotulo: string, descricao: string, icone: LucideIcon, palavras: string[]): ComandoBarra => ({
  id: `destaque-${variante}`,
  rotulo,
  descricao,
  grupo: "Destaques",
  palavras: ["destaque", "callout", "caixa", ...palavras],
  icone,
  bloco: true,
  aplicar: (cadeia) => cadeia.wrapIn("destaque", { variante }),
})

export const dataDeHoje = () => new Date().toLocaleDateString("pt-BR")

export const comandosBarra: ComandoBarra[] = [
  { id: "texto", rotulo: "Texto", descricao: "Parágrafo comum", grupo: "Básico", palavras: ["texto", "paragrafo", "normal"], icone: PilcrowIcon, bloco: true, aplicar: (c) => c.setParagraph() },
  { id: "h1", rotulo: "Título 1", descricao: "Título grande", grupo: "Básico", palavras: ["h1", "titulo", "cabecalho"], atalho: "#", icone: Heading1Icon, bloco: true, aplicar: (c) => c.setHeading({ level: 1 }) },
  { id: "h2", rotulo: "Título 2", descricao: "Título médio", grupo: "Básico", palavras: ["h2", "titulo", "subtitulo"], atalho: "##", icone: Heading2Icon, bloco: true, aplicar: (c) => c.setHeading({ level: 2 }) },
  { id: "h3", rotulo: "Título 3", descricao: "Título pequeno", grupo: "Básico", palavras: ["h3", "titulo"], atalho: "###", icone: Heading3Icon, bloco: true, aplicar: (c) => c.setHeading({ level: 3 }) },
  { id: "lista", rotulo: "Lista com marcadores", descricao: "Lista simples", grupo: "Básico", palavras: ["lista", "bullet", "marcadores", "topicos"], atalho: "-", icone: ListIcon, bloco: true, aplicar: (c) => c.toggleBulletList() },
  { id: "numerada", rotulo: "Lista numerada", descricao: "Lista com números", grupo: "Básico", palavras: ["numerada", "ordenada", "numeros"], atalho: "1.", icone: ListOrderedIcon, bloco: true, aplicar: (c) => c.toggleOrderedList() },
  { id: "tarefas", rotulo: "Lista de tarefas", descricao: "Checklist com caixas de marcar", grupo: "Básico", palavras: ["tarefa", "checklist", "todo", "afazer"], atalho: "[]", icone: ListChecksIcon, bloco: true, aplicar: (c) => c.toggleTaskList() },
  { id: "citacao", rotulo: "Citação", descricao: "Destaque de um trecho", grupo: "Básico", palavras: ["citacao", "quote", "aspas"], atalho: ">", icone: QuoteIcon, bloco: true, aplicar: (c) => c.toggleBlockquote() },
  { id: "divisor", rotulo: "Divisor", descricao: "Linha para separar partes", grupo: "Básico", palavras: ["divisor", "linha", "separador", "hr"], atalho: "---", icone: MinusIcon, bloco: true, aplicar: (c) => c.setHorizontalRule() },

  destaque("info", "Destaque: informação", "Caixa azul com ícone", InfoIcon, ["info", "informacao", "azul"]),
  destaque("dica", "Destaque: dica", "Caixa verde com ícone", LightbulbIcon, ["dica", "tip", "verde"]),
  destaque("aviso", "Destaque: aviso", "Caixa amarela com ícone", TriangleAlertIcon, ["aviso", "atencao", "amarelo"]),
  destaque("perigo", "Destaque: perigo", "Caixa vermelha com ícone", OctagonAlertIcon, ["perigo", "erro", "vermelho"]),
  destaque("nota", "Destaque: nota", "Caixa cinza com ícone", StickyNoteIcon, ["nota", "cinza"]),

  { id: "imagem", rotulo: "Imagem", descricao: "Envie um arquivo ou use um endereço", grupo: "Mídia e dados", palavras: ["imagem", "foto", "figura", "image", "upload"], icone: ImageIcon, bloco: true, aplicar: (c, editor) => { ganchosDo(editor).abrirImagem?.() ; return c } },
  { id: "tabela", rotulo: "Tabela", descricao: "Tabela 3×3 para editar na hora", grupo: "Mídia e dados", palavras: ["tabela", "table", "grade", "planilha"], icone: TableIcon, bloco: true, aplicar: (c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }) },
  { id: "codigo", rotulo: "Bloco de código", descricao: "Código com cores (a linguagem é detectada)", grupo: "Mídia e dados", palavras: ["codigo", "code", "programacao"], atalho: "```", icone: CodeIcon, bloco: true, aplicar: (c) => c.setCodeBlock() },

  { id: "link-nota", rotulo: "Link para nota ou livro", descricao: "Conecta esta nota com outra", grupo: "Links e datas", palavras: ["link", "nota", "livro", "wiki", "conectar", "mencionar"], atalho: "[[", icone: LinkIcon, aplicar: (c) => c.insertContent("[[") },
  { id: "tag", rotulo: "Tag", descricao: "Organize com #assunto", grupo: "Links e datas", palavras: ["tag", "etiqueta", "hashtag", "assunto"], atalho: "#", icone: HashIcon, aplicar: (c) => c.insertContent("#") },
  { id: "data-hoje", rotulo: "Data de hoje", descricao: "Insere a data de hoje no texto", grupo: "Links e datas", palavras: ["data", "hoje", "dia", "calendario"], icone: CalendarIcon, aplicar: (c) => c.insertContent(`${dataDeHoje()} `) },
  { id: "prazo-hoje", rotulo: "Prazo: hoje", descricao: "@hoje — aparece na lista de tarefas", grupo: "Links e datas", palavras: ["prazo", "hoje", "vencimento", "tarefa"], atalho: "@hoje", icone: CalendarPlusIcon, aplicar: (c) => c.insertContent("@hoje ") },
  // Rafael Marques - 27/10/2026: prazo com data escolhida no calendário.
  { id: "prazo-data", rotulo: "Prazo: escolher data…", descricao: "Calendário para qualquer dia (também ao digitar @)", grupo: "Links e datas", palavras: ["prazo", "data", "dia", "calendario", "vencimento", "tarefa", "personalizada"], icone: CalendarSearchIcon, aplicar: (c, editor) => { ganchosDo(editor).abrirPrazo?.() ; return c } },
  { id: "prazo-amanha", rotulo: "Prazo: amanhã", descricao: "@amanhã — aparece na lista de tarefas", grupo: "Links e datas", palavras: ["prazo", "amanha", "vencimento", "tarefa"], atalho: "@amanhã", icone: CalendarPlusIcon, aplicar: (c) => c.insertContent("@amanhã ") },
]

export function itensDeComando(consulta: string): ItemSugestao[] {
  const procurado = semAcento(consulta.trim())
  return comandosBarra
    .filter((comando) => !procurado || [comando.rotulo, ...comando.palavras].some((texto) => semAcento(texto).includes(procurado)))
    .map((comando) => ({
      chave: comando.id,
      rotulo: comando.rotulo,
      descricao: comando.descricao,
      grupo: comando.grupo,
      atalho: comando.atalho,
      icone: <comando.icone className="size-4" />,
      executar: (editor, range) => {
        if (comando.bloco) prepararBloco(editor, range)
        else editor.chain().focus().deleteRange(range).run()
        const cadeia = editor.chain().focus()
        const resultado = comando.aplicar(cadeia, editor)
        ;(resultado ?? cadeia).run()
      },
    }))
}

// Usado também pela alça do bloco ("Transformar em") e pela barra flutuante.
export const comandoPorId = (id: string) => comandosBarra.find((comando) => comando.id === id)
