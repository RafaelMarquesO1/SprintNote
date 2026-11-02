import { RotateCcwIcon } from "lucide-react"

import { LogoMark } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

// Rafael Marques - 21/10/2026 · redesign v2
// Carregando a conta: logotipo no centro, fundo preto liso (sem gradiente) e uma mensagem curta.
export function TelaAbertura({ mensagem, erro, aoTentarDeNovo }: { mensagem?: string; erro?: string | null; aoTentarDeNovo?: () => void }) {
  return (
    <div className="fixed inset-0 z-(--z-dialog) flex flex-col items-center justify-center gap-8 bg-night p-6">
      <div className="flex flex-col items-center gap-4">
        <LogoMark size={56} animated />
        <p className="font-display text-title text-paper">SprintNote</p>
      </div>
      <div className="flex min-h-10 flex-col items-center gap-3 text-ui text-ink-soft" role="status" aria-live="polite">
        {erro ? (
          <>
            <p className="text-paper">{erro}</p>
            {aoTentarDeNovo && (
              <Button variant="secondary" size="sm" onClick={aoTentarDeNovo}>
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
