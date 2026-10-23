"use client"

// Rafael Marques - 23/10/2026
// Página aberta pelo link de convite: mostra a equipe e o papel, e a pessoa decide entrar.

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MailOpenIcon, UsersIcon } from "lucide-react"

import { CabecalhoPagina, Pagina } from "@/components/pagina"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { chamarApi, ErroApi, mensagemDoErro } from "@/lib/equipes/api"
import { recarregarEquipes } from "@/lib/estado/sincronizacao-equipes"
import { abrirPainelKanban } from "@/lib/estado/paineis-kanban"
import { descricoesPapel, rotulosPapel, type PrevisaoConvite } from "@/lib/tipos-equipe"

export function PaginaConvite({ token }: { token: string }) {
  const router = useRouter()
  const [previa, setPrevia] = useState<PrevisaoConvite | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)

  useEffect(() => {
    let ativo = true
    chamarApi<PrevisaoConvite>(`/api/convites/${encodeURIComponent(token)}`)
      .then((dados) => ativo && setPrevia(dados))
      .catch((falha) => ativo && setErro(mensagemDoErro(falha)))
    return () => {
      ativo = false
    }
  }, [token])

  async function aceitar() {
    setEntrando(true)
    setErro(null)
    try {
      await chamarApi(`/api/convites/${encodeURIComponent(token)}`, { metodo: "POST", corpo: {} })
      await recarregarEquipes()
      abrirPainelKanban("equipes")
      router.replace("/kanban")
    } catch (falha) {
      setErro(falha instanceof ErroApi ? falha.message : mensagemDoErro(falha))
      setEntrando(false)
    }
  }

  return (
    <Pagina largura="leitura">
      <CabecalhoPagina secao="Colaboração · Convite" icone={MailOpenIcon} titulo="Convite para uma equipe" />
      {!previa && !erro && <Skeleton className="h-40 w-full" />}
      {erro && !previa && (
        <div className="space-y-3 rounded-xl border p-6">
          <p role="alert" className="text-sm text-destructive">{erro}</p>
          <Button variant="outline" nativeButton={false} render={<Link href="/kanban" />}>Ir para o Kanban</Button>
        </div>
      )}
      {previa && (
        <div className="space-y-5 rounded-xl border p-6">
          <div className="flex items-start gap-3">
            <UsersIcon className="mt-1 size-6 shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-lg font-semibold">{previa.equipeNome}</p>
              <p className="text-sm text-muted-foreground">
                {previa.convidadoPor ? `${previa.convidadoPor} convidou você` : "Você foi convidado"} como <strong className="text-foreground">{rotulosPapel[previa.papel]}</strong>.{" "}
                {descricoesPapel[previa.papel]}
              </p>
              {previa.restritoAoEmail && <p className="text-xs text-muted-foreground">Este convite só funciona para o e-mail da conta convidada.</p>}
            </div>
          </div>
          <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            Ao entrar, os membros da equipe passam a ver seu nome, e-mail e foto de perfil, e os comentários que você fizer nos cartões. Você pode sair da
            equipe quando quiser, no botão Equipes do Kanban.
          </p>
          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
          <div className="flex gap-2">
            <Button onClick={aceitar} disabled={entrando}>{entrando && <Spinner />} Entrar na equipe</Button>
            <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>Agora não</Button>
          </div>
        </div>
      )}
    </Pagina>
  )
}
