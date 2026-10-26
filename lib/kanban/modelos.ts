// Rafael Marques - 26/10/2026
// Modelos de quadro do Kanban: colunas, etiquetas e (se a pessoa quiser) cartões de exemplo.
// Funções puras: o sorteio de ids vem de fora (roda em Node: veja modelos.teste.ts).

import type { CartaoKanban, ColunaKanban, EtiquetaKanban, Prioridade, QuadroKanban } from "@/lib/tipos"

export type ModeloKanban = {
  id: string
  nome: string
  descricao: string
  icone: string
  fundo: string | null
  colunas: { titulo: string; concluida?: boolean; limite?: number }[]
  etiquetas: { nome: string; cor: string }[]
  // Cartões de exemplo: "coluna" e "etiquetas" são posições nas listas acima.
  exemplos: { titulo: string; coluna: number; prioridade?: Prioridade; etiquetas?: number[]; checklist?: string[] }[]
}

const vermelho = "oklch(0.6 0.19 25)"
const azul = "oklch(0.6 0.15 255)"
const verde = "oklch(0.62 0.14 155)"
const laranja = "oklch(0.68 0.16 55)"
const roxo = "oklch(0.6 0.17 300)"
const amarelo = "oklch(0.75 0.14 90)"

export const modelosKanban: ModeloKanban[] = [
  {
    id: "sprint",
    nome: "Sprint (Scrum)",
    descricao: "Backlog, desenvolvimento, revisão e entrega, com limites por coluna.",
    icone: "foguete",
    fundo: "pontos",
    colunas: [{ titulo: "Backlog" }, { titulo: "A fazer", limite: 8 }, { titulo: "Em andamento", limite: 4 }, { titulo: "Em revisão", limite: 4 }, { titulo: "Concluído", concluida: true }],
    etiquetas: [{ nome: "Funcionalidade", cor: azul }, { nome: "Bug", cor: vermelho }, { nome: "Melhoria", cor: verde }, { nome: "Urgente", cor: laranja }],
    exemplos: [
      { titulo: "Definir o objetivo da sprint", coluna: 1, prioridade: "alta", etiquetas: [0], checklist: ["Reunir o time", "Escolher os cartões", "Registrar a meta"] },
      { titulo: "Corrigir erro no login", coluna: 2, prioridade: "alta", etiquetas: [1, 3] },
      { titulo: "Pesquisar novas ideias", coluna: 0, etiquetas: [2] },
    ],
  },
  {
    id: "projeto",
    nome: "Projeto",
    descricao: "Do rascunho à entrega, com uma coluna para o que está esperando alguém.",
    icone: "alvo",
    fundo: "quadriculado",
    colunas: [{ titulo: "Ideias" }, { titulo: "Planejado" }, { titulo: "Em andamento", limite: 5 }, { titulo: "Aguardando" }, { titulo: "Concluído", concluida: true }],
    etiquetas: [{ nome: "Importante", cor: laranja }, { nome: "Decisão", cor: roxo }, { nome: "Compra", cor: amarelo }],
    exemplos: [
      { titulo: "Escrever o escopo do projeto", coluna: 1, prioridade: "alta", etiquetas: [0], checklist: ["Objetivo", "Entregas", "Prazo"] },
      { titulo: "Escolher a ferramenta", coluna: 3, etiquetas: [1] },
    ],
  },
  {
    id: "estudos",
    nome: "Estudos",
    descricao: "Matérias para estudar, em estudo, para revisar e dominadas.",
    icone: "estudo",
    fundo: "nevoa",
    colunas: [{ titulo: "Para estudar" }, { titulo: "Estudando", limite: 3 }, { titulo: "Revisar" }, { titulo: "Dominado", concluida: true }],
    etiquetas: [{ nome: "Prova", cor: vermelho }, { nome: "Leitura", cor: azul }, { nome: "Exercícios", cor: verde }],
    exemplos: [
      { titulo: "Capítulo 1 do livro", coluna: 1, etiquetas: [1], checklist: ["Ler", "Resumir", "Fazer os exercícios"] },
      { titulo: "Preparar a prova de sexta", coluna: 0, prioridade: "alta", etiquetas: [0] },
    ],
  },
  {
    id: "semana",
    nome: "Minha semana",
    descricao: "Caixa de entrada, hoje, esta semana e algum dia.",
    icone: "calendario",
    fundo: "pontos",
    colunas: [{ titulo: "Caixa de entrada" }, { titulo: "Hoje", limite: 5 }, { titulo: "Esta semana" }, { titulo: "Algum dia" }, { titulo: "Feito", concluida: true }],
    etiquetas: [{ nome: "Casa", cor: verde }, { nome: "Trabalho", cor: azul }, { nome: "Pessoal", cor: roxo }],
    exemplos: [
      { titulo: "Anotar tudo o que está na cabeça", coluna: 0 },
      { titulo: "Escolher 3 prioridades do dia", coluna: 1, prioridade: "alta" },
    ],
  },
  {
    id: "atendimento",
    nome: "Atendimento (chamados)",
    descricao: "Chamados novos, em atendimento, aguardando a pessoa e resolvidos.",
    icone: "trabalho",
    fundo: "nevoa",
    colunas: [{ titulo: "Novos" }, { titulo: "Em atendimento", limite: 5 }, { titulo: "Aguardando solicitante" }, { titulo: "Resolvidos", concluida: true }],
    etiquetas: [{ nome: "Incidente", cor: vermelho }, { nome: "Requisição", cor: azul }, { nome: "Urgente", cor: laranja }],
    exemplos: [
      { titulo: "Chamado 001 — impressora sem conexão", coluna: 0, prioridade: "media", etiquetas: [0], checklist: ["Registrar o que a pessoa enviou", "Testar a conexão", "Responder a pessoa"] },
      { titulo: "Chamado 002 — acesso ao sistema", coluna: 1, prioridade: "alta", etiquetas: [1, 2] },
    ],
  },
  {
    id: "conteudo",
    nome: "Produção de conteúdo",
    descricao: "Ideias, roteiro, produção, revisão e publicado.",
    icone: "pincel",
    fundo: "quadriculado",
    colunas: [{ titulo: "Ideias" }, { titulo: "Roteiro" }, { titulo: "Produção", limite: 3 }, { titulo: "Revisão" }, { titulo: "Publicado", concluida: true }],
    etiquetas: [{ nome: "Vídeo", cor: vermelho }, { nome: "Texto", cor: azul }, { nome: "Imagem", cor: verde }],
    exemplos: [
      { titulo: "Lista de 10 temas", coluna: 0, etiquetas: [1] },
      { titulo: "Roteiro do primeiro vídeo", coluna: 1, prioridade: "media", etiquetas: [0], checklist: ["Abertura", "Desenvolvimento", "Fechamento"] },
    ],
  },
]

export type QuadroMontado = { quadro: QuadroKanban; colunas: ColunaKanban[]; cartoes: Omit<CartaoKanban, never>[] }

// Monta o quadro do modelo. "completarCartao" preenche os campos que o modelo não define.
export function montarQuadroDoModelo(
  modelo: ModeloKanban,
  novoId: () => string,
  completarCartao: (cartao: Pick<CartaoKanban, "id" | "titulo" | "colunaId"> & Partial<CartaoKanban>) => CartaoKanban,
  comExemplos: boolean,
  agora = Date.now()
): QuadroMontado {
  const etiquetas: EtiquetaKanban[] = modelo.etiquetas.map((etiqueta) => ({ id: novoId(), nome: etiqueta.nome, cor: etiqueta.cor }))
  const quadro: QuadroKanban = { id: novoId(), titulo: modelo.nome, icone: modelo.icone, fundo: modelo.fundo, etiquetas, criadoEm: agora }
  const colunas: ColunaKanban[] = modelo.colunas.map((coluna) => ({
    id: novoId(),
    quadroId: quadro.id,
    titulo: coluna.titulo,
    cor: null,
    limite: coluna.limite ?? null,
    concluida: coluna.concluida ?? false,
    recolhida: false,
  }))
  const cartoes = comExemplos
    ? modelo.exemplos.map((exemplo) =>
        completarCartao({
          id: novoId(),
          titulo: exemplo.titulo,
          colunaId: colunas[exemplo.coluna]?.id ?? colunas[0].id,
          prioridade: exemplo.prioridade ?? null,
          etiquetas: (exemplo.etiquetas ?? []).map((posicao) => etiquetas[posicao]?.id).filter((id): id is string => Boolean(id)),
          checklist: (exemplo.checklist ?? []).map((texto) => ({ id: novoId(), texto, feito: false })),
          criadoEm: agora,
        })
      )
    : []
  return { quadro, colunas, cartoes }
}
