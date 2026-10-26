"use client"

// Rafael Marques - 26/10/2026
// O sistema "lê" a foto de fundo (brilho médio, quanto ela varia e o brilho da faixa de cima)
// e, junto com o tema claro/escuro, decide sozinho a visibilidade, o brilho e a cor das letras
// do cabeçalho. A pessoa só cuida do enquadramento, do zoom e do desfoque.

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react"

import { automaticoPadrao, brilhoFinalDoTopo, calcularAutomatico, type AjusteAutomatico, type MedidaFoto } from "@/lib/kanban/fundo"

export type Contraste = "claro" | "escuro"

// Variáveis do tema trocadas só dentro do cabeçalho (cartões e colunas continuam no tema normal).
export const estiloDoContraste: Record<Contraste, CSSProperties> = {
  // Fundo claro atrás: letras escuras.
  claro: {
    "--foreground": "oklch(0.18 0 0)",
    "--muted-foreground": "oklch(0.32 0 0)",
    "--background": "oklch(0.99 0 0)",
    "--border": "oklch(0.18 0 0 / 0.14)",
    "--input": "oklch(0.18 0 0 / 0.16)",
    "--muted": "oklch(1 0 0 / 0.7)",
    "--secondary": "oklch(1 0 0 / 0.7)",
    "--accent": "oklch(1 0 0 / 0.8)",
    color: "oklch(0.18 0 0)",
    textShadow: "0 1px 10px oklch(1 0 0 / 0.55)",
  } as CSSProperties,
  // Fundo escuro atrás: letras claras.
  escuro: {
    "--foreground": "oklch(0.99 0 0)",
    "--muted-foreground": "oklch(0.88 0 0)",
    "--background": "oklch(0.2 0 0)",
    "--border": "oklch(1 0 0 / 0.18)",
    "--input": "oklch(1 0 0 / 0.2)",
    "--muted": "oklch(0 0 0 / 0.35)",
    "--secondary": "oklch(0 0 0 / 0.35)",
    "--accent": "oklch(1 0 0 / 0.15)",
    color: "oklch(0.99 0 0)",
    textShadow: "0 1px 12px oklch(0 0 0 / 0.6)",
  } as CSSProperties,
}

function assinarTema(avisar: () => void) {
  const observador = new MutationObserver(avisar)
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  return () => observador.disconnect()
}

const luminancia = (dados: Uint8ClampedArray, i: number) => (0.2126 * dados[i] + 0.7152 * dados[i + 1] + 0.0722 * dados[i + 2]) / 255

// Mede a foto numa versão pequena (64 × 40).
function medirFoto(imagem: string): Promise<MedidaFoto> {
  return new Promise((resolver, rejeitar) => {
    const elemento = new Image()
    elemento.onload = () => {
      const largura = 64
      const altura = 40
      const tela = document.createElement("canvas")
      tela.width = largura
      tela.height = altura
      const contexto = tela.getContext("2d", { willReadFrequently: true })
      if (!contexto) return rejeitar(new Error("sem canvas"))
      contexto.drawImage(elemento, 0, 0, largura, altura)
      const { data } = contexto.getImageData(0, 0, largura, altura)
      const valores: number[] = []
      for (let i = 0; i < data.length; i += 4) valores.push(luminancia(data, i))
      const media = valores.reduce((soma, valor) => soma + valor, 0) / valores.length
      const variacao = Math.sqrt(valores.reduce((soma, valor) => soma + (valor - media) ** 2, 0) / valores.length)
      // Faixa de cima (onde ficam o título e os filtros).
      const topo = valores.slice(0, largura * Math.round(altura * 0.35))
      const mediaTopo = topo.reduce((soma, valor) => soma + valor, 0) / topo.length
      resolver({ media, variacao, mediaTopo })
    }
    elemento.onerror = () => rejeitar(new Error("imagem"))
    elemento.src = imagem
  })
}

export type LeituraFoto = { automatico: AjusteAutomatico; contraste: Contraste | null }

export function useLeituraDaFoto(imagem: string | null | undefined): LeituraFoto {
  const temaEscuro = useSyncExternalStore(assinarTema, () => document.documentElement.classList.contains("dark"), () => false)
  const [medida, setMedida] = useState<{ imagem: string; valor: MedidaFoto } | null>(null)

  useEffect(() => {
    if (!imagem) return
    let ativo = true
    medirFoto(imagem)
      .then((valor) => ativo && setMedida({ imagem, valor }))
      .catch(() => ativo && setMedida(null))
    return () => {
      ativo = false
    }
  }, [imagem])

  if (!imagem || medida?.imagem !== imagem) return { automatico: automaticoPadrao, contraste: null }
  const automatico = calcularAutomatico(medida.valor, temaEscuro)
  return { automatico, contraste: brilhoFinalDoTopo(medida.valor, automatico, temaEscuro) > 0.55 ? "claro" : "escuro" }
}
