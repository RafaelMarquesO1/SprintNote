// Rafael Marques - 26/10/2026
// Fundos dos quadros do Kanban: poucos modelos neutros (feitos com a cor do texto em
// transparência, então ficam bons no claro e no escuro) e a foto personalizada.
// A foto fica em `quadro.imagemFundo`; o ajuste da pessoa (desfoque, zoom e enquadramento) fica
// em `quadro.fundo` como "foto:{json}". Visibilidade e brilho são calculados pelo sistema, a partir
// da própria foto e do tema, para o quadro continuar legível. Sem dependências (veja fundo.teste.ts).

import type { CSSProperties } from "react"

export type AjusteFoto = {
  // Desfoque em pixels (0 a 24).
  desfoque: number
  // Aproximação: 100 a 250%.
  zoom: number
  // Ponto de foco da foto, em % (0 = esquerda/topo, 100 = direita/base).
  x: number
  y: number
}

// Calculado pelo sistema: quanto a foto aparece e quanto ela é escurecida/clareada.
export type AjusteAutomatico = {
  // 0 a 1.
  visibilidade: number
  // -1 (escurece) a 1 (clareia).
  brilho: number
}

// Medida da foto: brilho médio e variação (0 a 1). Foto "agitada" tem variação alta.
export type MedidaFoto = { media: number; variacao: number; mediaTopo: number }

export const ajusteFotoPadrao: AjusteFoto = { desfoque: 0, zoom: 100, x: 50, y: 50 }
export const automaticoPadrao: AjusteAutomatico = { visibilidade: 0.4, brilho: 0 }

const PREFIXO_FOTO = "foto:"

const traco = "color-mix(in oklch, var(--foreground) 11%, transparent)"

export type ModeloFundo = { id: string; nome: string; valor: string }

// Só neutros: usam a cor do texto com transparência e acompanham o tema claro/escuro.
export const fundosQuadro: ModeloFundo[] = [
  { id: "pontos", nome: "Pontos", valor: `radial-gradient(color-mix(in oklch, var(--foreground) 22%, transparent) 1.2px, transparent 1.7px) 0 0 / 22px 22px` },
  { id: "quadriculado", nome: "Grade", valor: `linear-gradient(${traco} 1px, transparent 1px) 0 0 / 28px 28px, linear-gradient(90deg, ${traco} 1px, transparent 1px) 0 0 / 28px 28px` },
  { id: "nevoa", nome: "Névoa", valor: "linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 9%, transparent), transparent 80%)" },
]

// Fundos de versões anteriores viram o modelo neutro mais parecido.
const fundosAntigos: Record<string, string> = { diagonal: "quadriculado", cinza: "nevoa", grafite: "nevoa" }

export type FundoResolvido = { tipo: "modelo"; id: string; valor: string } | { tipo: "foto"; ajuste: AjusteFoto }

const limitar = (valor: unknown, minimo: number, maximo: number, padrao: number) =>
  typeof valor === "number" && Number.isFinite(valor) ? Math.min(maximo, Math.max(minimo, valor)) : padrao

export function normalizarAjuste(ajuste: Partial<AjusteFoto>): AjusteFoto {
  return {
    desfoque: Math.round(limitar(ajuste.desfoque, 0, 24, 0)),
    zoom: Math.round(limitar(ajuste.zoom, 100, 250, 100)),
    x: Math.round(limitar(ajuste.x, 0, 100, 50)),
    y: Math.round(limitar(ajuste.y, 0, 100, 50)),
  }
}

export function codificarAjusteFoto(ajuste: AjusteFoto) {
  const a = normalizarAjuste(ajuste)
  return PREFIXO_FOTO + JSON.stringify({ d: a.desfoque, z: a.zoom, x: a.x, y: a.y })
}

export function lerAjusteFoto(texto: string): AjusteFoto | null {
  if (!texto.startsWith(PREFIXO_FOTO)) return null
  try {
    const bruto = JSON.parse(texto.slice(PREFIXO_FOTO.length)) as Record<string, unknown>
    // Versões anteriores guardavam a posição como texto ("topo", "centro", "base") e também
    // visibilidade/brilho (agora automáticos, então são ignorados).
    const yAntigo = bruto.p === "topo" ? 0 : bruto.p === "base" ? 100 : undefined
    return normalizarAjuste({ desfoque: bruto.d as number, zoom: bruto.z as number, x: bruto.x as number, y: (bruto.y as number | undefined) ?? yAntigo })
  } catch {
    return null
  }
}

// "fundo" salvo no quadro → o que desenhar. A foto só vale se o quadro tiver a imagem.
export function resolverFundoQuadro(fundo: string | null | undefined, imagem?: string | null): FundoResolvido | null {
  if (!fundo) return null
  const ajuste = lerAjusteFoto(fundo)
  if (ajuste) return imagem ? { tipo: "foto", ajuste } : null
  const id = fundosAntigos[fundo] ?? fundo
  const modelo = fundosQuadro.find((item) => item.id === id)
  // Degradês coloridos antigos (CSS completo salvo no quadro) viram "Névoa".
  if (!modelo) return fundo.includes("gradient(") ? { tipo: "modelo", id: "nevoa", valor: fundosQuadro[2].valor } : null
  return { tipo: "modelo", id: modelo.id, valor: modelo.valor }
}

export const temFundoQuadro = (fundo: string | null | undefined, imagem?: string | null) => resolverFundoQuadro(fundo, imagem) !== null

// Visibilidade e brilho para a foto ficar bonita sem atrapalhar a leitura:
// - foto agitada (muito contraste) aparece menos;
// - no tema claro, foto escura é clareada; no escuro, foto clara é escurecida.
export function calcularAutomatico(medida: MedidaFoto, temaEscuro: boolean): AjusteAutomatico {
  const visibilidade = Math.min(0.75, Math.max(0.3, 0.72 - medida.variacao * 1.4))
  const brilho = temaEscuro ? -Math.min(0.7, Math.max(0.25, (medida.media - 0.1) * 1.2)) : Math.min(0.6, Math.max(0, (0.72 - medida.media) * 1.0))
  return { visibilidade: Number(visibilidade.toFixed(3)), brilho: Number(brilho.toFixed(3)) }
}

// Quão clara fica a área do cabeçalho depois do ajuste automático (0 a 1), para escolher a cor das letras.
export function brilhoFinalDoTopo(medida: MedidaFoto, automatico: AjusteAutomatico, temaEscuro: boolean) {
  let foto = medida.mediaTopo
  if (automatico.brilho < 0) foto *= 1 + automatico.brilho
  if (automatico.brilho > 0) foto += (1 - foto) * automatico.brilho
  const tema = temaEscuro ? 0.08 : 0.98
  return foto * automatico.visibilidade + tema * (1 - automatico.visibilidade)
}

// Estilos das duas camadas da foto: a imagem e o "véu" que escurece ou clareia.
export function estilosDaFoto(imagem: string, ajuste: AjusteFoto, automatico: AjusteAutomatico): { foto: CSSProperties; veu: CSSProperties | null } {
  // O desfoque deixa a borda clara: um pouco de zoom a mais esconde isso.
  const escala = ajuste.zoom / 100 + (ajuste.desfoque > 0 ? 0.04 + ajuste.desfoque / 400 : 0)
  return {
    foto: {
      backgroundImage: `url("${imagem.replace(/"/g, "%22")}")`,
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: `${ajuste.x}% ${ajuste.y}%`,
      transformOrigin: `${ajuste.x}% ${ajuste.y}%`,
      transform: escala !== 1 ? `scale(${escala.toFixed(3)})` : undefined,
      filter: ajuste.desfoque > 0 ? `blur(${ajuste.desfoque}px)` : undefined,
      opacity: automatico.visibilidade,
      transition: "opacity 0.4s ease",
    },
    veu: automatico.brilho === 0 ? null : { background: automatico.brilho < 0 ? "black" : "white", opacity: Math.abs(automatico.brilho), transition: "opacity 0.4s ease" },
  }
}
