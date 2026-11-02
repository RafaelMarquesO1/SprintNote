"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import { Logo } from "@/components/brand/logo"
import { dataVersao, PoliticaPrivacidade, TermosUso } from "@/components/conta/documentos-legais"

// Termos e Privacidade (8.3): coluna de leitura de 720px, índice "Nesta página" fixo em telas largas,
// com marcador Brasa no trecho visível.
export function PaginaDocumento({ tipo }: { tipo: "termos" | "privacidade" }) {
  const conteudo = useRef<HTMLDivElement>(null)
  const [secoes, setSecoes] = useState<{ id: string; titulo: string }[]>([])
  const [ativa, setAtiva] = useState<string | null>(null)

  useEffect(() => {
    const raiz = conteudo.current
    if (!raiz) return
    const elementos = [...raiz.querySelectorAll<HTMLElement>("section[id]")]
    setSecoes(elementos.map((elemento) => ({ id: elemento.id, titulo: elemento.querySelector("h3")?.textContent ?? elemento.id })))
    const observador = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.find((entrada) => entrada.isIntersecting)
        if (visivel) setAtiva(visivel.target.id)
      },
      { rootMargin: "-15% 0px -70% 0px" }
    )
    elementos.forEach((elemento) => observador.observe(elemento))
    return () => observador.disconnect()
  }, [])

  const titulo = tipo === "termos" ? "Termos de Uso" : "Política de Privacidade"

  return (
    <div className="min-h-dvh bg-night">
      <header className="mx-auto flex max-w-content items-center justify-between px-4 py-5 md:px-10">
        <Link href="/" className="inline-flex items-center gap-2 rounded-sm text-ui text-ink-soft hover:text-paper">
          <ArrowLeftIcon aria-hidden="true" className="size-4" /> Voltar
        </Link>
        <Link href="/" aria-label="SprintNote, página inicial" className="rounded-sm">
          <Logo />
        </Link>
      </header>
      <div className="mx-auto flex max-w-content gap-16 px-4 pt-10 pb-24 md:px-10">
        <main className="min-w-0 max-w-reading flex-1">
          <p className="text-small text-ink-soft">Atualizado em {dataVersao}</p>
          <h1 className="mt-3 font-display text-display-md text-paper">{titulo}</h1>
          <div ref={conteudo} className="mt-10 space-y-8 text-body-lg text-ink [&_h3]:font-display [&_h3]:text-section [&_h3]:text-paper [&_a]:text-paper [&_a]:underline">
            {tipo === "termos" ? <TermosUso /> : <PoliticaPrivacidade />}
          </div>
        </main>
        {secoes.length > 0 ? (
          <nav aria-label="Nesta página" className="sticky top-10 hidden h-fit w-56 shrink-0 space-y-2 xl:block">
            <p className="text-small font-semibold text-ink-soft">Nesta página</p>
            <ol className="space-y-0.5">
              {secoes.map((secao) => (
                <li key={secao.id} className="relative">
                  {secao.id === ativa ? <span aria-hidden="true" className="absolute top-1 bottom-1 left-0 w-0.5 rounded-full bg-ember" /> : null}
                  <a href={`#${secao.id}`} aria-current={secao.id === ativa ? "location" : undefined} className={cn("block py-1 pl-3 text-small", secao.id === ativa ? "text-paper" : "text-ink-soft hover:text-paper")}>
                    {secao.titulo}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
      </div>
    </div>
  )
}
