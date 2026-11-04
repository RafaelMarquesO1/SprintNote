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
  // Rafael Marques - 04/11/2026: versão 1.5a (Aparência da nota, listas, prévia de cartões, data de início e dicas).
  {
    id: "2026-11-04",
    versao: "1.5a",
    data: "04/11/2026",
    titulo: "Notas mais caprichadas, cartões que duram vários dias e um app melhor no celular",
    resumo: "A Aparência da nota foi refeita e agora tudo nela funciona de verdade, as listas se comportam como no Notion, os cartões ganham prévia e data de início, e o app ficou bem melhor no celular.",
    itens: [
      { tipo: "novo", titulo: "Botão Mais no celular", texto: "A barra de baixo ganhou o Mais, com Biblioteca, Hábitos, Rotina, Grafo, Tags, a busca e a sua conta (antes não dava para chegar nessas telas pelo celular)." },
      { tipo: "melhorado", titulo: "Calendário do quadro no celular", texto: "Os cartões viram barrinhas nos dias. Toque num dia para ver os cartões dele embaixo do calendário e criar um ali." },
      { tipo: "melhorado", titulo: "Hábitos e Rotina no celular", texto: "A semana inteira cabe na tela, sem rolar de lado. O nome do hábito fica numa linha própria e os dias da semana não quebram mais em duas linhas." },
      { tipo: "melhorado", titulo: "Tarefas e cartões no celular", texto: "As abas cabem na tela, o prazo vai para baixo do título (que não some mais), a lista do quadro mostra só o essencial e, no cartão, os botões de Adicionar ficam no topo." },
      { tipo: "novo", titulo: "Data de início nos cartões", texto: "Em Datas, escolha quando o cartão começa. No calendário do quadro ele vira uma barra do início à entrega; com muitos cartões no mesmo dia, cada dia mostra três e um \"+N mais\"." },
      { tipo: "novo", titulo: "Prévia dos cartões citados", texto: "Em Ligações, cada cartão citado na nota aparece com status, quadro, datas, prioridade, checklist e etiquetas. Um clique abre o cartão." },
      { tipo: "novo", titulo: "Dicas de uso", texto: "De vez em quando, uma dica curta aparece no canto da tela mostrando um recurso do app. Dá para pedir uma em \"Dicas de uso\", no menu da conta, ou desligar as automáticas." },
      { tipo: "novo", titulo: "Cor de destaque", texto: "A Aparência da nota ganhou a escolha da cor das caixas de tarefa, marcadores e links." },
      { tipo: "melhorado", titulo: "Aparência da nota repaginada", texto: "Opções em três grupos (Texto, Página, Capa e cabeçalho) com prévias, e \"Voltar ao padrão\" só acende quando algo mudou." },
      { tipo: "melhorado", titulo: "Fonte no título", texto: "Serifada, Mono e Manuscrita agora valem também para o título e os subtítulos da nota." },
      { tipo: "corrigido", titulo: "Largura da nota", texto: "Larga e Tela toda não mudavam nada (a nota ficava presa numa coluna). Agora ocupam a tela, e o painel lateral sai quando apertaria o texto." },
      { tipo: "corrigido", titulo: "Listas", texto: "Tab num item que não pode recuar não tira mais o cursor da nota, e Shift+Tab no primeiro nível não desfaz a lista." },
      { tipo: "corrigido", titulo: "Menu / dentro de listas", texto: "O bloco escolhido nasce logo abaixo do item, e não mais depois da lista inteira. \"Transformar em\" funciona em itens de lista." },
      { tipo: "corrigido", titulo: "Seleção de texto", texto: "Selecionar trechos da nota usa um azul suave, sem inverter as cores dos itens e marcadores." },
      { tipo: "corrigido", titulo: "Tela de apresentação no celular", texto: "Os botões Entrar e Criar conta não encostam mais na borda da tela." },
      { tipo: "corrigido", titulo: "Anotar no Hoje", texto: "Em celulares estreitos, o campo de anotar uma tarefa desce para uma linha própria e mostra o texto inteiro." },
      { tipo: "corrigido", titulo: "Título centralizado", texto: "Caderno, Tags e Editada ficam num bloco alinhado abaixo do título, em vez de espalhados pela página." },
    ],
  },
  // Rafael Marques - 03/11/2026: versão 1.5 (tela de apresentação com prints reais e animações de rolagem).
  {
    id: "2026-11-03-b",
    versao: "1.5",
    data: "03/11/2026",
    titulo: "Uma tela de apresentação mais moderna",
    resumo: "Dei uma modernizada na landing page com um visual mais interativo, permitindo que o usuário que for adentrar ao sistema consiga ter uma noção de como é o sistema antes mesmo de usar.",
    itens: [
      { tipo: "novo", titulo: "Veja por dentro", texto: "Prints reais do app (Hoje, Tarefas, Hábitos, Rotina, Quadro e Nota) que entram e se empilham conforme a rolagem." },
      { tipo: "corrigido", titulo: "Aviso de erro ao trocar de aba", texto: "Sair da aba no meio de uma animação de página ou da troca de tema não mostra mais o erro \"Transition was aborted\"." },
    ],
  },
  // Rafael Marques - 03/11/2026: versão 1.4c (atalho "Atribuídos a mim" e filtros do quadro agrupados, ideia da Paulinha).
  {
    id: "2026-11-03",
    versao: "1.4c",
    data: "03/11/2026",
    titulo: "Um atalho para os seus cartões e filtros mais limpos",
    resumo: "Ctrl+Shift+U leva direto aos cartões atribuídos a você, e os filtros do quadro cabem em dois botões.",
    itens: [
      { tipo: "novo", titulo: "Atalho", texto: "Ctrl+Shift+U (Cmd+Shift+U no Mac) liga o filtro \"Atribuídos a mim\" e abre os Quadros; apertando de novo, o filtro sai." },
      { tipo: "melhorado", titulo: "Botão Atribuídos a mim", texto: "Mostra a contagem e as teclas do atalho no próprio botão." },
      { tipo: "melhorado", titulo: "Filtros do quadro", texto: "Atrasados, Prioridade e Responsável ficam juntos no menu do olho, e as etiquetas, num menu só. Ideia da Paulinha." },
    ],
  },
  // Rafael Marques - 02/11/2026: versão 1.4a (fundos, colunas, animações e correções depois do redesign).
  {
    id: "2026-11-02-b",
    versao: "1.4a",
    data: "02/11/2026",
    titulo: "Fundos que acompanham o que você escreve",
    resumo: "As notas ganharam fundos que seguem cada linha do texto, os quadros ganharam texturas que combinam com o tema e o app ficou mais vivo, sem exagero.",
    itens: [
      { tipo: "novo", titulo: "Caderno", texto: "A pauta volta e passa embaixo de cada linha escrita, em qualquer fonte, tamanho ou espaçamento." },
      { tipo: "novo", titulo: "Foco", texto: "Fundo da nota que mostra a pauta só no parágrafo onde você está escrevendo." },
      { tipo: "novo", titulo: "Texturas no quadro", texto: "Grão, Pontos, Grade, Linhas e Hachura, em preto e branco como o resto do app." },
      { tipo: "melhorado", titulo: "Fundos da nota", texto: "Papel com grão fino e borda de folha; Pontilhado e Quadriculado no ritmo das linhas do texto." },
      { tipo: "melhorado", titulo: "Colunas", texto: "Cada coluna do quadro tem um contorno fino, para ver onde começa e termina." },
      { tipo: "melhorado", titulo: "Cartões", texto: "Prioridade e complexidade aparecem escritas por extenso, para não confundir uma com a outra." },
      { tipo: "melhorado", titulo: "Movimento", texto: "Contadores que rolam, check que se desenha ao concluir, cartões que encolhem ao sair e menus que deslizam." },
      { tipo: "corrigido", titulo: "Quadros de equipe", texto: "Voltaram a abrir depois do redesign." },
      { tipo: "corrigido", titulo: "Capa da nota", texto: "Os botões em cima da capa ficam legíveis em capas escuras." },
    ],
  },
  // Redesign (02/11/2026), versão 1.4.
  {
    id: "2026-11-02",
    versao: "1.4",
    data: "02/11/2026",
    titulo: "Um SprintNote novo, em preto e branco",
    resumo: "O app foi redesenhado inteiro. Ele é preto e branco, e o laranja aparece só onde está o seu momento: a hora atual, o dia de hoje e o prazo de hoje.",
    itens: [
      { tipo: "novo", titulo: "Seu dia", texto: "No Hoje, tarefas, hábitos e rotina numa linha do tempo, com a linha do agora." },
      { tipo: "novo", titulo: "Buscar ou criar", texto: "Ctrl K busca notas, cartões e tags e cria tarefa, nota, hábito ou cartão a partir do que você digitou." },
      { tipo: "novo", titulo: "Atalhos", texto: "G e uma letra para ir a cada tela, C para criar, Ctrl \\ para recolher o menu e ? para ver todos." },
      { tipo: "novo", titulo: "Tinta nas etiquetas", texto: "Cada etiqueta tem um ponto de cor discreto. A capa colorida do cartão pode virar uma etiqueta." },
      { tipo: "melhorado", titulo: "Quadros", texto: "Status por forma (não por cor), filtros que ficam no endereço e cartões mais fáceis de ler." },
      { tipo: "melhorado", titulo: "Notas", texto: "Coluna de leitura, índice “Nesta nota” e as ligações ao lado. Sem a pauta de caderno." },
      { tipo: "melhorado", titulo: "Celular", texto: "Barra inferior com Hoje, Tarefas, Criar, Quadros e Biblioteca; janelas viram gavetas." },
      { tipo: "melhorado", titulo: "Acessibilidade", texto: "Mais contraste, alvos de toque maiores e status que não dependem só de cor." },
    ],
  },
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
