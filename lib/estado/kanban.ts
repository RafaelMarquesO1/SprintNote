// Rafael Marques - 20/10/2026 (quadros personalizáveis em 21/10/2026; comentários, histórico, prioridade, arquivo e desfazer em 23/10/2026)
// Estado do Kanban: quadros, colunas, etiquetas e cartões
// (Zustand + persistência no localStorage do navegador).

import { create } from "zustand"
import { persist } from "zustand/middleware"

import { oferecerDesfazer } from "@/lib/estado/desfazer-kanban"
import { gerarId } from "@/lib/gerar-id"
import type {
  AtividadeCartao,
  CartaoKanban,
  ColunaKanban,
  EtiquetaKanban,
  ExibicaoCartao,
  IdColuna,
  Prioridade,
  QuadroKanban,
} from "@/lib/tipos"

export const exibicaoPadrao: ExibicaoCartao = {
  etiquetas: true,
  prazo: true,
  descricao: false,
  checklist: "progresso",
  nota: true,
  faixaCor: true,
  concluir: false,
  prioridade: true,
  comentarios: true,
}

export function exibicaoDoQuadro(quadro: QuadroKanban | undefined): ExibicaoCartao {
  return { ...exibicaoPadrao, ...quadro?.exibicao }
}

type MudancasCartao = Partial<
  Pick<CartaoKanban, "titulo" | "descricao" | "notaId" | "etiquetas" | "prazo" | "cor" | "checklist" | "prioridade" | "responsavelId">
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
  // "atividade" (opcional): linha extra para o histórico do cartão (ex.: quem ficou responsável).
  atualizarCartao: (id: string, mudancas: MudancasCartao, atividade?: string) => void
  duplicarCartao: (id: string) => void
  excluirCartao: (id: string) => void
  // Arquivar tira o cartão do quadro sem apagar; restaurar traz de volta.
  arquivarCartao: (id: string, arquivar: boolean) => void
  comentarCartao: (id: string, texto: string, autor: { id: string; nome: string }) => void
  excluirComentario: (cartaoId: string, comentarioId: string) => void
  // Marca como concluído (vai para a coluna de concluídos) ou reabre.
  concluirCartao: (id: string, concluir: boolean) => void
  // Move o cartão para a coluna, antes do cartão "antesDeId" (ou no fim).
  moverCartao: (id: string, colunaId: IdColuna, antesDeId?: string | null) => void
  desvincularNotas: (notaIds: string[]) => void
}

// Rafael Marques - 23/10/2026: exportadas para a criação de quadros de equipe.
export function colunasPadrao(quadroId: string, ids?: [string, string, string]): ColunaKanban[] {
  const [aFazer, fazendo, concluido] = ids ?? [gerarId(), gerarId(), gerarId()]
  const base = { quadroId, cor: null, limite: null, recolhida: false }
  return [
    { ...base, id: aFazer, titulo: "A fazer", concluida: false },
    { ...base, id: fazendo, titulo: "Em andamento", concluida: false },
    { ...base, id: concluido, titulo: "Concluído", concluida: true },
  ]
}

export function novoQuadro(titulo: string, id = gerarId()): QuadroKanban {
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
    prioridade: null,
    arquivado: false,
    comentarios: [],
    atividade: [],
    responsavelId: null, // Rafael Marques - 23/10/2026
    ...cartao,
  }
}

// Rafael Marques - 23/10/2026: histórico do cartão (atividade).
const LIMITE_ATIVIDADE = 50
const rotulosPrioridade: Record<Prioridade, string> = { alta: "alta", media: "média", baixa: "baixa" }

// Acrescenta uma linha ao histórico do cartão (guarda só as mais recentes).
function comAtividade(cartao: CartaoKanban, texto: string): CartaoKanban {
  const item: AtividadeCartao = { id: gerarId(), texto, criadoEm: Date.now() }
  return { ...cartao, atividade: [...cartao.atividade, item].slice(-LIMITE_ATIVIDADE) }
}

function formatarPrazo(prazo: string) {
  const [ano, mes, dia] = prazo.split("-")
  return `${dia}/${mes}/${ano}`
}

// Rafael Marques - 23/10/2026
// Quadros de equipe vivem no servidor: o sincronizador (lib/estado/sincronizacao-equipes.ts)
// os coloca nesta mesma lista para a tela reaproveitar tudo, mas eles nunca são
// salvos no navegador nem na conta pessoal (veja "partialize" abaixo).
export const ganchosEquipe: { aoExcluirQuadro?: (quadro: QuadroKanban) => void } = {}

export const ehQuadroDeEquipe = (quadro: QuadroKanban | undefined) => Boolean(quadro?.equipeId)

// Separa os dados pessoais dos de equipe.
export function dadosPessoais<T extends { quadros: QuadroKanban[]; colunas: ColunaKanban[]; cartoes: CartaoKanban[] }>(estado: T) {
  const quadros = estado.quadros.filter((quadro) => !quadro.equipeId)
  const idsQuadros = new Set(quadros.map((quadro) => quadro.id))
  const colunas = estado.colunas.filter((coluna) => idsQuadros.has(coluna.quadroId))
  const idsColunas = new Set(colunas.map((coluna) => coluna.id))
  return { quadros, colunas, cartoes: estado.cartoes.filter((cartao) => idsColunas.has(cartao.colunaId)) }
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
        const doQuadro = get().quadros.find((quadro) => quadro.id === id)
        // Quadro de equipe: o servidor decide se a pessoa pode excluir (só o dono).
        if (doQuadro?.equipeId) ganchosEquipe.aoExcluirQuadro?.(doQuadro)
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

      atualizarCartao: (id, mudancas, atividade) =>
        set({
          cartoes: get().cartoes.map((cartao) => {
            if (cartao.id !== id) return cartao
            let novo: CartaoKanban = { ...cartao, ...mudancas }
            if ("prazo" in mudancas && mudancas.prazo !== cartao.prazo) {
              novo = comAtividade(novo, mudancas.prazo ? `Prazo definido para ${formatarPrazo(mudancas.prazo)}` : "Prazo removido")
            }
            if ("prioridade" in mudancas && mudancas.prioridade !== cartao.prioridade) {
              novo = comAtividade(novo, mudancas.prioridade ? `Prioridade ${rotulosPrioridade[mudancas.prioridade]}` : "Prioridade removida")
            }
            if (atividade) novo = comAtividade(novo, atividade) // Rafael Marques - 23/10/2026
            return novo
          }),
        }),

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
          comentarios: [],
          atividade: [],
        }
        const cartoes = [...get().cartoes]
        cartoes.splice(indice + 1, 0, copia)
        set({ cartoes })
      },

      excluirCartao: (id) => {
        const indice = get().cartoes.findIndex((cartao) => cartao.id === id)
        if (indice === -1) return
        const removido = get().cartoes[indice]
        set({ cartoes: get().cartoes.filter((cartao) => cartao.id !== id) })
        oferecerDesfazer(`Cartão “${removido.titulo}” excluído`, () => {
          if (get().cartoes.some((cartao) => cartao.id === id)) return
          // A coluna pode ter sido apagada nesse meio tempo: nesse caso não há onde devolver.
          if (!get().colunas.some((coluna) => coluna.id === removido.colunaId)) return
          const cartoes = [...get().cartoes]
          cartoes.splice(Math.min(indice, cartoes.length), 0, removido)
          set({ cartoes })
        })
      },

      // Rafael Marques - 23/10/2026: arquivar, comentar e desfazer exclusão.
      arquivarCartao: (id, arquivar) => {
        const cartao = get().cartoes.find((item) => item.id === id)
        if (!cartao || cartao.arquivado === arquivar) return
        set({
          cartoes: get().cartoes.map((item) =>
            item.id === id ? comAtividade({ ...item, arquivado: arquivar }, arquivar ? "Arquivado" : "Restaurado do arquivo") : item
          ),
        })
        if (arquivar) oferecerDesfazer(`Cartão “${cartao.titulo}” arquivado`, () => get().arquivarCartao(id, false))
      },

      comentarCartao: (id, texto, autor) => {
        const conteudo = texto.trim()
        if (!conteudo) return
        const comentario = { id: gerarId(), texto: conteudo, criadoEm: Date.now(), autorId: autor.id, autorNome: autor.nome }
        set({
          cartoes: get().cartoes.map((cartao) =>
            cartao.id === id ? { ...cartao, comentarios: [...cartao.comentarios, comentario] } : cartao
          ),
        })
      },

      excluirComentario: (cartaoId, comentarioId) =>
        set({
          cartoes: get().cartoes.map((cartao) =>
            cartao.id === cartaoId ? { ...cartao, comentarios: cartao.comentarios.filter((item) => item.id !== comentarioId) } : cartao
          ),
        }),

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
        let movido = { ...cartao, colunaId }
        if (cartao.colunaId !== colunaId) {
          const nome = (alvo: string) => get().colunas.find((coluna) => coluna.id === alvo)?.titulo ?? "outra coluna"
          movido = comAtividade(movido, `Movido de ${nome(cartao.colunaId)} para ${nome(colunaId)}`)
        }
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
      version: 4,
      // Só o que é pessoal vai para o navegador e para a conta (equipes ficam no servidor).
      partialize: (estado) => ({
        ...estado,
        ...dadosPessoais(estado),
        quadroAtivoId: estado.quadros.find((quadro) => quadro.id === estado.quadroAtivoId)?.equipeId ? null : estado.quadroAtivoId,
      }),
      migrate: (salvo, versao) => {
        // v1 tinha só dados de exemplo: começa zerado.
        if (versao < 2) return normalizarKanban({}) as unknown as EstadoKanban
        // v2/v3: os cartões ganham prioridade, arquivo, comentários e histórico (completarCartao preenche).
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

// Rafael Marques - 23/10/2026
// Cartões que contam nos números (sidebar, avisos, início): os dos seus quadros
// pessoais e os de equipe que estão atribuídos a você. Arquivados ficam de fora.
export function cartoesRelevantes(cartoes: CartaoKanban[], colunas: ColunaKanban[], quadros: QuadroKanban[], meuId: string | null) {
  const deEquipe = new Set(quadros.filter((quadro) => quadro.equipeId).map((quadro) => quadro.id))
  const colunasDeEquipe = new Set(colunas.filter((coluna) => deEquipe.has(coluna.quadroId)).map((coluna) => coluna.id))
  return cartoes.filter((cartao) => {
    if (cartao.arquivado) return false
    if (!colunasDeEquipe.has(cartao.colunaId)) return true
    return meuId !== null && cartao.responsavelId === meuId
  })
}
