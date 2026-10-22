// Rafael Marques - 21/10/2026
// Paleta de cores do app (tons médios: funcionam no tema claro e no escuro).

import type { CSSProperties } from "react"

export const paletaCores = [
  { id: "azul", nome: "Azul", valor: "oklch(0.6 0.15 255)" },
  { id: "verde", nome: "Verde", valor: "oklch(0.62 0.14 155)" },
  { id: "laranja", nome: "Laranja", valor: "oklch(0.68 0.16 55)" },
  { id: "roxo", nome: "Roxo", valor: "oklch(0.6 0.17 300)" },
  { id: "rosa", nome: "Rosa", valor: "oklch(0.65 0.17 350)" },
  { id: "vermelho", nome: "Vermelho", valor: "oklch(0.6 0.19 25)" },
  { id: "amarelo", nome: "Amarelo", valor: "oklch(0.75 0.14 90)" },
  { id: "cinza", nome: "Cinza", valor: "oklch(0.6 0.01 260)" },
]

// Rafael Marques - 22/10/2026
// Fundos dos quadros do Kanban: só tons de cinza (seguem o visual preto e branco)
// e feitos com a cor do texto em baixa opacidade, então funcionam no claro e no escuro.
const tracoFundo = "color-mix(in oklch, var(--foreground) 9%, transparent)"
export const fundosQuadro = [
  { id: "pontos", nome: "Pontos", valor: `radial-gradient(color-mix(in oklch, var(--foreground) 20%, transparent) 1px, transparent 1.3px) 0 0 / 20px 20px` },
  { id: "quadriculado", nome: "Quadriculado", valor: `linear-gradient(${tracoFundo} 1px, transparent 1px) 0 0 / 28px 28px, linear-gradient(90deg, ${tracoFundo} 1px, transparent 1px) 0 0 / 28px 28px` },
  { id: "diagonal", nome: "Diagonal", valor: `repeating-linear-gradient(135deg, ${tracoFundo} 0 1px, transparent 1px 14px)` },
  { id: "nevoa", nome: "Névoa", valor: "linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 7%, transparent), transparent 70%)" },
  { id: "cinza", nome: "Cinza", valor: "color-mix(in oklch, var(--foreground) 5%, transparent)" },
  { id: "grafite", nome: "Grafite", valor: "color-mix(in oklch, var(--foreground) 10%, transparent)" },
]

// Quadros antigos guardavam o degradê colorido inteiro; agora viram o fundo neutro mais próximo.
const fundosAntigos: Record<string, string> = {
  ceu: "nevoa", menta: "nevoa", "por-do-sol": "nevoa", lavanda: "nevoa", areia: "cinza", grafite: "grafite",
}

// Recebe o que está salvo no quadro (id novo ou degradê antigo) e devolve o id do fundo.
export function idFundoQuadro(fundo: string | null | undefined) {
  if (!fundo) return null
  if (fundosQuadro.some((item) => item.id === fundo)) return fundo
  const antigo = gradientesCapa.find((item) => item.valor === fundo)
  return antigo ? fundosAntigos[antigo.id] : null
}

export function estiloFundoQuadro(fundo: string | null | undefined): CSSProperties | undefined {
  const id = idFundoQuadro(fundo)
  const item = fundosQuadro.find((opcao) => opcao.id === id)
  return item ? { background: item.valor } : undefined
}

// Degradês das capas dos livros (eram os fundos antigos do Kanban).
export const gradientesCapa = [
  { id: "ceu", nome: "Céu", valor: "linear-gradient(135deg, oklch(0.75 0.08 240 / 35%), oklch(0.8 0.06 200 / 25%))" },
  { id: "menta", nome: "Menta", valor: "linear-gradient(135deg, oklch(0.78 0.08 165 / 35%), oklch(0.82 0.06 130 / 25%))" },
  { id: "por-do-sol", nome: "Pôr do sol", valor: "linear-gradient(135deg, oklch(0.78 0.1 50 / 35%), oklch(0.75 0.1 350 / 25%))" },
  { id: "lavanda", nome: "Lavanda", valor: "linear-gradient(135deg, oklch(0.75 0.09 300 / 35%), oklch(0.8 0.06 260 / 25%))" },
  { id: "areia", nome: "Areia", valor: "linear-gradient(135deg, oklch(0.85 0.05 85 / 40%), oklch(0.8 0.04 60 / 25%))" },
  { id: "grafite", nome: "Grafite", valor: "linear-gradient(135deg, oklch(0.5 0.01 260 / 25%), oklch(0.4 0.01 260 / 20%))" },
]

// ---------- Livros ----------
// Rafael Marques - 21/10/2026

// Cor automática de cada livro (pela ordem de criação), quando ele não tem cor escolhida.
export const coresLivroPadrao = ["var(--grafo-1)", "var(--grafo-2)", "var(--grafo-3)", "var(--grafo-4)", "var(--grafo-5)", "var(--grafo-6)"]

export function corDoLivro(livros: { id: string; cor?: string | null }[], id: string | null | undefined) {
  if (!id) return undefined
  const indice = livros.findIndex((livro) => livro.id === id)
  if (indice < 0) return undefined
  return livros[indice].cor || coresLivroPadrao[indice % coresLivroPadrao.length]
}

// Estilos de capa do cartão do livro. Os de "padrão" usam a cor do livro;
// os gradientes ficam em `gradientesCapa`.
export const capasLivro = [
  { id: "pontos", nome: "Pontos" },
  { id: "listras", nome: "Listras" },
  { id: "quadriculado", nome: "Quadriculado" },
  { id: "ondas", nome: "Brilho" },
  { id: "degrade", nome: "Degradê" },
  { id: "solida", nome: "Cor sólida" },
  ...gradientesCapa.map((fundo) => ({ id: fundo.id, nome: fundo.nome })),
  { id: "nenhuma", nome: "Sem capa" },
]

export function estiloCapaLivro(capa: string | null | undefined, cor: string): { backgroundImage?: string; backgroundColor?: string; backgroundSize?: string } {
  const base = `linear-gradient(135deg, color-mix(in oklch, ${cor} 75%, transparent), color-mix(in oklch, ${cor} 25%, transparent))`
  const clarear = "color-mix(in oklch, white 22%, transparent)"
  switch (capa ?? "pontos") {
    case "listras":
      return { backgroundImage: `repeating-linear-gradient(45deg, ${clarear} 0 2px, transparent 2px 12px), ${base}` }
    case "quadriculado":
      return {
        backgroundImage: `linear-gradient(${clarear} 1px, transparent 1px), linear-gradient(90deg, ${clarear} 1px, transparent 1px), ${base}`,
        backgroundSize: "16px 16px, 16px 16px, 100% 100%",
      }
    case "ondas":
      return { backgroundImage: `radial-gradient(circle at 20% 120%, color-mix(in oklch, white 35%, transparent), transparent 55%), radial-gradient(circle at 90% -20%, color-mix(in oklch, ${cor} 90%, transparent), transparent 60%), ${base}` }
    case "degrade":
      return { backgroundImage: base }
    case "solida":
      return { backgroundColor: cor }
    case "nenhuma":
      return { backgroundColor: "var(--muted)" }
    case "pontos":
      return { backgroundImage: `radial-gradient(${clarear} 1px, transparent 1.4px), ${base}`, backgroundSize: "14px 14px, 100% 100%" }
    default: {
      const fundo = gradientesCapa.find((item) => item.id === capa)
      return fundo ? { backgroundImage: fundo.valor } : { backgroundImage: base }
    }
  }
}

// Rafael Marques - 22/10/2026
// Faixa colorida reta no topo ou à esquerda de um contêiner arredondado.
// Feita com imagem de fundo (e não box-shadow inset, que entorta nos cantos
// e apaga o "ring" dos cartões): o canto arredondado só corta a ponta da faixa.
export function estiloFaixa(cor: string, lado: "topo" | "esquerda" = "topo", espessura = 3): CSSProperties {
  return {
    backgroundImage: `linear-gradient(${cor}, ${cor})`,
    backgroundSize: lado === "topo" ? `100% ${espessura}px` : `${espessura}px 100%`,
    backgroundRepeat: "no-repeat",
  }
}
