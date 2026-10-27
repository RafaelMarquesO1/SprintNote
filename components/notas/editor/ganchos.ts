// Rafael Marques - 23/10/2026
// "Ganchos" entre o editor (TipTap) e o resto da tela: o editor chama funções que a tela
// registra (abrir o diálogo de imagem, navegar para uma tag...) e sabe de qual nota e livro
// está editando. Fica guardado no storage da extensão (um por editor).

import { Extension, type Editor } from "@tiptap/core"

export type GanchosNotas = {
  abrirImagem: (() => void) | null
  abrirLink: (() => void) | null
  // Rafael Marques - 27/10/2026: janela "Escolher data" (prazo personalizado).
  abrirPrazo: (() => void) | null
  navegar: ((endereco: string) => void) | null
  notaId: string | null
  livroId: string | null
}

export const ExtensaoGanchos = Extension.create<Record<string, never>, GanchosNotas>({
  name: "ganchosNotas",
  addStorage() {
    return { abrirImagem: null, abrirLink: null, abrirPrazo: null, navegar: null, notaId: null, livroId: null }
  },
})

export function ganchosDo(editor: Editor) {
  return (editor.storage as unknown as { ganchosNotas: GanchosNotas }).ganchosNotas
}
