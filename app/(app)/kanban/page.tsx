import type { Metadata } from "next"

import { TopbarSlot } from "@/components/shell/estado"
import { QuadroKanban } from "@/components/kanban/quadro-kanban"

export const metadata: Metadata = { title: "Quadros" }

export default function KanbanPage() {
  return (
    <>
      <TopbarSlot largura="bleed" />
      <QuadroKanban />
    </>
  )
}
