"use client"

import Link from "next/link"

import { Logo } from "@/components/brand/logo"
import { VitrineApresentacao } from "@/components/conta/vitrine-apresentacao"
import { Button } from "@/components/ui/button"

// Página pública (8.1): explicar em 5 segundos que notas e tarefas se ligam e levar a "Criar conta grátis".
// Um único momento animado: o fio que liga a nota ao cartão (M18). A demonstração "Seu dia" usa
// animação guiada pela rolagem (M19, CSS) para a linha do agora atravessar a linha do tempo.
export function TelaApresentacao({ aoEscolher }: { aoEscolher: (modo: "entrar" | "cadastro") => void }) {
  return (
    <div className="min-h-dvh bg-night text-paper">
      <header className="mx-auto flex max-w-content items-center justify-between px-4 py-5 md:px-10">
        <Logo />
        <nav aria-label="Conta" className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => aoEscolher("entrar")}>
            Entrar
          </Button>
          <Button onClick={() => aoEscolher("cadastro")}>Criar conta grátis</Button>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-content items-center gap-14 px-4 pt-14 pb-24 md:px-10 md:pt-24 lg:grid-cols-2">
          <div className="space-y-8">
            <h1 className="hero-titulo font-display text-paper">Notas, tarefas e projetos que conversam entre si.</h1>
            <p className="max-w-[46ch] text-lg leading-relaxed text-ink-soft md:text-xl">
              Escreva uma nota e cite o cartão do projeto. Abra o cartão e veja em que notas ele aparece. O que você planeja e o que você faz ficam no mesmo lugar.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => aoEscolher("cadastro")}>
                Criar conta grátis
              </Button>
              <Button size="lg" variant="secondary" onClick={() => aoEscolher("entrar")}>
                Já tenho conta
              </Button>
            </div>
          </div>
          <VitrineApresentacao />
        </section>

        <section aria-labelledby="titulo-recursos" className="border-t border-line">
          <div className="mx-auto max-w-content px-4 py-24 md:px-10">
            <h2 id="titulo-recursos" className="max-w-[16ch] font-display text-4xl leading-none font-bold tracking-tight md:text-display-lg">
              Um lugar para escrever, outro para fazer, e os dois se falam.
            </h2>
            <div className="mt-16 grid border-t border-line md:grid-cols-3">
              {[
                {
                  titulo: "Notas em blocos",
                  texto: "Escreva em Markdown e veja o texto já formatado. Código, diagramas Mermaid e listas de tarefas dentro da nota. Importe do Obsidian quando quiser.",
                },
                {
                  titulo: "Quadros de equipe",
                  texto: "Arraste cartões entre colunas, atribua pessoas e acompanhe o andamento. Cada cartão mostra as notas que o citam.",
                },
                {
                  titulo: "Seu dia numa tela",
                  texto: "Tarefas, hábitos e rotina se juntam numa linha do tempo. A marca laranja mostra onde você está agora.",
                },
              ].map((item, indice) => (
                <div key={item.titulo} className={indice > 0 ? "border-line pt-8 md:border-l md:pl-8" : "pt-8 md:pr-8"}>
                  <h3 className="text-xl font-semibold text-paper">{item.titulo}</h3>
                  <p className="mt-3 text-body-lg text-ink-soft">{item.texto}</p>
                </div>
              ))}
            </div>

            {/* M19: a linha do agora atravessa o dia enquanto a demonstração passa pela tela. */}
            <div aria-hidden="true" className="demo-dia relative mt-16 overflow-hidden rounded-xl border border-line bg-panel p-6">
              <div className="grid grid-cols-6 text-micro text-ink-muted">
                {["08h", "10h", "12h", "14h", "16h", "18h"].map((hora) => (
                  <span key={hora} className="border-l border-line pl-2">
                    {hora}
                  </span>
                ))}
              </div>
              <div className="relative mt-4 h-16">
                <span className="absolute top-0 left-[4%] h-7 w-[20%] rounded-sm border border-line-strong bg-raised px-2 py-1 text-small text-paper">Revisar textos</span>
                <span className="absolute top-9 left-[38%] h-7 w-[16%] rounded-sm border border-line-strong bg-raised px-2 py-1 text-small text-paper">Almoço</span>
                <span className="absolute top-0 left-[62%] h-7 w-[22%] rounded-sm border border-line-strong bg-raised px-2 py-1 text-small text-paper">Academia</span>
                <span className="demo-dia-agora absolute -top-2 -bottom-2 w-0.5 bg-ember" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto flex max-w-content flex-col items-start justify-between gap-8 px-4 py-24 md:flex-row md:items-end md:px-10">
            <div className="space-y-4">
              <h2 className="hero-titulo-menor font-display text-paper">Comece pelo que é de hoje.</h2>
              <p className="text-lg text-ink-soft">Grátis. Dados guardados no Brasil, seguindo a LGPD.</p>
            </div>
            <Button size="lg" onClick={() => aoEscolher("cadastro")}>
              Criar conta grátis
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-4 px-4 py-8 text-small text-ink-soft md:px-10">
          <span>SprintNote, por Rafael Marques, 2026</span>
          <nav aria-label="Documentos" className="flex flex-wrap gap-6">
            <Link href="/termos" className="hover:text-paper">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-paper">
              Política de Privacidade
            </Link>
            <Link href="/creditos" className="hover:text-paper">
              Créditos
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
