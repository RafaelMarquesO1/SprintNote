"use client"

// Rafael Marques - 23/10/2026
// Cartão "O que há de novo": abre sozinho depois do login quando há novidade que a pessoa
// ainda não viu (com a versão do app, o resumo e os itens agrupados por tipo) e pode ser
// aberto de novo pelo menu da conta, com o histórico.
// Rafael Marques - 26/10/2026: visual refeito (cabeçalho fixo, lista rolável de verdade, itens com
// título e ícone) e só a versão mais recente fica aberta; as outras ficam recolhidas.

import { useState } from "react"
import { ChevronDownIcon, TrendingUpIcon, WrenchIcon, PlusIcon, type LucideIcon } from "lucide-react"
import { create } from "zustand"

import { IconeApp } from "@/components/conta/marca-app"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { usePreferencias } from "@/lib/estado/preferencias"
import { NOVIDADES, novidadesNaoVistas, ordemTipos, rotulosNovidade, type Novidade, type TipoNovidade } from "@/lib/novidades"
import { VERSAO_APP } from "@/lib/versao"
import { cn } from "@/lib/utils"

const iconesTipo: Record<TipoNovidade, LucideIcon> = { novo: PlusIcon, melhorado: TrendingUpIcon, corrigido: WrenchIcon }

// "O que há de novo" no menu da conta abre o histórico completo.
const useHistoricoAberto = create<{ aberto: boolean }>(() => ({ aberto: false }))
export const abrirHistoricoDeNovidades = () => useHistoricoAberto.setState({ aberto: true })

// Itens da versão, em grupos (Novos, Melhorados, Corrigidos), cada um com ícone, título e frase curta.
function ItensPorTipo({ novidade }: { novidade: Novidade }) {
  return (
    <div className="space-y-4">
      {ordemTipos.map((tipo) => {
        const itens = novidade.itens.filter((item) => item.tipo === tipo)
        if (itens.length === 0) return null
        const Icone = iconesTipo[tipo]
        return (
          <div key={tipo} className="space-y-2">
            <h4 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{itens.length === 1 ? rotulosNovidade[tipo].singular : rotulosNovidade[tipo].plural}</h4>
            <ul className="space-y-2.5">
              {itens.map((item) => (
                <li key={item.texto} className="flex gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Icone className="size-3.5" />
                  </span>
                  <p className="min-w-0 text-sm leading-relaxed text-muted-foreground">
                    {item.titulo && <strong className="block font-semibold text-foreground">{item.titulo}</strong>}
                    {item.texto}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export function CartaoNovidades() {
  const ultimaVista = usePreferencias((estado) => estado.novidadesVistas)
  const marcarVistas = usePreferencias((estado) => estado.marcarNovidadesVistas)
  const historico = useHistoricoAberto((estado) => estado.aberto)
  // Fechou nesta visita: não reabre até a próxima vez que entrar.
  const [dispensado, setDispensado] = useState(false)
  const [verTudo, setVerTudo] = useState(false)

  const naoVistas = novidadesNaoVistas(ultimaVista)
  const idsNaoVistas = new Set(naoVistas.map((novidade) => novidade.id))
  const aberto = historico || (naoVistas.length > 0 && !dispensado)
  const mostrarHistorico = historico || verTudo
  const lista = mostrarHistorico ? NOVIDADES : naoVistas
  const haMais = NOVIDADES.length > naoVistas.length

  function fechar() {
    setDispensado(true)
    setVerTudo(false)
    useHistoricoAberto.setState({ aberto: false })
    marcarVistas(NOVIDADES[0].id)
  }

  return (
    <Dialog open={aberto} onOpenChange={(valor) => !valor && fechar()}>
      <DialogContent className="flex max-h-[min(40rem,90svh)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <header className="shrink-0 border-b px-6 pt-6 pr-14 pb-4">
          <div className="flex items-center gap-3">
            {/* Rafael Marques - 23/10/2026: logo do sistema no lugar do ícone genérico */}
            <IconeApp className="size-11 shrink-0 shadow-none" />
            <div className="min-w-0">
              <DialogTitle className="text-lg">O que há de novo</DialogTitle>
              <DialogDescription>
                Você está na versão <strong className="font-semibold text-foreground">v{VERSAO_APP}</strong>
                {!mostrarHistorico && naoVistas.length > 1 && ` · ${naoVistas.length} atualizações desde a sua última visita`}
              </DialogDescription>
            </div>
          </div>
        </header>

        <div className="rolagem-fina min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto px-6 py-5">
          {lista.map((novidade, indice) => {
            const ehNova = idsNaoVistas.has(novidade.id)
            const cabecalho = (
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={ehNova ? "default" : "outline"}>v{novidade.versao}</Badge>
                  {ehNova && <Badge variant="secondary">Novo para você</Badge>}
                  <span className="text-xs text-muted-foreground">{novidade.data}</span>
                </div>
                <h3 className="text-base leading-snug font-semibold">{novidade.titulo}</h3>
              </div>
            )
            // Só a versão mais recente fica aberta; as outras recolhidas (tocar para abrir).
            if (indice > 0) {
              return (
                <details key={novidade.id} className="group rounded-xl border bg-card">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-xl p-4 outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                    {cabecalho}
                    <ChevronDownIcon className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-4 px-4 pb-4">
                    <p className="text-sm text-muted-foreground">{novidade.resumo}</p>
                    <ItensPorTipo novidade={novidade} />
                  </div>
                </details>
              )
            }
            return (
              <section key={novidade.id} className={cn("space-y-4 rounded-xl border p-4", ehNova ? "bg-muted/40" : "bg-card")}>
                {cabecalho}
                <p className="text-sm leading-relaxed">{novidade.resumo}</p>
                <ItensPorTipo novidade={novidade} />
              </section>
            )
          })}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-6 py-3">
          {!historico && haMais ? (
            <Button variant="ghost" size="sm" onClick={() => setVerTudo(!verTudo)}>
              {verTudo ? "Ver só as novidades" : "Ver histórico completo"}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">SprintNote v{VERSAO_APP}</span>
          )}
          <Button onClick={fechar}>Entendi</Button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
