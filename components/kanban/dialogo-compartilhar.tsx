"use client"

// Rafael Marques - 23/10/2026
// "Compartilhar com equipe": leva um quadro pessoal para uma equipe.

import { useState } from "react"
import { UsersIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { mensagemDoErro } from "@/lib/equipes/api"
import { useEquipes } from "@/lib/estado/equipes"
import { compartilharQuadroPessoal } from "@/lib/estado/sincronizacao-equipes"
import type { QuadroKanban } from "@/lib/tipos"

export function DialogoCompartilhar({
  quadro,
  aberto,
  aoMudarAberto,
}: {
  quadro: QuadroKanban
  aberto: boolean
  aoMudarAberto: (aberto: boolean) => void
}) {
  const equipes = useEquipes((estado) => estado.equipes)
  const [escolhida, setEscolhida] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const possiveis = equipes.filter((equipe) => equipe.meuPapel !== "leitor")
  const alvo = escolhida ?? possiveis[0]?.id ?? null

  async function compartilhar() {
    if (!alvo) return
    setOcupado(true)
    setErro(null)
    try {
      await compartilharQuadroPessoal(quadro.id, alvo)
      aoMudarAberto(false)
    } catch (falha) {
      setErro(mensagemDoErro(falha))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Compartilhar “{quadro.titulo}”</DialogTitle>
        <DialogDescription>
          O quadro passa a ser da equipe: sai da sua lista pessoal e as pessoas da equipe veem as colunas, os cartões, os comentários e o histórico.
          Os vínculos dos cartões com suas notas são desfeitos (as notas continuam só suas).
        </DialogDescription>
        <ul className="space-y-1">
          {possiveis.map((equipe) => (
            <li key={equipe.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-[:checked]:border-foreground">
                <input type="radio" name="equipe" checked={alvo === equipe.id} onChange={() => setEscolhida(equipe.id)} className="accent-primary" />
                <UsersIcon className="size-4 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{equipe.nome}</span>
                <span className="text-xs text-muted-foreground">{equipe.membros.length} pessoa(s)</span>
              </label>
            </li>
          ))}
        </ul>
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => aoMudarAberto(false)}>Cancelar</Button>
          <Button onClick={compartilhar} disabled={ocupado || !alvo}>{ocupado && <Spinner />} Compartilhar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
