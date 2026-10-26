"use client"

// Rafael Marques - 26/10/2026
// Kanban em lista: todos os cartões do quadro numa tabela que se ordena pelas colunas, com
// troca de coluna direto na linha.

import { useMemo, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, FlagIcon, LockIcon, PaperclipIcon, RepeatIcon } from "lucide-react"

import { estilosPrioridade } from "@/components/kanban/cartao-kanban"
import { useHoje } from "@/hooks/use-hoje"
import { useKanban } from "@/lib/estado/kanban"
import { rotuloPrazo } from "@/lib/tarefas-notas"
import type { CartaoKanban, ColunaKanban, EtiquetaKanban, Prioridade } from "@/lib/tipos"
import { cn } from "@/lib/utils"

type Chave = "titulo" | "coluna" | "prioridade" | "prazo" | "estimativa"
const pesoPrioridade: Record<Prioridade, number> = { alta: 3, media: 2, baixa: 1 }

export function VisaoLista({
  cartoes,
  colunas,
  etiquetas,
  vidro,
  aoAbrir,
}: {
  cartoes: CartaoKanban[]
  colunas: ColunaKanban[]
  etiquetas: EtiquetaKanban[]
  vidro: boolean
  aoAbrir: (cartao: CartaoKanban) => void
}) {
  const hoje = useHoje()
  const moverCartao = useKanban((estado) => estado.moverCartao)
  const [ordem, setOrdem] = useState<{ chave: Chave; crescente: boolean } | null>(null)

  const linhas = useMemo(() => {
    const posicaoColuna = new Map(colunas.map((coluna, indice) => [coluna.id, indice]))
    const lista = [...cartoes]
    if (!ordem) return lista
    const sinal = ordem.crescente ? 1 : -1
    const valor = (cartao: CartaoKanban): string | number => {
      switch (ordem.chave) {
        case "titulo":
          return cartao.titulo.toLowerCase()
        case "coluna":
          return posicaoColuna.get(cartao.colunaId) ?? 0
        case "prioridade":
          return cartao.prioridade ? pesoPrioridade[cartao.prioridade] : 0
        case "prazo":
          return cartao.prazo ?? "9999-99-99"
        case "estimativa":
          return cartao.estimativa ?? -1
      }
    }
    return lista.sort((a, b) => {
      const va = valor(a)
      const vb = valor(b)
      return (va < vb ? -1 : va > vb ? 1 : 0) * sinal
    })
  }, [cartoes, colunas, ordem])

  function clicar(chave: Chave) {
    setOrdem((atual) => (atual?.chave === chave ? (atual.crescente ? { chave, crescente: false } : null) : { chave, crescente: true }))
  }

  // Função comum (não componente): devolve o cabeçalho clicável de cada coluna da tabela.
  const cabecalho = (chave: Chave, texto: string) => (
    <th scope="col" aria-sort={ordem?.chave === chave ? (ordem.crescente ? "ascending" : "descending") : "none"} className="px-3 py-2 text-left font-medium">
      <button type="button" onClick={() => clicar(chave)} className="flex items-center gap-1 hover:text-foreground">
        {texto}
        {ordem?.chave === chave && (ordem.crescente ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />)}
      </button>
    </th>
  )

  return (
    <div className="px-4 pt-2 pb-6 md:px-6 md:pt-4">
      <div className={cn("overflow-x-auto rounded-xl border", vidro ? "bg-card/90 backdrop-blur-xl" : "bg-card")}>
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="border-b text-xs text-muted-foreground">
            <tr>
              {cabecalho("titulo", "Cartão")}
              {cabecalho("coluna", "Coluna")}
              {cabecalho("prioridade", "Prioridade")}
              {cabecalho("prazo", "Prazo")}
              {cabecalho("estimativa", "Pontos")}
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">
                  Nenhum cartão para mostrar.
                </td>
              </tr>
            )}
            {linhas.map((cartao) => {
              const coluna = colunas.find((item) => item.id === cartao.colunaId)
              const concluido = Boolean(coluna?.concluida)
              const atrasado = Boolean(hoje && cartao.prazo && cartao.prazo < hoje && !concluido)
              const doCartao = etiquetas.filter((etiqueta) => cartao.etiquetas.includes(etiqueta.id))
              return (
                <tr key={cartao.id} className="animacao-entrar border-b last:border-0 hover:bg-muted/50">
                  <td className="max-w-80 px-3 py-2">
                    <button type="button" onClick={() => aoAbrir(cartao)} className="flex w-full min-w-0 flex-col items-start gap-1 text-left">
                      <span className={cn("max-w-full truncate font-medium", concluido && "text-muted-foreground line-through")}>{cartao.titulo}</span>
                      {(doCartao.length > 0 || cartao.anexos.length > 0 || cartao.recorrencia || cartao.bloqueadoPor.length > 0) && (
                        <span className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                          {doCartao.map((etiqueta) => (
                            <span key={etiqueta.id} className="rounded px-1.5 py-0.5 text-[11px] leading-none font-medium" style={{ background: `color-mix(in oklch, ${etiqueta.cor} 22%, transparent)`, color: etiqueta.cor }}>
                              {etiqueta.nome}
                            </span>
                          ))}
                          {cartao.anexos.length > 0 && (
                            <span className="flex items-center gap-0.5"><PaperclipIcon className="size-3" /> {cartao.anexos.length}</span>
                          )}
                          {cartao.recorrencia && <RepeatIcon className="size-3" aria-label="Se repete" />}
                          {cartao.bloqueadoPor.length > 0 && <LockIcon className="size-3" aria-label="Tem bloqueios" />}
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      aria-label={`Coluna de “${cartao.titulo}”`}
                      value={cartao.colunaId}
                      onChange={(evento) => moverCartao(cartao.id, evento.target.value, null)}
                      className="h-7 max-w-40 rounded-md border bg-background px-1.5 text-xs"
                    >
                      {colunas.map((opcao) => (
                        <option key={opcao.id} value={opcao.id}>
                          {opcao.titulo}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {cartao.prioridade ? (
                      <span className={cn("flex items-center gap-1 text-xs", estilosPrioridade[cartao.prioridade].classe)}>
                        <FlagIcon className={cn("size-3", estilosPrioridade[cartao.prioridade].preenchida && "fill-current")} /> {estilosPrioridade[cartao.prioridade].titulo}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {cartao.prazo && hoje ? (
                      <span className={cn("flex items-center gap-1 text-xs whitespace-nowrap", atrasado ? "font-medium text-destructive" : "text-muted-foreground")}>
                        <CalendarIcon className="size-3" /> {rotuloPrazo(cartao.prazo, hoje)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">{cartao.estimativa ?? "—"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
