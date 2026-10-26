// Rafael Marques - 23/10/2026
// Menus de sugestão do editor: "/" (blocos), "[[" (notas e livros) e "#" (tags já usadas).

import { FilePlusIcon, HashIcon } from "lucide-react"

import { Icone } from "@/components/icone"
import { itensDeComando } from "@/components/notas/editor/comandos-barra"
import { ganchosDo } from "@/components/notas/editor/ganchos"
import { criarSugestao } from "@/components/notas/editor/sugestao"
import { useNotas } from "@/lib/estado/notas"
import { dadosNovaNota, sugerirLinks } from "@/lib/links-wiki"
import { contarTags } from "@/lib/tags"

export const SugestaoBarra = criarSugestao({
  nome: "barra",
  char: "/",
  itens: (consulta) => itensDeComando(consulta),
})

export const SugestaoLinks = criarSugestao({
  nome: "links",
  char: "[[",
  titulo: "Linkar nota ou livro",
  allowSpaces: true,
  allowedPrefixes: null,
  itens: (consulta, editor) => {
    const { notas, livros, criarNota } = useNotas.getState()
    const { notaId, livroId } = ganchosDo(editor)
    return sugerirLinks({ notas, livros }, consulta, { notaId, livroId }).map((sugestao) => ({
      chave: sugestao.chave,
      rotulo: sugestao.rotulo,
      descricao: sugestao.detalhe,
      icone: sugestao.criar ? <FilePlusIcon className="size-4" /> : <Icone nome={sugestao.icone} className="size-4" />,
      executar: (editorAtual, range) => {
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
