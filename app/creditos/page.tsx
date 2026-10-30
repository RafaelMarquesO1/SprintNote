import type { Metadata } from "next"

import { InfoIcon } from "lucide-react"

import { CabecalhoPagina, Pagina } from "@/components/pagina"

export const metadata: Metadata = { title: "Créditos · SprintNote" }

// Rafael Marques - 29/10/2026: lista revista com o que o projeto usa de fato (package.json), por área.
const grupos = [
  {
    titulo: "Base",
    itens: [
      { nome: "Next.js 16", uso: "framework (App Router, Cache Components, rotas de API e Server Actions)" },
      { nome: "React 19", uso: "interface" },
      { nome: "TypeScript", uso: "linguagem do projeto" },
      { nome: "Tailwind CSS 4", uso: "estilos, com tw-animate-css nas animações" },
    ],
  },
  {
    titulo: "Componentes e interface",
    itens: [
      { nome: "shadcn/ui + Base UI", uso: "componentes (menus, diálogos, abas, menu lateral)" },
      { nome: "class-variance-authority", uso: "variações dos componentes" },
      { nome: "Lucide", uso: "ícones" },
      { nome: "cmdk", uso: "busca Ctrl + K" },
    ],
  },
  {
    titulo: "Notas e editor",
    itens: [
      { nome: "TipTap 3 (ProseMirror)", uso: "editor visual das notas e dos cartões" },
      { nome: "react-markdown + remark-gfm", uso: "leitura do Markdown" },
      { nome: "highlight.js", uso: "cores nos blocos de código" },
      { nome: "Mermaid", uso: "diagramas dentro das notas" },
    ],
  },
  {
    titulo: "Kanban, quadro e grafo",
    itens: [
      { nome: "dnd-kit", uso: "arrastar e soltar (Kanban, calendário e biblioteca)" },
      { nome: "React Flow (xyflow)", uso: "quadro interativo no estilo do Canvas do Obsidian" },
      { nome: "Zustand", uso: "estado no navegador" },
    ],
  },
  {
    titulo: "Dados e hospedagem",
    itens: [
      { nome: "Neon (Postgres)", uso: "banco de dados da conta e das equipes, em São Paulo" },
      { nome: "@neondatabase/serverless", uso: "conexão com o banco" },
      { nome: "Vercel", uso: "hospedagem, em São Paulo" },
    ],
  },
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

      <section className="space-y-6">
        <h2 className="border-b pb-1 text-xl font-semibold tracking-tight">Tecnologias utilizadas</h2>
        {grupos.map((grupo) => (
          <div key={grupo.titulo} className="space-y-1.5">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{grupo.titulo}</h3>
            <ul className="grid gap-x-6 gap-y-1 text-sm leading-6 text-muted-foreground sm:grid-cols-2 [&_strong]:text-foreground">
              {grupo.itens.map((tecnologia) => (
                <li key={tecnologia.nome}>
                  <strong>{tecnologia.nome}</strong> — {tecnologia.uso}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </Pagina>
  )
}
