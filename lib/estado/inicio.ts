// Rafael Marques - 21/10/2026
// Painel personalizável da tela de início: quais widgets aparecem, em que
// ordem, com que tamanho e com quais opções (Zustand + localStorage).

import { create } from "zustand"
import { persist } from "zustand/middleware"

import { gerarId } from "@/lib/gerar-id"

export type TipoWidget =
  | "numeros"
  | "progresso-dia"
  | "relogio"
  | "atalhos"
  | "tarefas-hoje"
  | "tarefas-proximas"
  | "habitos-hoje"
  | "habitos-semana"
  | "rotina-proximas"
  | "rotina-dia"
  | "kanban-andamento"
  | "kanban-prazos"
  | "notas-recentes"
  | "nota-fixada"
  | "livros"
  | "tags"
  | "grafo"
  | "bloco-notas"

// Opções de cada widget (cada tipo usa só as que fazem sentido para ele).
export type ConfigWidget = {
  limite?: number
  // Números escolhidos no widget "numeros".
  metricas?: string[]
  // Atalhos escolhidos no widget "atalhos".
  atalhos?: string[]
  // Filtro por livro (notas recentes, grafo).
  livroId?: string | null
  // Quadro do Kanban (null = o último aberto).
  quadroId?: string | null
  notaId?: string | null
  texto?: string
  dias?: number
  mostrarConcluidas?: boolean
  incluirNotas?: boolean
  segundos?: boolean
}

export type Widget = {
  id: string
  tipo: TipoWidget
  // Quantas colunas o widget ocupa (limitado ao número de colunas do painel).
  largura: number
  altura: "baixa" | "normal" | "alta"
  // Altura livre em pixels, definida arrastando a borda do cartão (sobrepõe "altura").
  alturaPx?: number
  // Título próprio (vazio = nome padrão do widget).
  titulo?: string
  // Cor de destaque (barra no topo e ícone).
  cor?: string | null
  // Estilo do cartão.
  estilo?: "padrao" | "suave" | "contorno" | "destaque"
  config: ConfigWidget
}

const novo = (tipo: TipoWidget, largura: number, config: ConfigWidget = {}, altura: Widget["altura"] = "normal"): Widget => ({
  id: gerarId(),
  tipo,
  largura,
  altura,
  config,
})

// Painel que aparece na primeira vez (e no "Restaurar padrão").
export function widgetsPadrao(): Widget[] {
  return [
    novo("numeros", 4, { metricas: ["tarefas-hoje", "habitos-feitos", "rotina-feitas", "cartoes-abertos"] }, "baixa"),
    novo("tarefas-hoje", 2, { limite: 6, incluirNotas: true }),
    novo("habitos-hoje", 2),
    novo("rotina-proximas", 2, { limite: 4 }),
    novo("kanban-andamento", 2, { quadroId: null }),
    novo("notas-recentes", 4, { limite: 6, livroId: null }),
  ]
}

type EstadoInicio = {
  widgets: Widget[]
  adicionarWidget: (tipo: TipoWidget, largura: number, config?: ConfigWidget) => string
  duplicarWidget: (id: string) => void
  removerWidget: (id: string) => void
  moverWidget: (id: string, paraIndice: number) => void
  atualizarWidget: (id: string, mudancas: Partial<Omit<Widget, "id" | "tipo" | "config">>) => void
  configurarWidget: (id: string, mudancas: Partial<ConfigWidget>) => void
  restaurarPadrao: () => void
}

export const useInicio = create<EstadoInicio>()(
  persist(
    (set, get) => ({
      widgets: widgetsPadrao(),

      adicionarWidget: (tipo, largura, config = {}) => {
        const widget = novo(tipo, largura, config)
        set({ widgets: [...get().widgets, widget] })
        return widget.id
      },

      duplicarWidget: (id) => {
        const lista = get().widgets
        const indice = lista.findIndex((widget) => widget.id === id)
        if (indice < 0) return
        const copia = { ...lista[indice], id: gerarId(), config: { ...lista[indice].config } }
        set({ widgets: [...lista.slice(0, indice + 1), copia, ...lista.slice(indice + 1)] })
      },

      removerWidget: (id) => set({ widgets: get().widgets.filter((widget) => widget.id !== id) }),

      moverWidget: (id, paraIndice) => {
        const lista = [...get().widgets]
        const de = lista.findIndex((widget) => widget.id === id)
        if (de < 0) return
        const [widget] = lista.splice(de, 1)
        lista.splice(Math.max(0, Math.min(paraIndice, lista.length)), 0, widget)
        set({ widgets: lista })
      },

      atualizarWidget: (id, mudancas) =>
        set({ widgets: get().widgets.map((widget) => (widget.id === id ? { ...widget, ...mudancas } : widget)) }),

      configurarWidget: (id, mudancas) =>
        set({
          widgets: get().widgets.map((widget) => (widget.id === id ? { ...widget, config: { ...widget.config, ...mudancas } } : widget)),
        }),

      restaurarPadrao: () => set({ widgets: widgetsPadrao() }),
    }),
    {
      name: "sprintnote-inicio",
      version: 2,
      // Rafael Marques - 22/10/2026: a "Aparência do início" saiu; descarta o que estava salvo.
      migrate: (salvo) => {
        const resto = { ...((salvo ?? {}) as Record<string, unknown>) }
        delete resto.aparencia
        return resto as unknown as EstadoInicio
      },
    }
  )
)
