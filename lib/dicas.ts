// Rafael Marques - 04/11/2026 (v1.5a)
// Dicas de uso: de vez em quando (no máximo uma a cada INTERVALO_DICAS), um cartãozinho no canto
// mostra um recurso do app. Cada dica aparece uma vez; quando todas foram vistas, só voltam a
// aparecer as que chegarem em versões novas.
//
// COMO ATUALIZAR a cada lançamento:
//  1. acrescente as dicas novas NO TOPO da lista, com a "versao" do lançamento (as mais novas
//     aparecem primeiro);
//  2. o "id" nunca muda depois de publicado (é assim que o app sabe o que a pessoa já viu);
//  3. "rota" (opcional) = começo do endereço onde a dica faz mais sentido ("/notas", "/kanban"...).
//     Nessa tela ela tem preferência; nas outras, aparece só se não houver dica da tela.

export type Dica = {
  id: string
  versao: string
  titulo: string
  texto: string
  rota?: string
  // Teclas para mostrar como atalho (ex.: ["Ctrl", "K"]).
  teclas?: string[]
  acao?: { rotulo: string; href: string }
}

// Tempo mínimo entre duas dicas e quanto tempo de uso antes de mostrar uma.
export const INTERVALO_DICAS = 2 * 24 * 60 * 60 * 1000
export const ESPERA_DICA = 40 * 1000

export const DICAS: Dica[] = [
  // v1.5a
  {
    id: "cartao-data-inicio",
    versao: "1.5a",
    titulo: "Cartões que duram vários dias",
    texto: "Em Datas, dentro do cartão, escolha uma data de início além da entrega. No calendário do quadro ele vira uma barra do começo ao fim.",
    rota: "/kanban",
  },
  {
    id: "nota-aparencia",
    versao: "1.5a",
    titulo: "Cada nota com a sua cara",
    texto: "O botão Aparência, no topo da nota, troca fonte, largura, fundo da página e a cor de destaque só daquela nota.",
    rota: "/notas/",
  },
  {
    id: "ligacoes-cartao",
    versao: "1.5a",
    titulo: "Cartões citados à vista",
    texto: "Cite um cartão com [[ dentro da nota: em Ligações, ao lado do texto, aparece uma prévia com status, datas e checklist. Clique para abrir.",
    rota: "/notas/",
  },
  {
    id: "listas-tab",
    versao: "1.5a",
    titulo: "Listas como no Notion",
    texto: "Tab recua um item da lista e Shift+Tab traz de volta. Enter num item vazio sai do nível atual.",
    rota: "/notas/",
    teclas: ["Tab", "Shift", "Tab"],
  },
  // Recursos que já existiam
  {
    id: "paleta-comandos",
    versao: "1.5a",
    titulo: "Ache qualquer coisa rápido",
    texto: "Ctrl+K abre a busca: notas, cadernos, cartões e as telas do app, tudo no mesmo lugar.",
    teclas: ["Ctrl", "K"],
  },
  {
    id: "atribuidos-a-mim",
    versao: "1.5a",
    titulo: "Só os seus cartões",
    texto: "Ctrl+Shift+U liga o filtro Atribuídos a mim e abre os Quadros. Apertando de novo, o filtro sai.",
    teclas: ["Ctrl", "Shift", "U"],
  },
  {
    id: "barra-blocos",
    versao: "1.5a",
    titulo: "Blocos com uma barra",
    texto: "Digite / numa linha da nota para inserir títulos, listas, tabelas, destaques, código ou um diagrama.",
    rota: "/notas/",
    teclas: ["/"],
  },
  {
    id: "mover-blocos",
    versao: "1.5a",
    titulo: "Arrume o texto sem copiar e colar",
    texto: "Alt+Shift+↑ ou ↓ move o bloco onde está o cursor. A alça ⋮⋮ à esquerda também arrasta e transforma blocos.",
    rota: "/notas/",
    teclas: ["Alt", "Shift", "↑"],
  },
  {
    id: "ligar-notas",
    versao: "1.5a",
    titulo: "Ligue suas notas",
    texto: "Digite [[ para ligar uma nota a outra. As ligações aparecem nas duas notas e no Grafo.",
    rota: "/notas",
    acao: { rotulo: "Abrir o Grafo", href: "/grafo" },
  },
  {
    id: "criar-rapido",
    versao: "1.5a",
    titulo: "Criar de qualquer tela",
    texto: "Aperte C (fora de um campo de texto) para criar uma tarefa, nota ou cartão. G e depois N abre uma nota nova.",
    teclas: ["C"],
  },
  {
    id: "atalhos-ajuda",
    versao: "1.5a",
    titulo: "Todos os atalhos",
    texto: "Aperte ? em qualquer tela para ver a lista de atalhos do teclado.",
    teclas: ["?"],
  },
  {
    id: "calendario-quadro",
    versao: "1.5a",
    titulo: "O quadro em calendário",
    texto: "Troque a visão do quadro para Calendário e arraste os cartões entre os dias para mudar a data.",
    rota: "/kanban",
  },
]

// Próxima dica a mostrar: as que a pessoa ainda não viu, primeiro as da tela atual, depois as mais novas.
export function proximaDica(vistas: string[], caminho: string, pular: string[] = []): Dica | null {
  const fora = new Set([...vistas, ...pular])
  const restantes = DICAS.filter((dica) => !fora.has(dica.id))
  return restantes.find((dica) => dica.rota && caminho.startsWith(dica.rota)) ?? restantes.find((dica) => !dica.rota) ?? restantes[0] ?? null
}
