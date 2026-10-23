// Rafael Marques - 21/10/2026 (foto de perfil em 23/10/2026)
// Preferências do app guardadas no navegador.

import { create } from "zustand"
import { persist } from "zustand/middleware"

// Como a biblioteca ("Todos os livros") é exibida — ajustado direto na tela.
export type PreferenciasBiblioteca = {
  visao: "grade" | "lista"
  ordem: "recentes" | "nome" | "tamanho" | "criacao"
  // Largura mínima dos cartões (px), definida arrastando a borda de um cartão.
  larguraCartao: number
  // Versões antigas guardavam um tamanho fixo (convertido em larguraCartao).
  tamanho?: "compacto" | "normal" | "grande"
  mostrarNumeros: boolean
  mostrarCapa: boolean
  mostrarDescricao: boolean
  mostrarTags: boolean
  mostrarTarefas: boolean
  mostrarRecentes: boolean
}

export const preferenciasBibliotecaPadrao: PreferenciasBiblioteca = {
  visao: "grade",
  ordem: "recentes",
  larguraCartao: 300,
  mostrarNumeros: true,
  mostrarCapa: true,
  mostrarDescricao: true,
  mostrarTags: true,
  mostrarTarefas: true,
  mostrarRecentes: true,
}

type EstadoPreferencias = {
  biblioteca: PreferenciasBiblioteca
  definirBiblioteca: (mudancas: Partial<PreferenciasBiblioteca>) => void
  // Foto de perfil (JPEG 256×256 em data URL). Fica só na conta da pessoa.
  fotoPerfil: string | null
  definirFotoPerfil: (foto: string | null) => void
  // Rafael Marques - 23/10/2026: id da última novidade que a pessoa viu (null = ainda não viu nenhuma).
  novidadesVistas: string | null
  marcarNovidadesVistas: (id: string) => void
}

export const usePreferencias = create<EstadoPreferencias>()(
  persist(
    (set, get) => ({
      biblioteca: preferenciasBibliotecaPadrao,
      fotoPerfil: null,
      definirFotoPerfil: (foto) => set({ fotoPerfil: foto }),
      novidadesVistas: null,
      marcarNovidadesVistas: (id) => set({ novidadesVistas: id }),
      definirBiblioteca: (mudancas) =>
        set({ biblioteca: { ...preferenciasBibliotecaPadrao, ...get().biblioteca, ...mudancas } }),
    }),
    { name: "sprintnote-preferencias", version: 1 }
  )
)
