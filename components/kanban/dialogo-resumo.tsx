"use client"

// Rafael Marques - 26/10/2026
// Resumo do quadro (relatório da sprint): andamento, o que está atrasado ou vence logo,
// distribuição por coluna, prioridade, etiqueta e pessoa, e pontos de estimativa.
// "Copiar resumo" gera um texto pronto para colar em e-mail ou nota.

import { useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useHoje } from "@/hooks/use-hoje"
import { somarDias } from "@/lib/datas"
import type { MembroEquipe } from "@/lib/tipos-equipe"
import type { CartaoKanban, ColunaKanban, EtiquetaKanban, QuadroKanban } from "@/lib/tipos"
import { cn } from "@/lib/utils"

function Barra({ valor, total, className }: { valor: number; total: number; className?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full bg-foreground/70", className)} style={{ width: `${total ? Math.round((valor / total) * 100) : 0}%` }} />
    </div>
  )
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 rounded-xl border p-3.5">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{titulo}</h3>
      {children}
    </section>
  )
}

export function DialogoResumo({
  aberto,
  aoMudarAberto,
  quadro,
  colunas,
  cartoes,
  membros,
  aoAbrirCartao,
}: {
  aberto: boolean
  aoMudarAberto: (aberto: boolean) => void
  quadro: QuadroKanban
  colunas: ColunaKanban[]
  // Cartões do quadro (sem arquivados).
  cartoes: CartaoKanban[]
  membros?: MembroEquipe[]
  aoAbrirCartao: (cartao: CartaoKanban) => void
}) {
  const hoje = useHoje()
  const [copiado, setCopiado] = useState(false)

  const idsConcluidas = new Set(colunas.filter((coluna) => coluna.concluida).map((coluna) => coluna.id))
  const feitos = cartoes.filter((cartao) => idsConcluidas.has(cartao.colunaId))
  const abertos = cartoes.filter((cartao) => !idsConcluidas.has(cartao.colunaId))
  const atrasados = abertos.filter((cartao) => hoje && cartao.prazo && cartao.prazo < hoje).sort((a, b) => (a.prazo! < b.prazo! ? -1 : 1))
  const venceLogo = abertos.filter((cartao) => hoje && cartao.prazo && cartao.prazo >= hoje && cartao.prazo <= somarDias(hoje, 7)).sort((a, b) => (a.prazo! < b.prazo! ? -1 : 1))
  const semPrazo = abertos.filter((cartao) => !cartao.prazo).length
  const percentual = cartoes.length ? Math.round((feitos.length / cartoes.length) * 100) : 0
  const pontos = (lista: CartaoKanban[]) => lista.reduce((soma, cartao) => soma + (cartao.estimativa ?? 0), 0)
  const bloqueados = abertos.filter((cartao) =>
    cartao.bloqueadoPor.some((id) => {
      const outro = cartoes.find((item) => item.id === id)
      return outro && !idsConcluidas.has(outro.colunaId)
    })
  ).length
  const porPrioridade = (["alta", "media", "baixa"] as const).map((prioridade) => ({
    prioridade,
    rotulo: { alta: "Alta", media: "Média", baixa: "Baixa" }[prioridade],
    total: abertos.filter((cartao) => cartao.prioridade === prioridade).length,
  }))
  const porEtiqueta = quadro.etiquetas
    .map((etiqueta: EtiquetaKanban) => ({ etiqueta, total: cartoes.filter((cartao) => cartao.etiquetas.includes(etiqueta.id)).length }))
    .filter((item) => item.total > 0)
  const porPessoa = (membros ?? [])
    .map((membro) => ({ membro, abertos: abertos.filter((cartao) => cartao.responsavelId === membro.id).length, feitos: feitos.filter((cartao) => cartao.responsavelId === membro.id).length }))
    .filter((item) => item.abertos + item.feitos > 0)

  function textoDoResumo() {
    const linhas = [
      `Resumo do quadro “${quadro.titulo}”${hoje ? ` — ${hoje.split("-").reverse().join("/")}` : ""}`,
      `${cartoes.length} cartões · ${feitos.length} concluídos (${percentual}%) · ${abertos.length} em aberto`,
      ...(pontos(cartoes) > 0 ? [`Pontos: ${pontos(feitos)} de ${pontos(cartoes)} concluídos`] : []),
      "",
      "Por coluna:",
      ...colunas.map((coluna) => `- ${coluna.titulo}: ${cartoes.filter((cartao) => cartao.colunaId === coluna.id).length}`),
    ]
    if (atrasados.length) linhas.push("", `Atrasados (${atrasados.length}):`, ...atrasados.map((cartao) => `- ${cartao.titulo} (prazo ${cartao.prazo!.split("-").reverse().join("/")})`))
    if (venceLogo.length) linhas.push("", `Vencem em 7 dias (${venceLogo.length}):`, ...venceLogo.map((cartao) => `- ${cartao.titulo} (${cartao.prazo!.split("-").reverse().join("/")})`))
    return linhas.join("\n")
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent className="flex max-h-[90svh] flex-col gap-3 sm:max-w-2xl">
        <div className="pr-8">
          <DialogTitle>Resumo de “{quadro.titulo}”</DialogTitle>
          <DialogDescription>Como o quadro está agora.</DialogDescription>
        </div>

        <div className="rolagem-fina min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { valor: cartoes.length, texto: "cartões" },
              { valor: `${percentual}%`, texto: "concluído" },
              { valor: abertos.length, texto: "em aberto" },
              { valor: atrasados.length, texto: atrasados.length === 1 ? "atrasado" : "atrasados", alerta: atrasados.length > 0 },
            ].map((item) => (
              <div key={item.texto} className="rounded-xl border p-3 text-center">
                <p className={cn("text-2xl font-semibold tabular-nums", item.alerta && "text-destructive")}>{item.valor}</p>
                <p className="text-xs text-muted-foreground">{item.texto}</p>
              </div>
            ))}
          </div>
          <Barra valor={feitos.length} total={cartoes.length} />

          {pontos(cartoes) > 0 && (
            <Bloco titulo="Pontos de estimativa">
              <p className="text-sm">
                <strong className="tabular-nums">{pontos(feitos)}</strong> de <strong className="tabular-nums">{pontos(cartoes)}</strong> pontos concluídos
                <span className="text-muted-foreground"> · faltam {pontos(abertos)}</span>
              </p>
              <Barra valor={pontos(feitos)} total={pontos(cartoes)} />
            </Bloco>
          )}

          <Bloco titulo="Por coluna">
            <ul className="space-y-1.5">
              {colunas.map((coluna) => {
                const total = cartoes.filter((cartao) => cartao.colunaId === coluna.id).length
                return (
                  <li key={coluna.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{coluna.titulo}{coluna.limite !== null && <span className="text-xs text-muted-foreground"> · limite {coluna.limite}</span>}</span>
                      <span className={cn("tabular-nums", coluna.limite !== null && total > coluna.limite && "font-medium text-destructive")}>{total}</span>
                    </div>
                    <Barra valor={total} total={Math.max(1, cartoes.length)} />
                  </li>
                )
              })}
            </ul>
          </Bloco>

          {(atrasados.length > 0 || venceLogo.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {atrasados.length > 0 && (
                <Bloco titulo={`Atrasados (${atrasados.length})`}>
                  <ul className="space-y-1">
                    {atrasados.slice(0, 8).map((cartao) => (
                      <li key={cartao.id}>
                        <button type="button" onClick={() => aoAbrirCartao(cartao)} className="flex w-full items-baseline justify-between gap-2 text-left text-sm hover:underline">
                          <span className="truncate">{cartao.titulo}</span>
                          <span className="shrink-0 text-xs text-destructive">{cartao.prazo!.split("-").reverse().slice(0, 2).join("/")}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Bloco>
              )}
              {venceLogo.length > 0 && (
                <Bloco titulo={`Vencem em 7 dias (${venceLogo.length})`}>
                  <ul className="space-y-1">
                    {venceLogo.slice(0, 8).map((cartao) => (
                      <li key={cartao.id}>
                        <button type="button" onClick={() => aoAbrirCartao(cartao)} className="flex w-full items-baseline justify-between gap-2 text-left text-sm hover:underline">
                          <span className="truncate">{cartao.titulo}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{cartao.prazo!.split("-").reverse().slice(0, 2).join("/")}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Bloco>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Bloco titulo="Em aberto, por prioridade">
              <ul className="space-y-1 text-sm">
                {porPrioridade.map((item) => (
                  <li key={item.prioridade} className="flex justify-between">
                    <span>{item.rotulo}</span>
                    <span className="tabular-nums">{item.total}</span>
                  </li>
                ))}
                <li className="flex justify-between text-muted-foreground">
                  <span>Sem prazo</span>
                  <span className="tabular-nums">{semPrazo}</span>
                </li>
                {bloqueados > 0 && (
                  <li className="flex justify-between text-muted-foreground">
                    <span>Bloqueados</span>
                    <span className="tabular-nums">{bloqueados}</span>
                  </li>
                )}
              </ul>
            </Bloco>
            {porEtiqueta.length > 0 && (
              <Bloco titulo="Por etiqueta">
                <ul className="space-y-1 text-sm">
                  {porEtiqueta.map(({ etiqueta, total }) => (
                    <li key={etiqueta.id} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full" style={{ background: etiqueta.cor }} /> {etiqueta.nome}
                      </span>
                      <span className="tabular-nums">{total}</span>
                    </li>
                  ))}
                </ul>
              </Bloco>
            )}
            {porPessoa.length > 0 && (
              <Bloco titulo="Por pessoa">
                <ul className="space-y-1 text-sm">
                  {porPessoa.map(({ membro, abertos: emAberto, feitos: prontos }) => (
                    <li key={membro.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{membro.nome}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{emAberto} em aberto · {prontos} prontos</span>
                    </li>
                  ))}
                </ul>
              </Bloco>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              void navigator.clipboard?.writeText(textoDoResumo())
              setCopiado(true)
              setTimeout(() => setCopiado(false), 1800)
            }}
          >
            {copiado ? <CheckIcon /> : <CopyIcon />} {copiado ? "Copiado" : "Copiar resumo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
