// Rafael Marques - 26/10/2026
// Quadros prontos para começar sem tela em branco: a pessoa escolhe e só troca os textos.

import { novoIdQuadro, type FormaQuadro, type NoQuadro, type Quadro, type SetaQuadro } from "./modelo"

export type ModeloQuadro = { id: string; nome: string; descricao: string; criar: () => Quadro }

function peca(forma: FormaQuadro, x: number, y: number, texto: string, extras: Partial<NoQuadro> = {}): NoQuadro {
  const padrao = { retangulo: [180, 70], arredondado: [180, 70], circulo: [130, 130], losango: [180, 120], adesiva: [170, 130], texto: [160, 40] }[forma]
  return { id: novoIdQuadro("n"), tipo: "forma", forma, x, y, largura: padrao[0], altura: padrao[1], texto, ...extras }
}

function seta(de: NoQuadro, para: NoQuadro, deLado: SetaQuadro["deLado"], paraLado: SetaQuadro["paraLado"], rotulo = ""): SetaQuadro {
  return { id: novoIdQuadro("s"), de: de.id, para: para.id, deLado, paraLado, rotulo, tracejada: false, ponta: "fim" }
}

export const modelosQuadro: ModeloQuadro[] = [
  {
    id: "fluxograma",
    nome: "Fluxograma",
    descricao: "Passos e uma decisão com sim e não",
    criar: () => {
      const inicio = peca("arredondado", 0, 0, "Início", { cor: "verde" })
      const passo = peca("retangulo", 0, 140, "Fazer o primeiro passo")
      const decisao = peca("losango", -10, 270, "Deu certo?", { cor: "amarelo" })
      const sim = peca("arredondado", 260, 295, "Concluir", { cor: "verde" })
      const nao = peca("retangulo", -260, 295, "Ajustar e tentar de novo")
      return {
        versao: 1,
        nos: [inicio, passo, decisao, sim, nao],
        setas: [seta(inicio, passo, "baixo", "cima"), seta(passo, decisao, "baixo", "cima"), seta(decisao, sim, "direita", "esquerda", "Sim"), seta(decisao, nao, "esquerda", "direita", "Não"), { ...seta(nao, passo, "cima", "esquerda"), tracejada: true }],
      }
    },
  },
  {
    id: "mapa-mental",
    nome: "Mapa mental",
    descricao: "Tema central com quatro ramos",
    criar: () => {
      const centro = peca("circulo", 0, 0, "Tema central", { cor: "azul" })
      const ramos = [
        peca("arredondado", 260, -20, "Ideia 1"),
        peca("arredondado", -260, -20, "Ideia 2"),
        peca("arredondado", 40, -190, "Ideia 3"),
        peca("arredondado", 40, 170, "Ideia 4"),
      ]
      return {
        versao: 1,
        nos: [centro, ...ramos],
        setas: [seta(centro, ramos[0], "direita", "esquerda"), seta(centro, ramos[1], "esquerda", "direita"), seta(centro, ramos[2], "cima", "baixo"), seta(centro, ramos[3], "baixo", "cima")],
      }
    },
  },
  {
    id: "linha-do-tempo",
    nome: "Linha do tempo",
    descricao: "Etapas em sequência",
    criar: () => {
      const etapas = ["Etapa 1", "Etapa 2", "Etapa 3", "Etapa 4"].map((texto, indice) => peca("retangulo", indice * 260, 0, texto))
      return { versao: 1, nos: etapas, setas: etapas.slice(1).map((etapa, indice) => seta(etapas[indice], etapa, "direita", "esquerda")) }
    },
  },
  {
    id: "ideias",
    nome: "Quadro de ideias",
    descricao: "Notas adesivas dentro de um grupo",
    criar: () => {
      const grupo: NoQuadro = { id: novoIdQuadro("g"), tipo: "grupo", forma: "retangulo", x: -20, y: -50, largura: 640, altura: 250, texto: "Ideias" }
      const cores = ["amarelo", "rosa", "azul"]
      const adesivas = cores.map((cor, indice) => peca("adesiva", indice * 200, 0, `Ideia ${indice + 1}`, { cor }))
      return { versao: 1, nos: [grupo, ...adesivas], setas: [] }
    },
  },
]
