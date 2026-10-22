import { RotateCcwIcon } from "lucide-react"

import { IconeApp } from "@/components/conta/marca-app"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

// Rafael Marques - 21/10/2026
// Tela de carregamento: nome e ícone do app no centro enquanto a sessão
// é conferida e os dados da conta são baixados.
export function TelaAbertura({ mensagem, erro, aoTentarDeNovo }: { mensagem?: string; erro?: string | null; aoTentarDeNovo?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-background p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_60%)]" />
      <div className="relative flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-700">
        <IconeApp tamanho="lg" />
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">SprintNote</h1>
          <p className="text-sm text-muted-foreground">Notas, tarefas, hábitos e rotina em um só lugar</p>
        </div>
      </div>

      <div className="relative flex h-10 flex-col items-center gap-2 text-sm text-muted-foreground animate-in fade-in delay-300 duration-700 fill-mode-both">
        {erro ? (
          <>
            <p className="text-destructive">{erro}</p>
            {aoTentarDeNovo && (
              <Button variant="outline" size="sm" onClick={aoTentarDeNovo}>
                <RotateCcwIcon /> Tentar de novo
              </Button>
            )}
          </>
        ) : (
          <>
            <Spinner className="size-5" />
            {mensagem && <p>{mensagem}</p>}
          </>
        )}
      </div>
    </div>
  )
}
