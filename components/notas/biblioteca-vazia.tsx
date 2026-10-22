// Rafael Marques - 22/10/2026
// Estado vazio da biblioteca: ilustração de livros ligados a uma nota e os três passos para começar.

import { BookPlusIcon } from "lucide-react"

import { paletaCores } from "@/lib/cores"
import { Button } from "@/components/ui/button"

const cor = (id: string) => paletaCores.find((item) => item.id === id)?.valor ?? "currentColor"

function IlustracaoEstante() {
  return (
    <svg viewBox="0 0 220 150" className="w-full max-w-72" aria-hidden="true">
      {/* Fio que liga um livro à nota */}
      <path d="M58 34 C 90 -8, 170 10, 176 84" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" />
      <circle cx="58" cy="34" r="4" fill="var(--foreground)" />
      <circle cx="176" cy="84" r="4" fill="var(--foreground)" />

      {/* Livros */}
      <g>
        <rect x="42" y="38" width="30" height="92" rx="3" fill={cor("azul")} />
        <rect x="42" y="52" width="30" height="3" fill="white" opacity="0.45" />
        <rect x="42" y="112" width="30" height="3" fill="white" opacity="0.45" />
        <rect x="50" y="66" width="14" height="30" rx="2" fill="white" opacity="0.25" />
      </g>
      <g>
        <rect x="76" y="56" width="26" height="74" rx="3" fill={cor("verde")} />
        <rect x="76" y="68" width="26" height="2.5" fill="white" opacity="0.45" />
        <rect x="76" y="116" width="26" height="2.5" fill="white" opacity="0.45" />
      </g>
      <g transform="rotate(14 106 130)">
        <rect x="106" y="62" width="24" height="68" rx="3" fill={cor("laranja")} />
        <rect x="106" y="74" width="24" height="2.5" fill="white" opacity="0.45" />
        <rect x="112" y="84" width="12" height="22" rx="2" fill="white" opacity="0.25" />
      </g>

      {/* Nota solta */}
      <g>
        <rect x="158" y="92" width="38" height="38" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
        <rect x="165" y="101" width="20" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.6" />
        <rect x="165" y="109" width="24" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.35" />
        <rect x="165" y="117" width="14" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.35" />
      </g>

      {/* Prateleira */}
      <rect x="20" y="130" width="184" height="4" rx="2" fill="var(--border)" />
    </svg>
  )
}

function Tecla({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-b-2 bg-muted px-1.5 font-mono text-xs font-medium text-foreground">
      {children}
    </kbd>
  )
}

const passos = [
  { titulo: "Crie um livro", texto: "Um assunto, matéria ou projeto.", teclas: null },
  { titulo: "Escreva notas", texto: "Blocos e tags enquanto digita.", teclas: ["/", "#"] },
  { titulo: "Conecte", texto: "Ligue notas e livros entre si.", teclas: ["[["] },
]

export function BibliotecaVazia({ aoCriarLivro }: { aoCriarLivro: () => void }) {
  return (
    <section className="grid items-center gap-8 rounded-xl border border-dashed px-6 py-10 sm:px-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-12">
      <div className="flex justify-center">
        <IlustracaoEstante />
      </div>

      <div className="space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">Sua estante está vazia</h2>
          <p className="text-sm text-muted-foreground">Comece por um livro. Em três passos suas ideias passam a se conectar.</p>
        </div>

        <ol className="relative space-y-4">
          {/* Linha que une os passos */}
          <span className="absolute top-3 bottom-3 left-3 w-px bg-border" aria-hidden="true" />
          {passos.map((passo, indice) => (
            <li key={passo.titulo} className="relative flex items-start gap-3">
              <span className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold tabular-nums">
                {indice + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                <p className="text-sm font-medium">{passo.titulo}</p>
                <p className="text-sm text-muted-foreground">{passo.texto}</p>
                {passo.teclas && (
                  <span className="flex gap-1">
                    {passo.teclas.map((tecla) => <Tecla key={tecla}>{tecla}</Tecla>)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>

        <Button size="lg" onClick={aoCriarLivro}>
          <BookPlusIcon /> Criar o primeiro livro
        </Button>
      </div>
    </section>
  )
}
