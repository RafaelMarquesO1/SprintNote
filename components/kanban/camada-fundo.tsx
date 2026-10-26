"use client"

// Rafael Marques - 26/10/2026
// Fundo do quadro (modelo neutro ou foto). Fica atrás de todo o conteúdo, sem receber cliques,
// e preso à tela: rolar o quadro não estica nem corta a foto. Visibilidade e brilho da foto vêm
// do ajuste automático (leitura-foto.ts). Ao trocar de fundo, a nova camada esmaece.

import { estilosDaFoto, resolverFundoQuadro, type AjusteAutomatico, type AjusteFoto } from "@/lib/kanban/fundo"
import type { QuadroKanban } from "@/lib/tipos"
import { cn } from "@/lib/utils"

// A foto com o ajuste aplicado (no quadro e nas miniaturas).
export function FotoDeFundo({ imagem, ajuste, automatico, className }: { imagem: string; ajuste: AjusteFoto; automatico: AjusteAutomatico; className?: string }) {
  const { foto, veu } = estilosDaFoto(imagem, ajuste, automatico)
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0" style={foto} />
      {veu && <div className="absolute inset-0" style={veu} />}
    </div>
  )
}

export function CamadaFundo({
  quadro,
  automatico,
  rascunho,
}: {
  quadro: QuadroKanban
  automatico: AjusteAutomatico
  // Enquanto a pessoa ajusta a foto, o quadro mostra o rascunho ao vivo.
  rascunho?: { imagem: string; ajuste: AjusteFoto } | null
}) {
  const resolvido = resolverFundoQuadro(quadro.fundo, quadro.imagemFundo)
  const foto = rascunho ?? (resolvido?.tipo === "foto" ? { imagem: quadro.imagemFundo!, ajuste: resolvido.ajuste } : null)
  if (!foto && !resolvido) return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {/* Do tamanho da tela e grudado no topo enquanto o quadro rola. */}
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <div key={foto ? foto.imagem.slice(-48) : resolvido!.tipo === "modelo" ? resolvido!.id : "x"} className="animacao-fundo absolute inset-0">
          {foto ? (
            <FotoDeFundo imagem={foto.imagem} ajuste={foto.ajuste} automatico={automatico} />
          ) : (
            resolvido?.tipo === "modelo" && <div className="absolute inset-0" style={{ background: resolvido.valor }} />
          )}
        </div>
      </div>
    </div>
  )
}
