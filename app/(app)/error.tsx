"use client"

import { useEffect } from "react"
import { RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

// Erro (8.15): diz o que aconteceu, oferece "Tentar de novo" e mostra o código para suporte.
export default function ErroDaPagina({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  const codigo = typeof error === "object" && error !== null && "digest" in error ? String((error as { digest?: string }).digest ?? "") : ""

  return (
    <div className="flex flex-col items-start gap-5 py-16">
      <h1 className="font-display text-display-md text-paper">Algo deu errado ao carregar esta parte.</h1>
      <p className="max-w-[52ch] text-body text-ink-soft">Seus dados continuam salvos. Tente de novo; se o problema continuar, recarregue a página.</p>
      <Button onClick={() => retry()} data-icon="inline-start">
        <RotateCcwIcon /> Tentar de novo
      </Button>
      {codigo ? <p className="font-mono text-code text-ink-muted">Código: {codigo}</p> : null}
    </div>
  )
}
