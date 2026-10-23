"use client"

// Rafael Marques - 23/10/2026
// Conteúdo da janela "Equipes" do Kanban: criar equipes, ver quadros, gerenciar
// membros e convites.

import { useState } from "react"
import { PlusIcon, UsersIcon } from "lucide-react"

import { useConta } from "@/components/conta/portao-conta"
import { CartaoEquipe } from "@/components/equipes/cartao-equipe"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { chamarApi, mensagemDoErro } from "@/lib/equipes/api"
import { useEquipes } from "@/lib/estado/equipes"
import { recarregarEquipes } from "@/lib/estado/sincronizacao-equipes"

function NovaEquipe({ aoCriar, destaque = false }: { aoCriar: () => void; destaque?: boolean }) {
  const [nome, setNome] = useState("")
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  return (
    <form
      className="space-y-2"
      onSubmit={async (evento) => {
        evento.preventDefault()
        if (!nome.trim()) return
        setOcupado(true)
        setErro(null)
        try {
          await chamarApi("/api/equipes", { metodo: "POST", corpo: { nome } })
          await recarregarEquipes()
          setNome("")
          aoCriar()
        } catch (falha) {
          setErro(mensagemDoErro(falha))
        } finally {
          setOcupado(false)
        }
      }}
    >
      <div className="flex gap-2">
        <Input
          autoFocus={destaque}
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          maxLength={80}
          placeholder="Nome da equipe (ex.: Time de Produto)"
          aria-label="Nome da nova equipe"
          className="h-9"
        />
        <Button type="submit" disabled={ocupado || !nome.trim()}>
          {ocupado ? <Spinner /> : <PlusIcon />} Criar equipe
        </Button>
      </div>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    </form>
  )
}

export function ConteudoEquipes() {
  const conta = useConta()
  const equipes = useEquipes((estado) => estado.equipes)
  const carregado = useEquipes((estado) => estado.carregado)
  const [criando, setCriando] = useState(false)
  const meuId = conta?.usuario.id ?? ""

  if (!carregado) return <Skeleton className="h-48 w-full" />

  if (equipes.length === 0) {
    return (
      <div className="space-y-4 rounded-xl border border-dashed p-6 text-center">
        <UsersIcon className="mx-auto size-8 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium">Você ainda não está em nenhuma equipe</p>
          <p className="text-sm text-muted-foreground">Crie uma para compartilhar um quadro, ou abra o link de convite que recebeu.</p>
        </div>
        <NovaEquipe aoCriar={() => undefined} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {equipes.length} {equipes.length === 1 ? "equipe" : "equipes"} · {equipes.reduce((total, equipe) => total + equipe.membros.length, 0)} pessoa(s)
        </p>
        <Button size="sm" variant={criando ? "ghost" : "outline"} onClick={() => setCriando(!criando)}>
          <PlusIcon /> Nova equipe
        </Button>
      </div>
      {criando && (
        <div className="rounded-xl border p-4">
          <NovaEquipe destaque aoCriar={() => setCriando(false)} />
        </div>
      )}
      {equipes.map((equipe) => (
        <CartaoEquipe key={equipe.id} equipe={equipe} meuId={meuId} />
      ))}
    </div>
  )
}
