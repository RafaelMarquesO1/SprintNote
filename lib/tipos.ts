// Rafael Marques - 20/10/2026
// Tipos centrais do SprintNote: notas (estilo Obsidian/Notion) e quadro Kanban.

// Um livro agrupa várias notas (como um caderno ou um "vault" do Obsidian).
export type Livro = {
  id: string
  titulo: string
  descricao: string
  icone: string
  criadoEm: number
  atualizadoEm: number
  // Personalização (Rafael Marques - 21/10/2026): cor do livro (também usada
  // no grafo), estilo da capa do cartão e livro fixado no topo da biblioteca.
  cor?: string | null
  capa?: string | null
  fixado?: boolean
}

// Capa (banner) no topo da nota, no estilo do Notion.
export type Capa =
  | { tipo: "gradiente"; valor: string; posicaoY: number }
  | { tipo: "cor"; valor: string; posicaoY: number }
  // valor: imagem em data URL (enviada) ou endereço https.
  | { tipo: "imagem"; valor: string; posicaoY: number }

export type FonteNota = "padrao" | "serifada" | "mono" | "manuscrita"
export type TamanhoTexto = "pequeno" | "normal" | "grande"
export type Espacamento = "compacto" | "normal" | "amplo"
export type LarguraNota = "normal" | "larga" | "total"
export type FundoNota = "nenhum" | "papel" | "pontilhado" | "quadriculado" | "pautado"
export type AlturaCapa = "baixa" | "media" | "alta"

export type AparenciaNota = {
  capa?: Capa | null
  alturaCapa?: AlturaCapa
  fonte?: FonteNota
  tamanho?: TamanhoTexto
  espacamento?: Espacamento
  largura?: LarguraNota
  // Cor usada em caixas de tarefa, marcadores, citações e links.
  corDestaque?: string
  fundo?: FundoNota
  tituloCentralizado?: boolean
  ocultarIcone?: boolean
  // Campos antigos (versão anterior): ainda lidos para não perder a escolha.
  larguraTotal?: boolean
  textoPequeno?: boolean
}

export type Nota = {
  id: string
  titulo: string
  // Conteúdo em Markdown. Links: [[Nota]], [[Livro]] ou [[Livro/Nota]].
  conteudo: string
  // Livro ao qual a nota pertence (null = nota solta, fora de livros).
  livroId: string | null
  // null = nota na raiz do livro; caso contrário, id da nota pai (subnota).
  paiId: string | null
  icone: string
  criadoEm: number
  atualizadoEm: number
  aparencia?: AparenciaNota
  // Tags adicionadas pelo botão "+" (as #tags escritas no texto ficam no conteúdo).
  tags?: string[]
  // Rafael Marques - 23/10/2026: "quadro" = quadro interativo (formas e setas, como o Canvas do Obsidian).
  // O conteúdo é o JSON do quadro (veja lib/quadro/modelo.ts).
  tipo?: "quadro"
}

// ---------- Kanban ----------
// Rafael Marques - 21/10/2026: quadros, colunas e etiquetas personalizáveis.

export type IdColuna = string

export type EtiquetaKanban = {
  id: string
  nome: string
  cor: string
}

// O que aparece na frente dos cartões (escolhido por quadro).
export type ExibicaoCartao = {
  etiquetas: boolean
  prazo: boolean
  descricao: boolean
  // "itens" mostra a checklist no cartão, com caixas que dá para marcar.
  checklist: "oculto" | "progresso" | "itens"
  nota: boolean
  faixaCor: boolean
  // Caixinha para concluir o cartão sem abrir (move para a coluna de concluídos).
  concluir: boolean
  prioridade: boolean
  comentarios: boolean
}

export type QuadroKanban = {
  id: string
  titulo: string
  icone: string
  // Fundo do quadro: id de `fundosQuadro` (quadros antigos podem ter o degradê em CSS; null = sem fundo).
  fundo: string | null
  etiquetas: EtiquetaKanban[]
  criadoEm: number
  exibicao?: Partial<ExibicaoCartao>
  // Rafael Marques - 23/10/2026: quadro de equipe (guardado no servidor, não no navegador).
  equipeId?: string
}

export type ColunaKanban = {
  id: IdColuna
  quadroId: string
  titulo: string
  cor: string | null
  // Máximo de cartões (WIP). null = sem limite.
  limite: number | null
  // Cartões nesta coluna contam como concluídos (progresso da sprint).
  concluida: boolean
  recolhida: boolean
}

export type ItemChecklist = {
  id: string
  texto: string
  feito: boolean
}

// Rafael Marques - 23/10/2026: comentários, histórico, prioridade e arquivo do cartão.
export type ComentarioCartao = {
  id: string
  texto: string
  criadoEm: number
  autorId: string
  autorNome: string
}

// Histórico automático do cartão ("Movido de A fazer para Concluído").
export type AtividadeCartao = {
  id: string
  texto: string
  criadoEm: number
}

export type CartaoKanban = {
  id: string
  titulo: string
  descricao: string
  colunaId: IdColuna
  // Nota vinculada ao cartão (opcional).
  notaId: string | null
  criadoEm: number
  etiquetas: string[]
  prazo: string | null
  cor: string | null
  checklist: ItemChecklist[]
  prioridade: Prioridade | null
  // Arquivado: sai do quadro e dos números, mas pode ser restaurado.
  arquivado: boolean
  comentarios: ComentarioCartao[]
  atividade: AtividadeCartao[]
  // Rafael Marques - 23/10/2026: pessoa da equipe responsável (só em quadros de equipe).
  responsavelId: string | null
}

export type Prioridade = "baixa" | "media" | "alta"

export type Tarefa = {
  id: string
  titulo: string
  descricao: string
  concluida: boolean
  // Data limite no formato AAAA-MM-DD (ou null = sem prazo).
  prazo: string | null
  prioridade: Prioridade
  // Lista/projeto livre, ex.: "Trabalho", "Estudos".
  lista: string
  criadoEm: number
  concluidaEm: number | null
}

export type Habito = {
  id: string
  nome: string
  icone: string
  // Dias da semana em que o hábito vale (0 = domingo ... 6 = sábado).
  dias: number[]
  // Datas (AAAA-MM-DD) em que o hábito foi feito.
  feitos: string[]
  criadoEm: number
}

export type ItemRotina = {
  id: string
  titulo: string
  // Horário "HH:MM".
  horario: string
  // Dias da semana em que o item acontece (0 = domingo ... 6 = sábado).
  dias: number[]
  // Personalização (Rafael Marques - 21/10/2026).
  // Horário de término "HH:MM" (opcional).
  fim?: string | null
  icone?: string
  cor?: string | null
  observacao?: string
}

// Como a tela de rotina é exibida (escolhido em "Personalizar").
export type ExibicaoRotina = {
  visao: "linha" | "cartoes" | "semana"
  // Como a cor de cada atividade aparece.
  estiloCor: "icone" | "fundo"
  mostrarDias: boolean
  mostrarObservacao: boolean
  mostrarDuracao: boolean
  ocultarFeitas: boolean
  destacarAgora: boolean
}
