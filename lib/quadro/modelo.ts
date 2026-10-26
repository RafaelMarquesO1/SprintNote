// Rafael Marques - 23/10/2026
// Modelo do "quadro" (como o Canvas do Obsidian): formas, cartões de nota e grupos soltos numa
// tela infinita, ligados por setas. Fica guardado como JSON em `nota.conteudo`. Sem dependências
// (roda em Node: veja modelo.teste.ts).

export type FormaQuadro = "retangulo" | "arredondado" | "circulo" | "losango" | "adesiva" | "texto"
export type TipoNoQuadro = "forma" | "nota" | "grupo"
export type LadoQuadro = "cima" | "direita" | "baixo" | "esquerda"
export type PontaSeta = "fim" | "ambos" | "nenhuma"

export type NoQuadro = {
  id: string
  tipo: TipoNoQuadro
  x: number
  y: number
  largura: number
  altura: number
  // Texto da forma ou título do grupo.
  texto: string
  forma: FormaQuadro
  // id da cor na paleta (undefined = cinza padrão).
  cor?: string
  // Cartão de nota: id da nota mostrada.
  notaId?: string
}

export type SetaQuadro = {
  id: string
  de: string
  para: string
  deLado?: LadoQuadro
  paraLado?: LadoQuadro
  rotulo: string
  tracejada: boolean
  ponta: PontaSeta
  cor?: string
}

export type Quadro = {
  versao: 1
  nos: NoQuadro[]
  setas: SetaQuadro[]
}

// Cores só aparecem quando a pessoa escolhe (o padrão é cinza).
export const coresQuadro: { id: string; nome: string; valor: string }[] = [
  { id: "amarelo", nome: "Amarelo", valor: "oklch(0.8 0.15 90)" },
  { id: "laranja", nome: "Laranja", valor: "oklch(0.72 0.17 55)" },
  { id: "vermelho", nome: "Vermelho", valor: "oklch(0.64 0.2 25)" },
  { id: "rosa", nome: "Rosa", valor: "oklch(0.7 0.18 350)" },
  { id: "roxo", nome: "Roxo", valor: "oklch(0.62 0.19 300)" },
  { id: "azul", nome: "Azul", valor: "oklch(0.64 0.16 255)" },
  { id: "verde", nome: "Verde", valor: "oklch(0.68 0.16 150)" },
]

export const tamanhoPadrao: Record<FormaQuadro | "nota" | "grupo", { largura: number; altura: number }> = {
  retangulo: { largura: 180, altura: 80 },
  arredondado: { largura: 180, altura: 80 },
  circulo: { largura: 110, altura: 110 },
  losango: { largura: 160, altura: 110 },
  adesiva: { largura: 170, altura: 150 },
  texto: { largura: 160, altura: 40 },
  nota: { largura: 260, altura: 150 },
  grupo: { largura: 420, altura: 280 },
}

export const nomesForma: Record<FormaQuadro, string> = {
  retangulo: "Retângulo",
  arredondado: "Arredondado",
  circulo: "Círculo",
  losango: "Decisão",
  adesiva: "Nota adesiva",
  texto: "Texto solto",
}

export function quadroVazio(): Quadro {
  return { versao: 1, nos: [], setas: [] }
}

let contador = 0
export function novoIdQuadro(prefixo = "q") {
  contador++
  return `${prefixo}${Date.now().toString(36)}${contador.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`
}

const formasValidas: FormaQuadro[] = ["retangulo", "arredondado", "circulo", "losango", "adesiva", "texto"]
const lados: LadoQuadro[] = ["cima", "direita", "baixo", "esquerda"]

const numero = (valor: unknown, padrao: number) => (typeof valor === "number" && Number.isFinite(valor) ? valor : padrao)

// Lê o JSON com tolerância: dados estranhos viram valores padrão, nunca quebram a tela.
export function lerQuadro(conteudo: string): Quadro {
  if (!conteudo.trim()) return quadroVazio()
  let bruto: unknown
  try {
    bruto = JSON.parse(conteudo)
  } catch {
    return quadroVazio()
  }
  if (typeof bruto !== "object" || bruto === null) return quadroVazio()
  const origem = bruto as { nos?: unknown; setas?: unknown }
  const nos: NoQuadro[] = []
  for (const item of Array.isArray(origem.nos) ? origem.nos : []) {
    if (typeof item !== "object" || item === null || typeof (item as { id?: unknown }).id !== "string") continue
    const no = item as Record<string, unknown>
    const tipo: TipoNoQuadro = no.tipo === "nota" || no.tipo === "grupo" ? no.tipo : "forma"
    const forma = formasValidas.includes(no.forma as FormaQuadro) ? (no.forma as FormaQuadro) : "retangulo"
    const base = tamanhoPadrao[tipo === "forma" ? forma : tipo]
    nos.push({
      id: no.id as string,
      tipo,
      x: numero(no.x, 0),
      y: numero(no.y, 0),
      largura: Math.max(40, numero(no.largura, base.largura)),
      altura: Math.max(24, numero(no.altura, base.altura)),
      texto: typeof no.texto === "string" ? no.texto : "",
      forma,
      ...(typeof no.cor === "string" ? { cor: no.cor } : {}),
      ...(typeof no.notaId === "string" ? { notaId: no.notaId } : {}),
    })
  }
  const ids = new Set(nos.map((no) => no.id))
  const setas: SetaQuadro[] = []
  for (const item of Array.isArray(origem.setas) ? origem.setas : []) {
    if (typeof item !== "object" || item === null) continue
    const seta = item as Record<string, unknown>
    if (typeof seta.id !== "string" || typeof seta.de !== "string" || typeof seta.para !== "string") continue
    if (!ids.has(seta.de) || !ids.has(seta.para)) continue
    setas.push({
      id: seta.id,
      de: seta.de,
      para: seta.para,
      ...(lados.includes(seta.deLado as LadoQuadro) ? { deLado: seta.deLado as LadoQuadro } : {}),
      ...(lados.includes(seta.paraLado as LadoQuadro) ? { paraLado: seta.paraLado as LadoQuadro } : {}),
      rotulo: typeof seta.rotulo === "string" ? seta.rotulo : "",
      tracejada: seta.tracejada === true,
      ponta: seta.ponta === "ambos" || seta.ponta === "nenhuma" ? seta.ponta : "fim",
      ...(typeof seta.cor === "string" ? { cor: seta.cor } : {}),
    })
  }
  return { versao: 1, nos, setas }
}

export function escreverQuadro(quadro: Quadro) {
  return JSON.stringify(quadro)
}

// Cria uma forma centrada no ponto (coordenadas do quadro).
export function novaForma(forma: FormaQuadro, centro: { x: number; y: number }, texto = ""): NoQuadro {
  const { largura, altura } = tamanhoPadrao[forma]
  return { id: novoIdQuadro("n"), tipo: "forma", forma, x: Math.round(centro.x - largura / 2), y: Math.round(centro.y - altura / 2), largura, altura, texto }
}

export function novoGrupo(centro: { x: number; y: number }): NoQuadro {
  const { largura, altura } = tamanhoPadrao.grupo
  return { id: novoIdQuadro("g"), tipo: "grupo", forma: "retangulo", x: Math.round(centro.x - largura / 2), y: Math.round(centro.y - altura / 2), largura, altura, texto: "Grupo" }
}

export function novoCartaoNota(notaId: string, centro: { x: number; y: number }): NoQuadro {
  const { largura, altura } = tamanhoPadrao.nota
  return { id: novoIdQuadro("c"), tipo: "nota", forma: "retangulo", x: Math.round(centro.x - largura / 2), y: Math.round(centro.y - altura / 2), largura, altura, texto: "", notaId }
}

// Remove nós e as setas que dependiam deles.
export function removerNos(quadro: Quadro, ids: string[]): Quadro {
  const fora = new Set(ids)
  return { ...quadro, nos: quadro.nos.filter((no) => !fora.has(no.id)), setas: quadro.setas.filter((seta) => !fora.has(seta.de) && !fora.has(seta.para)) }
}

// Duplica nós (com as setas que ligam dois deles), deslocados.
export function duplicarNos(quadro: Quadro, ids: string[], deslocamento = 32): { quadro: Quadro; novosIds: string[] } {
  const mapa = new Map<string, string>()
  const copias: NoQuadro[] = []
  for (const no of quadro.nos) {
    if (!ids.includes(no.id)) continue
    const novoId = novoIdQuadro(no.tipo === "grupo" ? "g" : no.tipo === "nota" ? "c" : "n")
    mapa.set(no.id, novoId)
    copias.push({ ...no, id: novoId, x: no.x + deslocamento, y: no.y + deslocamento })
  }
  const setasCopiadas = quadro.setas.filter((seta) => mapa.has(seta.de) && mapa.has(seta.para)).map((seta) => ({ ...seta, id: novoIdQuadro("s"), de: mapa.get(seta.de)!, para: mapa.get(seta.para)! }))
  return { quadro: { ...quadro, nos: [...quadro.nos, ...copias], setas: [...quadro.setas, ...setasCopiadas] }, novosIds: [...mapa.values()] }
}

// Resumo em texto (busca e prévia): títulos dos grupos e textos das formas.
export function textoDoQuadro(conteudo: string) {
  return lerQuadro(conteudo)
    .nos.map((no) => no.texto)
    .filter(Boolean)
    .join(" · ")
}
