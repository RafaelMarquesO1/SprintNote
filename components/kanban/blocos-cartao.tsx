// Rafael Marques - 26/10/2026
// Blocos de layout do diálogo do cartão (usados também pelos anexos e pelas propriedades extras).

// Bloco da lateral direita (propriedades do cartão).
export function Propriedade({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{titulo}</h3>
      {children}
    </section>
  )
}

// Seção da coluna principal (descrição e checklist).
export function Secao({ titulo, icone: IconeSecao, extra, children }: { titulo: string; icone: React.ElementType; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <IconeSecao className="size-4 text-muted-foreground" /> {titulo}
        {extra && <span className="ml-auto text-xs font-normal text-muted-foreground">{extra}</span>}
      </h3>
      {children}
    </section>
  )
}
