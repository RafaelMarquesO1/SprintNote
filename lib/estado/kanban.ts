// Rafael Marques - 20/10/2026 (quadros personalizáveis em 21/10/2026)
// Estado do Kanban: quadros, colunas, etiquetas e cartões
// (Zustand + persistência no localStorage do navegador).

import { create } from "zustand"
import { persist } from "zustand/middleware"

import { gerarId } from "@/lib/gerar-id"
import type { CartaoKanban, ColunaKanban, EtiquetaKanban, ExibicaoCartao, IdColuna, QuadroKanban } from "@/lib/tipos"

export const exibicaoPadrao: ExibicaoCartao = {
  etiquetas: true,
  prazo: true,
  descricao: false,
  checklist: "progresso",
  nota: true,
  faixaCor: true,
  concluir: false,
}

export function exibicaoDoQuadro(quadro: QuadroKanban | undefined): ExibicaoCartao {
  return { ...exibicaoPadrao, ...quadro?.exibicao }
}

type MudancasCartao = Partial<
  Pick<CartaoKanban, "titulo" | "descricao" | "notaId" | "etiquetas" | "prazo" | "cor" | "checklist">
>
type MudancasColuna = Partial<Pick<ColunaKanban, "titulo" | "cor" | "limite" | "concluida" | "recolhida">>

type EstadoKanban = {
  quadros: QuadroKanban[]
  colunas: ColunaKanban[]
  cartoes: CartaoKanban[]
  quadroAtivoId: string | null

  // Quadros
  criarQuadro: (titulo?: string) => QuadroKanban
  atualizarQuadro: (id: string, mudancas: Partial<Pick<QuadroKanban, "titulo" | "icone" | "fundo">>) => void
  excluirQuadro: (id: string) => void
  definirQuadroAtivo: (id: string) => void
  definirExibicao: (quadroId: string, mudancas: Partial<ExibicaoCartao>) => void

  // Colunas
  adicionarColuna: (quadroId: string, titulo: string) => void
  atualizarColuna: (id: string, mudancas: MudancasColuna) => void
  // destinoId: coluna que recebe os cartões (null = excluir os cartões junto).
  excluirColuna: (id: string, destinoId: string | null) => void
  // Coloca a coluna antes de "antesDeId" (ou no fim do quadro).
  reordenarColuna: (id: string, antesDeId: string | null) => void

  // Etiquetas
  criarEtiqueta: (quadroId: string, nome: string, cor: string) => EtiquetaKanban
  atualizarEtiqueta: (quadroId: string, id: string, mudancas: Partial<Omit<EtiquetaKanban, "id">>) => void
  excluirEtiqueta: (quadroId: string, id: string) => void

  // Cartões
  adicionarCartao: (colunaId: IdColuna, titulo: string) => void
  atualizarCartao: (id: string, mudancas: MudancasCartao) => void
  duplicarCartao: (id: string) => void
  excluirCartao: (id: string) => void
  // Marca como concluído (vai para a coluna de concluídos) ou reabre.
  concluirCartao: (id: string, concluir: boolean) => void
  // Move o cartão para a coluna, antes do cartão "antesDeId" (ou no fim).
  moverCartao: (id: string, colunaId: IdColuna, antesDeId?: string | null) => void
  desvincularNotas: (notaIds: string[]) => void
}

function colunasPadrao(quadroId: string, ids?: [string, string, string]): ColunaKanban[] {
  const [aFazer, fazendo, concluido] = ids ?? [gerarId(), gerarId(), gerarId()]
  const base = { quadroId, cor: null, limite: null, recolhida: false }
  return [
    { ...base, id: aFazer, titulo: "A fazer", concluida: false },
    { ...base, id: fazendo, titulo: "Em andamento", concluida: false },
    { ...base, id: concluido, titulo: "Concluído", concluida: true },
  ]
}

function novoQuadro(titulo: string, id = gerarId()): QuadroKanban {
  return { id, titulo, icone: "lista", fundo: null, etiquetas: [], criadoEm: Date.now() }
}

// Primeiro acesso: um quadro com as três colunas de sempre, sem cartões.
const quadroInicial = novoQuadro("Meu quadro", "principal")

function completarCartao(cartao: Partial<CartaoKanban> & Pick<CartaoKanban, "id" | "titulo" | "colunaId">): CartaoKanban {
  return {
    descricao: "",
    notaId: null,
    criadoEm: Date.now(),
    etiquetas: [],
    prazo: null,
    cor: null,
    checklist: [],
    ...cartao,
  }
}

export const useKanban = create<EstadoKanban>()(
  persist(
    (set, get) => ({
      quadros: [quadroInicial],
      colunas: colunasPadrao(quadroInicial.id, ["a-fazer", "fazendo", "concluido"]),
      cartoes: [],
      quadroAtivoId: quadroInicial.id,

      // ---------- Quadros ----------
      criarQuadro: (titulo = "Novo quadro") => {
        const quadro = novoQuadro(titulo.trim() || "Novo quadro")
        set({
          quadros: [...get().quadros, quadro],
          colunas: [...get().colunas, ...colunasPadrao(quadro.id)],
          quadroAtivoId: quadro.id,
        })
        return quadro
      },

      atualizarQuadro: (id, mudancas) =>
        set({ quadros: get().quadros.map((quadro) => (quadro.id === id ? { ...quadro, ...mudancas } : quadro)) }),

      excluirQuadro: (id) => {
        const colunasDoQuadro = new Set(get().colunas.filter((coluna) => coluna.quadroId === id).map((coluna) => coluna.id))
        const quadros = get().quadros.filter((quadro) => quadro.id !== id)
        set({
          quadros,
          colunas: get().colunas.filter((coluna) => coluna.quadroId !== id),
          cartoes: get().cartoes.filter((cartao) => !colunasDoQuadro.has(cartao.colunaId)),
          quadroAtivoId: get().quadroAtivoId === id ? (quadros[0]?.id ?? null) : get().quadroAtivoId,
        })
      },

      definirQuadroAtivo: (id) => set({ quadroAtivoId: id }),

      definirExibicao: (quadroId, mudancas) =>
        set({
          quadros: get().quadros.map((quadro) =>
            quadro.id === quadroId ? { ...quadro, exibicao: { ...quadro.exibicao, ...mudancas } } : quadro
          ),
        }),

      // ---------- Colunas ----------
      adicionarColuna: (quadroId, titulo) => {
        const coluna: ColunaKanban = {
          id: gerarId(),
          quadroId,
          titulo: titulo.trim() || "Nova coluna",
          cor: null,
          limite: null,
          concluida: false,
          recolhida: false,
        }
        set({ colunas: [...get().colunas, coluna] })
      },

      atualizarColuna: (id, mudancas) =>
        set({ colunas: get().colunas.map((coluna) => (coluna.id === id ? { ...coluna, ...mudancas } : coluna)) }),

      excluirColuna: (id, destinoId) =>
        set({
          colunas: get().colunas.filter((coluna) => coluna.id !== id),
          cartoes: destinoId
            ? get().cartoes.map((cartao) => (cartao.colunaId === id ? { ...cartao, colunaId: destinoId } : cartao))
            : get().cartoes.filter((cartao) => cartao.colunaId !== id),
        }),

      reordenarColuna: (id, antesDeId) => {
        const coluna = get().colunas.find((item) => item.id === id)
        if (!coluna || id === antesDeId) return
        const restantes = get().colunas.filter((item) => item.id !== id)
        const indice = antesDeId ? restantes.findIndex((item) => item.id === antesDeId) : -1
        if (indice === -1) restantes.push(coluna)
        else restantes.splice(indice, 0, coluna)
        set({ colunas: restantes })
      },

      // ---------- Etiquetas ----------
      criarEtiqueta: (quadroId, nome, cor) => {
        const etiqueta: EtiquetaKanban = { id: gerarId(), nome: nome.trim(), cor }
        set({
          quadros: get().quadros.map((quadro) =>
            quadro.id === quadroId ? { ...quadro, etiquetas: [...quadro.etiquetas, etiqueta] } : quadro
          ),
        })
        return etiqueta
      },

      atualizarEtiqueta: (quadroId, id, mudancas) =>
        set({
          quadros: get().quadros.map((quadro) =>
            quadro.id === quadroId
              ? { ...quadro, etiquetas: quadro.etiquetas.map((etiqueta) => (etiqueta.id === id ? { ...etiqueta, ...mudancas } : etiqueta)) }
              : quadro
          ),
        }),

      excluirEtiqueta: (quadroId, id) =>
        set({
          quadros: get().quadros.map((quadro) =>
            quadro.id === quadroId ? { ...quadro, etiquetas: quadro.etiquetas.filter((etiqueta) => etiqueta.id !== id) } : quadro
          ),
          cartoes: get().cartoes.map((cartao) =>
            cartao.etiquetas.includes(id) ? { ...cartao, etiquetas: cartao.etiquetas.filter((item) => item !== id) } : cartao
          ),
        }),

      // ---------- Cartões ----------
      adicionarCartao: (colunaId, titulo) => {
        if (!titulo.trim()) return
        set({ cartoes: [...get().cartoes, completarCartao({ id: gerarId(), titulo: titulo.trim(), colunaId })] })
      },

      atualizarCartao: (id, mudancas) =>
        set({ cartoes: get().cartoes.map((cartao) => (cartao.id === id ? { ...cartao, ...mudancas } : cartao)) }),

      duplicarCartao: (id) => {
        const indice = get().cartoes.findIndex((cartao) => cartao.id === id)
        if (indice === -1) return
        const original = get().cartoes[indice]
        const copia: CartaoKanban = {
          ...original,
          id: gerarId(),
          titulo: `${original.titulo} (cópia)`,
          criadoEm: Date.now(),
          checklist: original.checklist.map((item) => ({ ...item, id: gerarId() })),
        }
        const cartoes = [...get().cartoes]
        cartoes.splice(indice + 1, 0, copia)
        set({ cartoes })
      },

      excluirCartao: (id) => set({ cartoes: get().cartoes.filter((cartao) => cartao.id !== id) }),

      concluirCartao: (id, concluir) => {
        const cartao = get().cartoes.find((item) => item.id === id)
        const atual = get().colunas.find((coluna) => coluna.id === cartao?.colunaId)
        if (!cartao || !atual) return
        const doQuadro = get().colunas.filter((coluna) => coluna.quadroId === atual.quadroId)
        // Concluir: primeira coluna de concluídos (ou a última). Reabrir: primeira coluna comum.
        const destino = concluir
          ? (doQuadro.find((coluna) => coluna.concluida) ?? doQuadro[doQuadro.length - 1])
          : doQuadro.find((coluna) => !coluna.concluida)
        if (destino && destino.id !== atual.id) get().moverCartao(id, destino.id, null)
      },

      moverCartao: (id, colunaId, antesDeId = null) => {
        const cartao = get().cartoes.find((item) => item.id === id)
        if (!cartao || id === antesDeId) return
        const restantes = get().cartoes.filter((item) => item.id !== id)
        const movido = { ...cartao, colunaId }
        const indice = antesDeId ? restantes.findIndex((item) => item.id === antesDeId) : -1
        if (indice === -1) restantes.push(movido)
        else restantes.splice(indice, 0, movido)
        set({ cartoes: restantes })
      },

      // Quando notas são excluídas, os cartões perdem o vínculo.
      desvincularNotas: (notaIds) =>
        set({
          cartoes: get().cartoes.map((cartao) =>
            cartao.notaId && notaIds.includes(cartao.notaId) ? { ...cartao, notaId: null } : cartao
          ),
        }),
    }),
    {
      name: "sprintnote-kanban",
      version: 3,
      migrate: (salvo, versao) => {
        // v1 tinha só dados de exemplo: começa zerado.
        if (versao < 2) return normalizarKanban({}) as unknown as EstadoKanban
        // v2: colunas fixas ("a-fazer", "fazendo", "concluido") — os cartões continuam nelas.
        return normalizarKanban(salvo as DadosKanban) as unknown as EstadoKanban
      },
    }
  )
)

// Dados de Kanban vindos de um backup ou de uma versão antiga: sem quadros,
// recria o quadro padrão com as colunas "a-fazer", "fazendo" e "concluido".
export type DadosKanban = {
  quadros?: QuadroKanban[]
  colunas?: ColunaKanban[]
  cartoes?: Partial<CartaoKanban>[]
  quadroAtivoId?: string | null
}

export function normalizarKanban(dados: DadosKanban) {
  const cartoes = (dados.cartoes ?? []).map((cartao) =>
    completarCartao(cartao as Partial<CartaoKanban> & Pick<CartaoKanban, "id" | "titulo" | "colunaId">)
  )
  if (dados.quadros?.length && dados.colunas) {
    return { quadros: dados.quadros, colunas: dados.colunas, cartoes, quadroAtivoId: dados.quadroAtivoId ?? dados.quadros[0].id }
  }
  const quadro = novoQuadro("Meu quadro", "principal")
  return { quadros: [quadro], colunas: colunasPadrao(quadro.id, ["a-fazer", "fazendo", "concluido"]), cartoes, quadroAtivoId: quadro.id }
}

// ---------- Consultas ----------

export function colunasDoQuadro(colunas: ColunaKanban[], quadroId: string | null) {
  return colunas.filter((coluna) => coluna.quadroId === quadroId)
}

export function cartaoConcluido(cartao: CartaoKanban, colunas: ColunaKanban[]) {
  return colunas.find((coluna) => coluna.id === cartao.colunaId)?.concluida ?? false
}

// "Quadro / Coluna" de um cartão, para mostrar em outras telas.
export function localDoCartao(cartao: CartaoKanban, colunas: ColunaKanban[], quadros: QuadroKanban[]) {
  const coluna = colunas.find((item) => item.id === cartao.colunaId)
  const quadro = quadros.find((item) => item.id === coluna?.quadroId)
  return [quadros.length > 1 ? quadro?.titulo : null, coluna?.titulo].filter(Boolean).join(" / ")
}
