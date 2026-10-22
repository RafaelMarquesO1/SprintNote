import type { Metadata } from "next"

import { InfoIcon } from "lucide-react"

import { CabecalhoPagina, Pagina } from "@/components/pagina"

export const metadata: Metadata = { title: "Créditos · SprintNote" }

const tecnologias = [
  { nome: "Next.js 16", uso: "framework (App Router e Cache Components)" },
  { nome: "React 19", uso: "interface" },
  { nome: "Tailwind CSS 4", uso: "estilos" },
  { nome: "shadcn/ui + Base UI", uso: "componentes (sidebar, diálogos, menus)" },
  { nome: "Neon (Postgres)", uso: "banco de dados da conta, em São Paulo" },
  { nome: "Zustand", uso: "estado no navegador" },
  { nome: "dnd-kit", uso: "arrastar e soltar do Kanban" },
  { nome: "react-markdown + remark-gfm", uso: "visualização do Markdown" },
  { nome: "highlight.js", uso: "cores nos blocos de código" },
  { nome: "cmdk", uso: "busca Ctrl + K" },
  { nome: "Lucide", uso: "ícones" },
]

// Rafael Marques - 22/10/2026
// Créditos do SprintNote e as tecnologias usadas no projeto.
export default function PaginaCreditos() {
  return (
    <Pagina largura="leitura" className="space-y-10">
      <CabecalhoPagina
        secao="Sobre"
        icone={InfoIcon}
        titulo="Créditos"
        descricao="Desenvolvido por Rafael Marques, 2026. Inspirado no Notion e no Obsidian."
      />

      <section className="space-y-3">
        <h2 className="border-b pb-1 text-xl font-semibold tracking-tight">Tecnologias utilizadas</h2>
        <ul className="grid gap-1 text-sm leading-7 text-muted-foreground sm:grid-cols-2 [&_strong]:text-foreground">
          {tecnologias.map((tecnologia) => (
            <li key={tecnologia.nome}>
              <strong>{tecnologia.nome}</strong> — {tecnologia.uso}
            </li>
          ))}
        </ul>
      </section>
    </Pagina>
  )
}
