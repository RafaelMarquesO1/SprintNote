"use client"

// Rafael Marques - 23/10/2026
// Janela "Equipes" do Kanban (não é uma página): criar equipes, convidar pessoas
// e ver os quadros compartilhados. Abre por cima do quadro.

import { UsersIcon } from "lucide-react"

import { ConteudoEquipes } from "@/components/equipes/conteudo-equipes"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { abrirPainelKanban, fecharPainelKanban, usePaineisKanban } from "@/lib/estado/paineis-kanban"

// Botão no cabeçalho do quadro.
export function BotaoEquipes() {
  return (
    <Button variant="outline" size="sm" className="bg-background/70" onClick={() => abrirPainelKanban("equipes")}>
      <UsersIcon /> <span className="hidden sm:inline">Equipes</span>
    </Button>
  )
}

export function PaineisKanban() {
  const aberto = usePaineisKanban((estado) => estado.aberto)
  return (
    <Dialog open={aberto === "equipes"} onOpenChange={(valor) => !valor && fecharPainelKanban()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogTitle>Equipes</DialogTitle>
        <DialogDescription>Compartilhe quadros do Kanban, atribua cartões a pessoas e comentem juntos.</DialogDescription>
        {aberto === "equipes" && <ConteudoEquipes />}
      </DialogContent>
    </Dialog>
  )
}
