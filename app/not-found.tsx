import type { Metadata } from "next"
import Link from "next/link"

import { Logo } from "@/components/brand/logo"

export const metadata: Metadata = { title: "Página não encontrada" }

// 404 (8.15): o que aconteceu e para onde ir.
export default function NaoEncontrada() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-reading flex-col items-start justify-center gap-6 px-4">
      <Logo />
      <h1 className="font-display text-4xl leading-none font-bold tracking-tight text-paper md:text-display-lg">Esta página não existe ou foi movida.</h1>
      <p className="text-body text-ink-soft">Confira o endereço ou volte para o seu dia. Dentro do app, Ctrl K busca qualquer nota, cartão ou tarefa.</p>
      <Link href="/" className="inline-flex h-control items-center rounded-sm bg-paper px-4 text-ui font-semibold text-night hover:bg-ink">
        Voltar para Hoje
      </Link>
    </main>
  )
}
