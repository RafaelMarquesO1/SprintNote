// Rafael Marques - 23/10/2026
// Novidades do SprintNote: o cartão "O que há de novo" mostra, uma vez depois do login,
// o que mudou desde a última vez que a pessoa viu.
//
// COMO ATUALIZAR a cada lançamento (funcionalidade ou correção):
//  1. acrescente uma entrada NO TOPO da lista;
//  2. "id" = data (AAAA-MM-DD); se houver mais de uma no dia, "-b", "-c"... O id precisa ficar
//     "maior" que o da entrada anterior, pois é assim que o app sabe o que é novo;
//  3. "versao" = a do package.json sem o ".0" final (funcionalidade: "1.2", package.json 1.2.0; correção: "1.2.1").

export type TipoNovidade = "novo" | "melhorado" | "corrigido"

export type Novidade = {
  id: string
  versao: string
  data: string
  titulo: string
  // Uma frase que resume o lançamento (aparece em destaque).
  resumo: string
  itens: { tipo: TipoNovidade; texto: string }[]
}

export const rotulosNovidade: Record<TipoNovidade, { singular: string; plural: string }> = {
  novo: { singular: "Novo", plural: "Novos" },
  melhorado: { singular: "Melhorado", plural: "Melhorados" },
  corrigido: { singular: "Corrigido", plural: "Corrigidos" },
}

// Ordem em que os grupos aparecem no cartão.
export const ordemTipos: TipoNovidade[] = ["novo", "melhorado", "corrigido"]

// Mais recente primeiro.
export const NOVIDADES: Novidade[] = [
  {
    id: "2026-10-23-b",
    versao: "1.1",
    data: "23/10/2026",
    titulo: "Equipes, comentários e mais no Kanban",
    resumo: "Agora dá para trabalhar em grupo no Kanban: compartilhar quadros, atribuir cartões e comentar.",
    itens: [
      { tipo: "novo", texto: "Equipes: crie uma equipe, convide pessoas por link e compartilhe quadros do Kanban (botão Equipes)." },
      { tipo: "novo", texto: "Atribua cartões a pessoas da equipe. Clique na inicial (ou foto) de quem é responsável, dentro do cartão, para filtrar o quadro por essa pessoa; um aviso confirma o filtro e deixa remover." },
      { tipo: "novo", texto: "Botão “Atribuídos a mim” no cabeçalho do quadro de equipe, para ver só o que é seu." },
      { tipo: "novo", texto: "Comentários e histórico de atividade em cada cartão." },
      { tipo: "novo", texto: "Foto de perfil, em Minha conta (os colegas de equipe também veem)." },
      { tipo: "novo", texto: "Prioridade nos cartões, com filtros por prioridade e por atrasados." },
      { tipo: "novo", texto: "Arquivar cartões (Opções do quadro → Arquivados) em vez de excluir." },
      { tipo: "melhorado", texto: "Ao excluir ou arquivar um cartão, aparece o aviso “Desfazer”." },
      { tipo: "melhorado", texto: "Novo cartão de novidades, com a versão do app e o histórico (menu da conta → O que há de novo)." },
    ],
  },
]

// Quais entradas a pessoa ainda não viu. Nunca viu nada (null): só a mais recente,
// para não despejar o histórico inteiro de uma vez.
export function novidadesNaoVistas(ultimaVista: string | null) {
  if (ultimaVista === null) return NOVIDADES.slice(0, 1)
  return NOVIDADES.filter((novidade) => novidade.id > ultimaVista)
}

// Contagem por tipo de uma entrada (ex.: { novo: 7, melhorado: 2 }).
export function contarPorTipo(novidade: Novidade) {
  const contagem: Partial<Record<TipoNovidade, number>> = {}
  for (const item of novidade.itens) contagem[item.tipo] = (contagem[item.tipo] ?? 0) + 1
  return contagem
}
