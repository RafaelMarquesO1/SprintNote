"use client"

// Rafael Marques - 23/10/2026
// Cartão "O que há de novo": abre sozinho depois do login quando há novidade que a pessoa
// ainda não viu (com a versão do app, o resumo e os itens agrupados por tipo) e pode ser
// aberto de novo pelo menu da conta, com o histórico.

import { useState } from "react"
import { ChevronDownIcon, TrendingUpIcon, WrenchIcon, PlusIcon, type LucideIcon } from "lucide-react"
import { create } from "zustand"

import { IconeApp } from "@/components/conta/marca-app"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { usePreferencias } from "@/lib/estado/preferencias"
import { contarPorTipo, NOVIDADES, novidadesNaoVistas, ordemTipos, rotulosNovidade, type Novidade, type TipoNovidade } from "@/lib/novidades"
import { VERSAO_APP } from "@/lib/versao"

const iconesTipo: Record<TipoNovidade, LucideIcon> = { novo: PlusIcon, melhorado: TrendingUpIcon, corrigido: WrenchIcon }

// "O que há de novo" no menu da conta abre o histórico completo.
const useHistoricoAberto = create<{ aberto: boolean }>(() => ({ aberto: false }))
export const abrirHistoricoDeNovidades = () => useHistoricoAberto.setState({ aberto: true })

function ResumoContagem({ novidade }: { novidade: Novidade }) {
  const contagem = contarPorTipo(novidade)
  return (
    <p className="text-xs text-muted-foreground">
      {ordemTipos
        .filter((tipo) => contagem[tipo])
        .map((tipo) => `${contagem[tipo]} ${contagem[tipo] === 1 ? rotulosNovidade[tipo].singular.toLowerCase() : rotulosNovidade[tipo].plural.toLowerCase()}`)
        .join(" · ")}
    </p>
  )
}

// Itens da versão, em grupos (Novos, Melhorados, Corrigidos).
function ItensPorTipo({ novidade }: { novidade: Novidade }) {
  return (
    <div className="space-y-3">
      {ordemTipos.map((tipo) => {
        const itens = novidade.itens.filter((item) => item.tipo === tipo)
        if (itens.length === 0) return null
        const Icone = iconesTipo[tipo]
        return (
          <div key={tipo} className="space-y-1.5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <Icone className="size-3.5" /> {itens.length === 1 ? rotulosNovidade[tipo].singular : rotulosNovidade[tipo].plural}
            </h4>
            <ul className="space-y-1.5 border-l pl-3">
              {itens.map((item) => (
                <li key={item.texto} className="text-sm leading-snug">{item.texto}</li>
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
      <DialogContent className="max-h-[88vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <header className="flex items-start gap-3 border-b px-6 pt-6 pr-12 pb-4">
          {/* Rafael Marques - 23/10/2026: logo do sistema no lugar do ícone genérico */}
          <IconeApp className="size-10 shadow-none" />
          <div className="min-w-0 space-y-0.5">
            <DialogTitle>O que há de novo</DialogTitle>
            <DialogDescription>
              Você está na versão <strong className="font-semibold text-foreground">v{VERSAO_APP}</strong>
              {!mostrarHistorico && naoVistas.length > 1 && ` · ${naoVistas.length} atualizações desde a sua última visita`}
            </DialogDescription>
          </div>
        </header>

        <div className="rolagem-fina min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-6 py-5">
          {lista.map((novidade, indice) => {
            const ehNova = idsNaoVistas.has(novidade.id)
            const cabecalho = (
              <>
                <span className="flex flex-wrap items-center gap-2">
                  <Badge variant={ehNova ? "default" : "outline"}>v{novidade.versao}</Badge>
                  {ehNova && <Badge variant="secondary">Novo para você</Badge>}
                  <span className="text-xs text-muted-foreground">{novidade.data}</span>
                </span>
                <span className="mt-1 block text-base font-semibold">{novidade.titulo}</span>
              </>
            )
            // A mais recente aparece aberta; as antigas (só no histórico) ficam recolhidas.
            if (indice > 0 && !ehNova) {
              return (
                <details key={novidade.id} className="group rounded-xl border p-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-2 outline-none">
                    <span className="min-w-0">{cabecalho}</span>
                    <ChevronDownIcon className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 space-y-3">
                    <p className="text-sm text-muted-foreground">{novidade.resumo}</p>
                    <ItensPorTipo novidade={novidade} />
                  </div>
                </details>
              )
            }
            return (
              <section key={novidade.id} className="space-y-3 rounded-xl border bg-muted/30 p-4">
                <div>{cabecalho}</div>
                <p className="text-sm text-muted-foreground">{novidade.resumo}</p>
                <ResumoContagem novidade={novidade} />
                <ItensPorTipo novidade={novidade} />
              </section>
            )
          })}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t px-6 py-3">
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
