"use client"

import { Suspense, ViewTransition } from "react"
import { cn } from "@/lib/utils"

import { useConta } from "@/components/conta/portao-conta"
import { CartaoNovidades } from "@/components/novidades/cartao-novidades"
import { Atalhos } from "@/components/shell/atalhos"
import { BarraInferior } from "@/components/shell/barra-inferior"
import { CommandPalette } from "@/components/shell/command-palette"
import { DialogoCriar } from "@/components/shell/criar"
import { useTopbar } from "@/components/shell/estado"
import { Sidebar } from "@/components/shell/sidebar"
import { Topbar } from "@/components/shell/topbar"
import { TooltipProvider } from "@/components/ui/tooltip"

// Shell do app (7.2): menu lateral + topbar + conteúdo (1120px, ou 100% em Quadro e Grafo).
// Abaixo de 768px o menu some e entra a barra inferior.
export function Shell({ children }: { children: React.ReactNode }) {
  const largura = useTopbar((estado) => estado.largura)
  // As novidades só aparecem depois de entrar (o shell fica montado, escondido, por baixo da entrada).
  const conta = useConta()
  return (
    <TooltipProvider delay={400}>
      <a
        href="#conteudo"
        className="sr-only z-(--z-toast) rounded-sm bg-paper px-3 py-2 text-ui font-semibold text-night focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense fallback={<div className="h-topbar border-b border-line" />}>
            <Topbar />
          </Suspense>
          <main id="conteudo" tabIndex={-1} className="min-w-0 flex-1 outline-none [scrollbar-gutter:stable] max-md:pb-24">
            <ViewTransition default="page">
              <div className={cn("w-full", largura === "bleed" ? "px-4 py-6 md:px-6" : "mx-auto max-w-content px-4 py-8 md:px-10 md:py-12")}>{children}</div>
            </ViewTransition>
          </main>
        </div>
      </div>
      <BarraInferior />
      <CommandPalette />
      <DialogoCriar />
      <Atalhos />
      {conta ? <CartaoNovidades /> : null}
    </TooltipProvider>
  )
}
