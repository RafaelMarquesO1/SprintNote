// Rafael Marques - 23/10/2026
// Menus de sugestão do editor: "/" (blocos), "[[" (notas e livros), "#" (tags já usadas) e "@" (prazos).

import type { Editor, Range } from "@tiptap/core"
import { CalendarIcon, CalendarSearchIcon, FilePlusIcon, HashIcon, KanbanIcon } from "lucide-react"
import { buscarCartoesCitaveis } from "@/components/notas/editor/extensoes/citacao-cartao"

import { Icone } from "@/components/icone"
import { itensDeComando } from "@/components/notas/editor/comandos-barra"
import { ganchosDo } from "@/components/notas/editor/ganchos"
import { criarSugestao } from "@/components/notas/editor/sugestao"
import { useNotas } from "@/lib/estado/notas"
import { dadosNovaNota, sugerirLinks } from "@/lib/links-wiki"
import { contarTags } from "@/lib/tags"
import { chaveHoje } from "@/lib/datas"
import { interpretarPrazo, rotuloPrazo } from "@/lib/tarefas-notas"

export const SugestaoBarra = criarSugestao({
  nome: "barra",
  char: "/",
  itens: (consulta) => itensDeComando(consulta),
})

export const SugestaoLinks = criarSugestao({
  nome: "links",
  char: "[[",
  titulo: "Linkar nota, livro ou cartão",
  allowSpaces: true,
  allowedPrefixes: null,
  itens: (consulta, editor) => {
    const { notas, livros, criarNota } = useNotas.getState()
    const { notaId, livroId } = ganchosDo(editor)
    // Rafael Marques - 29/10/2026: cartões do Kanban também podem ser citados.
    const cartoes = buscarCartoesCitaveis(consulta, consulta.trim() ? 5 : 3).map((cartao) => ({
      chave: `cartao-${cartao.id}`,
      rotulo: `#${cartao.numero} ${cartao.titulo}`,
      descricao: `Cartão · ${cartao.local}`,
      icone: <KanbanIcon className="size-4" />,
      executar: (editorAtual: Editor, range: Range) => {
        editorAtual
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent([
            { type: "text", text: `#${cartao.numero} ${cartao.titulo}`, marks: [{ type: "link", attrs: { href: cartao.href } }] },
            { type: "text", text: " " },
          ])
          .run()
      },
    }))
    const deNotas = sugerirLinks({ notas, livros }, consulta, { notaId, livroId }).map((sugestao) => ({
      chave: sugestao.chave,
      rotulo: sugestao.rotulo,
      descricao: sugestao.detalhe,
      icone: sugestao.criar ? <FilePlusIcon className="size-4" /> : <Icone nome={sugestao.icone} className="size-4" />,
      executar: (editorAtual: Editor, range: Range) => {
        // Escolheu "Criar nota": a nota nasce agora e o link já aponta para ela.
        if (sugestao.criar) criarNota(dadosNovaNota(sugestao.alvo, { notas, livros }, livroId))
        editorAtual
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent([{ type: "wikiLink", attrs: { alvo: sugestao.alvo, rotulo: null } }, { type: "text", text: " " }])
          .run()
      },
    }))
    return [...deNotas, ...cartoes]
  },
})

export const SugestaoTags = criarSugestao({
  nome: "tags",
  char: "#",
  titulo: "Tags usadas",
  itens: (consulta) => {
    const procurada = consulta.toLowerCase()
    // Sem letras ainda (ex.: "# " de título): não mostra nada.
    if (!procurada) return []
    return contarTags(useNotas.getState().notas)
      .filter(({ tag }) => tag.includes(procurada) && tag !== procurada)
      .slice(0, 6)
      .map(({ tag, total }) => ({
        chave: `tag-${tag}`,
        rotulo: `#${tag}`,
        descricao: `${total} nota(s)`,
        icone: <HashIcon className="size-4" />,
        executar: (editor, range) => {
          editor.chain().focus().deleteRange(range).insertContent(`#${tag} `).run()
        },
      }))
  },
})

// Rafael Marques - 27/10/2026
// "@": sugere prazos (hoje, amanhã, dias da semana), entende datas digitadas (@25/11) e abre o
// calendário em "Escolher data…". Só depois de espaço ou no começo, então e-mails não disparam.
const prazosRapidos = [
  { token: "hoje", rotulo: "Hoje" },
  { token: "amanhã", rotulo: "Amanhã" },
  { token: "seg", rotulo: "Segunda" },
  { token: "ter", rotulo: "Terça" },
  { token: "qua", rotulo: "Quarta" },
  { token: "qui", rotulo: "Quinta" },
  { token: "sex", rotulo: "Sexta" },
  { token: "sáb", rotulo: "Sábado" },
  { token: "dom", rotulo: "Domingo" },
]
const semAcentos = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

export const SugestaoPrazos = criarSugestao({
  nome: "prazos",
  char: "@",
  titulo: "Prazo",
  itens: (consulta) => {
    const hoje = chaveHoje()
    const procurado = semAcentos(consulta.trim())
    const itens = prazosRapidos
      .filter((prazo) => !procurado || semAcentos(prazo.rotulo).startsWith(procurado) || semAcentos(prazo.token).startsWith(procurado))
      .map((prazo) => {
        const data = interpretarPrazo(prazo.token, hoje)
        return {
          chave: `prazo-${prazo.token}`,
          rotulo: prazo.rotulo,
          descricao: data ? rotuloPrazo(data, hoje) : undefined,
          icone: <CalendarIcon className="size-4" />,
          executar: (editorAtual: Editor, range: Range) => {
            editorAtual.chain().focus().deleteRange(range).insertContent(`@${prazo.token} `).run()
          },
        }
      })
    // Data digitada à mão (ex.: @25/11 ou @25/11/2026).
    const digitada = /^\d{1,2}\/\d{1,2}(?:\/\d{2,4})?$/.test(consulta.trim()) ? interpretarPrazo(consulta.trim(), hoje) : null
    if (digitada) {
      itens.unshift({
        chave: "prazo-digitado",
        rotulo: `@${consulta.trim()}`,
        descricao: rotuloPrazo(digitada, hoje),
        icone: <CalendarIcon className="size-4" />,
        executar: (editorAtual, range) => {
          editorAtual.chain().focus().deleteRange(range).insertContent(`@${consulta.trim()} `).run()
        },
      })
    }
    itens.push({
      chave: "prazo-escolher",
      rotulo: "Escolher data…",
      descricao: "Abre o calendário",
      icone: <CalendarSearchIcon className="size-4" />,
      executar: (editorAtual, range) => {
        editorAtual.chain().focus().deleteRange(range).run()
        ganchosDo(editorAtual).abrirPrazo?.()
      },
    })
    return itens
  },
})
