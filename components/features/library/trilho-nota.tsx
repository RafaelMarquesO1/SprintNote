"use client"

import Link from "next/link"
import { useEffect, useId, useState } from "react"
import { motion } from "motion/react"
import { useShallow } from "zustand/react/shallow"
import { cn } from "@/lib/utils"

import { spring } from "@/components/motion/presets"

import { useNotas } from "@/lib/estado/notas"
import { obterReferencias } from "@/lib/links-wiki"
import type { Nota } from "@/lib/tipos"

type Titulo = { id: string; texto: string; elemento: HTMLElement }

// "Nesta nota" (8.10): índice dos H2 do texto; o trecho visível ganha o marcador Brasa (IntersectionObserver).
export function useTitulosDaNota(container: HTMLElement | null) {
  const [titulos, setTitulos] = useState<Titulo[]>([])
  const [ativo, setAtivo] = useState<string | null>(null)

  useEffect(() => {
    if (!container) return
    const ler = () => {
      const lista = [...container.querySelectorAll<HTMLElement>(".editor-notas h2")].map((elemento, indice) => ({
        id: `titulo-${indice}`,
        texto: elemento.textContent?.trim() ?? "",
        elemento,
      }))
      setTitulos((atual) => (atual.length === lista.length && atual.every((item, i) => item.texto === lista[i].texto && item.elemento === lista[i].elemento) ? atual : lista.filter((item) => item.texto)))
    }
    ler()
    const observador = new MutationObserver(ler)
    observador.observe(container, { childList: true, subtree: true, characterData: true })
    return () => observador.disconnect()
  }, [container])

  useEffect(() => {
    if (titulos.length === 0) return
    const visiveis = new Map<string, boolean>()
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          const titulo = titulos.find((item) => item.elemento === entrada.target)
          if (titulo) visiveis.set(titulo.id, entrada.isIntersecting)
        }
        const primeiro = titulos.find((item) => visiveis.get(item.id))
        if (primeiro) setAtivo(primeiro.id)
      },
      { rootMargin: "-10% 0px -60% 0px" }
    )
    titulos.forEach((titulo) => observador.observe(titulo.elemento))
    return () => observador.disconnect()
  }, [titulos])

  return { titulos, ativo: ativo ?? titulos[0]?.id ?? null }
}

export function NestaNota({ titulos, ativo }: { titulos: Titulo[]; ativo: string | null }) {
  // O marcador Brasa desliza entre os títulos ao rolar. Um id por índice (o trilho e a gaveta do celular).
  const idMarcador = `nesta-nota-${useId()}`
  if (titulos.length === 0) return null
  return (
    <nav aria-label="Nesta nota" className="space-y-2">
      <h2 className="text-small font-semibold text-ink-soft">Nesta nota</h2>
      <ol className="space-y-0.5">
        {titulos.map((titulo) => (
          <li key={titulo.id} className="relative">
            {titulo.id === ativo ? (
              <motion.span aria-hidden="true" layoutId={idMarcador} transition={spring.layout} className="absolute top-1 bottom-1 left-0 w-0.5 rounded-full bg-ember" />
            ) : null}
            <button
              type="button"
              aria-current={titulo.id === ativo ? "location" : undefined}
              onClick={() => titulo.elemento.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={cn("block w-full truncate py-1 pl-3 text-left text-ui", titulo.id === ativo ? "text-paper" : "text-ink-soft hover:text-paper")}
            >
              {titulo.texto}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

const REGEX_CARTAO = /\[([^\]]+)\]\((\/kanban\?[^)\s]*cartao=[^)\s]*)\)/g

// "Ligações" (8.10): cartões citados nesta nota e notas que citam esta.
export function Ligacoes({ nota }: { nota: Nota }) {
  const biblioteca = useNotas(useShallow((estado) => ({ notas: estado.notas, livros: estado.livros })))
  const citam = obterReferencias(biblioteca, { tipo: "nota", nota })
  const cartoes = [...new Map([...nota.conteudo.matchAll(REGEX_CARTAO)].map((achado) => [achado[2], achado[1]])).entries()]

  return (
    <section aria-labelledby="titulo-ligacoes" className="space-y-2">
      <h2 id="titulo-ligacoes" className="text-small font-semibold text-ink-soft">
        Ligações
      </h2>
      {cartoes.length === 0 && citam.length === 0 ? null : (
        <ul className="space-y-1">
          {cartoes.map(([href, titulo]) => (
            <li key={href}>
              <Link href={href} className="block truncate rounded-xs py-1 text-ui text-paper hover:underline hover:underline-offset-4">
                Cartão {titulo}
              </Link>
            </li>
          ))}
          {citam.map((outra) => (
            <li key={outra.id}>
              <Link href={`/notas/${outra.id}`} className="block truncate rounded-xs py-1 text-ui text-paper hover:underline hover:underline-offset-4">
                {outra.titulo}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {citam.length === 0 ? <p className="text-small text-ink-soft">Nenhuma nota cita esta ainda. Escreva [[ em outra nota para ligar.</p> : null}
    </section>
  )
}
