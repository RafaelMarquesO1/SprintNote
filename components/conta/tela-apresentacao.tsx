"use client"

import { ArrowRightIcon, CalendarClockIcon, KanbanIcon, ListTodoIcon, NetworkIcon, NotebookPenIcon, RepeatIcon, type LucideIcon } from "lucide-react"

import { LinkDocumento } from "@/components/conta/documentos-legais"
import { IconeApp } from "@/components/conta/marca-app"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const recursos: { icone: LucideIcon; titulo: string; texto: string }[] = [
  { icone: NotebookPenIcon, titulo: "Notas em blocos", texto: "Escreva como no Notion, com livros, seções e tags." },
  { icone: NetworkIcon, titulo: "Notas conectadas", texto: "Ligue ideias com [[links]] e veja tudo no grafo." },
  { icone: ListTodoIcon, titulo: "Tarefas", texto: "Prazos, prioridades e as tarefas de hoje num só lugar." },
  { icone: RepeatIcon, titulo: "Hábitos", texto: "Marque o dia e acompanhe as sequências." },
  { icone: CalendarClockIcon, titulo: "Rotina", texto: "Monte o dia por horário e veja o que vem a seguir." },
  { icone: KanbanIcon, titulo: "Kanban", texto: "Quadros com colunas e cartões para seus projetos." },
]

// Rafael Marques - 22/10/2026
// Apresentação do projeto para quem ainda não entrou: o que o app faz e
// os botões para criar conta ou entrar.
export function TelaApresentacao({ aoEscolher }: { aoEscolher: (modo: "entrar" | "cadastro") => void }) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-background animate-in fade-in duration-500">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_65%)]" />

      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <IconeApp />
          SprintNote
        </div>
        <Button variant="ghost" onClick={() => aoEscolher("entrar")}>
          Entrar
        </Button>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pb-16 md:px-6">
        <section className="flex flex-col items-center gap-6 py-16 text-center md:py-24">
          <span className="rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            Notas + tarefas + rotina, tudo junto
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Sua organização em um só lugar
          </h1>
          <p className="max-w-xl text-base text-pretty text-muted-foreground md:text-lg">
            O SprintNote junta notas conectadas, tarefas, hábitos, rotina e Kanban. Crie uma conta e seus dados ficam salvos na nuvem.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => aoEscolher("cadastro")}>
              Criar conta grátis <ArrowRightIcon />
            </Button>
            <Button size="lg" variant="outline" onClick={() => aoEscolher("entrar")}>
              Já tenho conta
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recursos.map(({ icone: Icone, titulo, texto }) => (
            <Card key={titulo} className="bg-card/80 backdrop-blur">
              <CardHeader>
                <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icone className="size-5" />
                </span>
                <CardTitle>{titulo}</CardTitle>
                <CardDescription>{texto}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      </main>

      <footer className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t py-6 text-xs text-muted-foreground">
        <span>v0.1 - SprintNote</span>
        <LinkDocumento tipo="privacidade" className="font-normal text-muted-foreground">Política de Privacidade</LinkDocumento>
        <LinkDocumento tipo="termos" className="font-normal text-muted-foreground">Termos de Uso</LinkDocumento>
      </footer>
    </div>
  )
}
