import { cn } from "@/lib/utils"

export type Pessoa = { id: string; nome: string; foto?: string | null }

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "?"
  return ((partes[0][0] ?? "") + (partes.length > 1 ? partes.at(-1)![0] : (partes[0][1] ?? ""))).toUpperCase()
}

const TAMANHOS = { sm: "size-6 text-micro", md: "size-8 text-micro", lg: "size-10 text-small" }

// Avatar (seção 6): iniciais ou foto, sempre em escala de cinza do sistema.
export function PersonAvatar({ pessoa, size = "md", className }: { pessoa: Pessoa; size?: keyof typeof TAMANHOS; className?: string }) {
  return (
    <span
      title={pessoa.nome}
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-selected font-semibold text-paper select-none", TAMANHOS[size], className)}
    >
      {pessoa.foto ? (
        // eslint-disable-next-line @next/next/no-img-element -- foto de perfil vem de data URL ou da API própria
        <img src={pessoa.foto} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{iniciais(pessoa.nome)}</span>
      )}
      <span className="sr-only">{pessoa.nome}</span>
    </span>
  )
}

// Pilha de avatares com borda night de 2px; o excedente vira "+N".
export function AvatarStack({ pessoas, max = 4, size = "md", className }: { pessoas: Pessoa[]; max?: number; size?: keyof typeof TAMANHOS; className?: string }) {
  const visiveis = pessoas.slice(0, max)
  const resto = pessoas.length - visiveis.length
  return (
    <div className={cn("flex items-center -space-x-1.5", className)} aria-label={`${pessoas.length} ${pessoas.length === 1 ? "pessoa" : "pessoas"}`} role="group">
      {visiveis.map((pessoa) => (
        <PersonAvatar key={pessoa.id} pessoa={pessoa} size={size} className="ring-2 ring-night" />
      ))}
      {resto > 0 ? (
        <span className={cn("inline-flex items-center justify-center rounded-full bg-raised font-semibold text-ink-soft ring-2 ring-night", TAMANHOS[size])}>+{resto}</span>
      ) : null}
    </div>
  )
}
