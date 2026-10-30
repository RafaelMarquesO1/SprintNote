// Rafael Marques - 23/10/2026
// Novidades do SprintNote: o cartão "O que há de novo" mostra, uma vez depois do login,
// o que mudou desde a última vez que a pessoa viu.
//
// COMO ATUALIZAR a cada lançamento (funcionalidade ou correção):
//  1. acrescente uma entrada NO TOPO da lista;
//  2. "id" = data (AAAA-MM-DD); se houver mais de uma no dia, "-b", "-c"... O id precisa ficar
//     "maior" que o da entrada anterior, pois é assim que o app sabe o que é novo;
//  3. "versao" = o texto que aparece no app (campo "versaoExibida" do package.json, ex.: "1.1a"); suba também
//     o "version" do package.json (o npm exige três números, ex.: 1.1.1).

export type TipoNovidade = "novo" | "melhorado" | "corrigido"

export type Novidade = {
  id: string
  versao: string
  data: string
  titulo: string
  // Uma frase que resume o lançamento (aparece em destaque).
  resumo: string
  // "titulo" (opcional) aparece em negrito antes do texto; mantenha o texto curto (uma frase).
  itens: { tipo: TipoNovidade; titulo?: string; texto: string }[]
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
  // Rafael Marques - 30/10/2026: versão 1.3b (Início, apresentação e sincronização entre aparelhos).
  {
    id: "2026-10-30",
    versao: "1.3b",
    data: "30/10/2026",
    titulo: "Início mais útil e nada se perde entre aparelhos",
    resumo: "O Início resume o seu dia e deixa anotar algo na hora, e usar o SprintNote em mais de um aparelho ao mesmo tempo não apaga mais o que foi salvo no outro.",
    itens: [
      { tipo: "novo", titulo: "Resumo do dia", texto: "Debaixo da saudação: tarefas de hoje, atrasadas, cartões, hábitos e rotina. Cada número leva à tela dele." },
      { tipo: "novo", titulo: "Captura rápida", texto: "Um campo no topo para criar na hora uma tarefa para hoje ou uma nota." },
      { tipo: "novo", titulo: "Meus cartões", texto: "Widget com os seus cartões em aberto de todos os quadros, inclusive os atribuídos a você nas equipes." },
      { tipo: "melhorado", titulo: "Tela de apresentação", texto: "A primeira tela, antes de entrar, foi refeita: cada funcionalidade tem a sua seção, com uma ilustração que dá para experimentar." },
      { tipo: "melhorado", titulo: "Modo Personalizar", texto: "No botão “Personalizar”, cada widget ganha uma barra para mover, escolher a largura e configurar, e uma alça de altura no canto. Ao mover, o destino mostra “Soltar aqui”. No dia a dia o Início fica limpo." },
      { tipo: "melhorado", titulo: "Sempre atualizado", texto: "Ao voltar para a aba, o app busca o que você mudou em outro aparelho." },
      { tipo: "corrigido", titulo: "Mudanças em dois aparelhos", texto: "Se outro aparelho salvou antes, o app junta as duas versões em vez de trocar uma pela outra." },
      { tipo: "corrigido", titulo: "Aba fechada no meio do envio", texto: "O que não chegou a ser salvo é juntado na próxima vez que você abrir o app." },
    ],
  },
  // Rafael Marques - 29/10/2026
  {
    id: "2026-10-29-c",
    versao: "1.3a",
    data: "29/10/2026",
    titulo: "Cartão sabe onde foi citado",
    resumo: "O cartão mostra onde você o citou nas suas notas, e os créditos listam as tecnologias de verdade.",
    itens: [
      { tipo: "novo", titulo: "Notas em que o cartão foi citado", texto: "O cartão mostra em quais das suas notas ele foi citado, separando seção de nota individual. A equipe não vê as suas notas." },
      { tipo: "melhorado", titulo: "Créditos", texto: "A página de créditos traz todas as tecnologias usadas, organizadas por área." },
    ],
  },
  // Rafael Marques - 29/10/2026: versão 1.3.
  {
    id: "2026-10-29-b",
    versao: "1.3",
    data: "29/10/2026",
    titulo: "SprintNote 1.3: Kanban no estilo Trello",
    resumo: "Cartões repaginados, com número, modelos, texto formatado e histórico de quem mudou — e cartões citados dentro das notas.",
    itens: [
      { tipo: "novo", titulo: "Cartão repaginado", texto: "Resumo no topo, “Adicionar ao cartão” e “Ações” na lateral, como no Trello." },
      { tipo: "novo", titulo: "Texto formatado nos cartões", texto: "Descrição e comentários com editor visual: negrito, listas, tarefas e blocos de código coloridos (o trecho selecionado vira código)." },
      { tipo: "novo", titulo: "Número do cartão", texto: "Cada cartão tem um número no quadro (#12), que aparece no cartão e no endereço — também nos quadros de equipe." },
      { tipo: "novo", titulo: "Citar cartão na nota", texto: "Digite “[[” ou use “/” Citar cartão: o cartão aparece como etiqueta “#12 Título” e abre ao clicar." },
      { tipo: "novo", titulo: "Modelos de cartão", texto: "Salve um cartão como modelo e crie outros iguais pelo ícone ao lado de “Adicionar cartão”." },
      { tipo: "novo", titulo: "Quem fez", texto: "O histórico do cartão mostra quem fez cada mudança, numa linha do tempo separada dos comentários." },
      { tipo: "novo", titulo: "Minimizar código", texto: "Blocos de código nas notas podem ser minimizados e copiados, no editor e na leitura, agora com cores também na leitura." },
      { tipo: "novo", titulo: "Mais ícones e cores", texto: "Mais de cem ícones novos, paleta com 16 cores e a opção de escolher qualquer cor." },
      { tipo: "melhorado", titulo: "Seções", texto: "Nota com outras notas dentro aparece como seção na biblioteca (com o ícone que você escolher) e como quadrado no grafo." },
      { tipo: "melhorado", titulo: "Calendário mais fácil", texto: "No calendário do Kanban, o “+” de cada dia cria um cartão com aquela data ou agenda um que está sem prazo." },
      { tipo: "melhorado", titulo: "Comentários", texto: "Comentários em cartões próprios, mais fáceis de ler." },
      { tipo: "melhorado", titulo: "Etiquetas e equipes", texto: "As telas de etiquetas do quadro e de equipes ficaram mais organizadas." },
      { tipo: "melhorado", titulo: "Sem “Bloqueado por”", texto: "A opção de bloquear um cartão por outro foi retirada para simplificar." },
    ],
  },
  // Rafael Marques - 29/10/2026
  {
    id: "2026-10-29",
    versao: "1.2d",
    data: "29/10/2026",
    titulo: "Sugestões do Kaíke",
    resumo: "Diagramas Mermaid nas notas, tags consertadas e importação do Obsidian mais fiel — ideias do Kaíke. Valeu, Kaíke!",
    itens: [
      { tipo: "novo", titulo: "Diagramas Mermaid", texto: "Blocos ```mermaid viram desenho dentro da nota (use “/” Diagrama Mermaid) e abrem em tela cheia, com zoom e arrastar." },
      { tipo: "novo", titulo: "Livro e tarefas", texto: "Na página do livro, escolha se as caixinhas das notas dele aparecem em Tarefas ou ficam só nas notas." },
      { tipo: "novo", titulo: "Menu lateral do tamanho certo", texto: "No computador, arraste a borda do menu para alargar ou estreitar; duplo clique volta ao padrão." },
      { tipo: "corrigido", titulo: "Tags",texto: "#projeto agora aparece na lista quando você usa #projeto/fase-1, tags digitadas no “+” ficam limpas e as tags do texto também podem ser tiradas pelo “x”." },
      { tipo: "corrigido", titulo: "Importação do Obsidian", texto: "Caixinhas como [/] e [-], links para arquivos .md, tabelas sem barras, fórmulas $$ e HTML simples agora entram formatados." },
      { tipo: "corrigido", titulo: "Quebra de texto", texto: "Títulos, endereços e códigos compridos quebram de linha em vez de vazar para o lado." },
    ],
  },
  // Rafael Marques - 27/10/2026
  {
    id: "2026-10-27",
    versao: "1.2c",
    data: "27/10/2026",
    titulo: "Prazo com a data que você quiser",
    resumo: "Além de @hoje e @amanhã, agora dá para escolher qualquer dia no calendário.",
    itens: [
      { tipo: "novo", titulo: "Escolher data", texto: "Digite “@” e escolha “Escolher data…”, ou use o comando “/” Prazo: escolher data. O calendário tem atalhos como próxima segunda e fim do mês." },
      { tipo: "melhorado", titulo: "Sugestões ao digitar @", texto: "Hoje, amanhã e os dias da semana aparecem na hora, e datas digitadas (como @25/11) mostram o dia certo antes de inserir." },
    ],
  },
  // Rafael Marques - 26/10/2026
  {
    id: "2026-10-26-c",
    versao: "1.2b",
    data: "26/10/2026",
    titulo: "Complexidade nos cartões",
    resumo: "Marque cada cartão do Kanban como de complexidade baixa, média ou alta.",
    itens: [
      { tipo: "novo", titulo: "Complexidade", texto: "Baixa, média ou alta em cada cartão, com barrinhas na frente do cartão, coluna na lista e progresso no resumo do quadro." },
    ],
  },
  // Rafael Marques - 26/10/2026
  {
    id: "2026-10-26-b",
    versao: "1.2a",
    data: "26/10/2026",
    titulo: "Kanban turbinado",
    resumo: "Novas formas de ver e organizar o Kanban, cartões mais completos e fundo com a sua foto.",
    itens: [
      { tipo: "novo", titulo: "Kanban em lista e calendário", texto: "Veja o quadro como lista ou calendário e agrupe em raias por pessoa, prioridade ou etiqueta." },
      { tipo: "novo", titulo: "Mais nos cartões", texto: "Anexos, repetição e bloqueios, também nos quadros de equipe, além de um resumo do quadro." },
      { tipo: "novo", titulo: "Modelos e importação", texto: "Crie quadros prontos (Sprint, Estudos, Atendimento…) e exporte ou importe quadros." },
      { tipo: "melhorado", titulo: "Fundo com a sua foto", texto: "Use uma foto como fundo do quadro e enquadre direto no quadro. Brilho, transparência e a cor das letras se ajustam sozinhos ao tema; você escolhe zoom e desfoque." },
    ],
  },
  // Rafael Marques - 26/10/2026
  {
    id: "2026-10-26",
    versao: "1.2",
    data: "26/10/2026",
    titulo: "Novo editor e quadros livres",
    resumo: "Escreva com o texto já formatado e desenhe ideias em quadros.",
    itens: [
      { tipo: "novo", titulo: "Novo editor", texto: "Texto formatado na hora, menu “/” para inserir blocos, imagens e tabelas." },
      { tipo: "novo", titulo: "Quadros", texto: "Tela livre com formas, notas e setas, com modelos prontos." },
      { tipo: "novo", titulo: "Biblioteca organizada", texto: "Árvore na barra lateral: arraste para mover e dê duplo clique para renomear." },
      { tipo: "melhorado", titulo: "Notas em Markdown", texto: "Exportação, tags e grafo funcionam como antes." },
    ],
  },
  // Rafael Marques - 23/10/2026
  {
    id: "2026-10-23-d",
    versao: "1.1b",
    data: "23/10/2026",
    titulo: "Importe do Obsidian e enquadre sua foto",
    resumo: "Traga seu cofre do Obsidian para o SprintNote e escolha o enquadramento da sua foto de perfil.",
    itens: [
      { tipo: "novo", texto: "Minha conta → Seus dados → Importar do Obsidian: pasta do cofre, .zip ou notas .md. Pastas viram livros, #tags e [[links]] são mantidos." },
      { tipo: "novo", texto: "Enquadramento da foto de perfil: arraste e use o zoom antes de salvar." },
      { tipo: "corrigido", texto: "Cartão “Privacidade e sessões” sem o espaço vazio no meio." },
    ],
  },
  // Rafael Marques - 23/10/2026
  {
    id: "2026-10-23-c",
    versao: "1.1a",
    data: "23/10/2026",
    titulo: "Kanban mais compacto no celular",
    resumo: "O quadro ganhou um layout enxuto em telas pequenas, com mais espaço para os cartões.",
    itens: [
      { tipo: "melhorado", texto: "Cabeçalho do Kanban mais enxuto no celular, com botões só de ícone." },
      { tipo: "melhorado", texto: "Filtros recolhidos atrás do botão “Filtros”, que mostra quantos estão ativos." },
      { tipo: "melhorado", texto: "Colunas um pouco mais estreitas: um pedaço da próxima coluna aparece, indicando que dá para rolar." },
      { tipo: "melhorado", texto: "Faixa da equipe e cartões com menos espaço sobrando." },
    ],
  },
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
