import type { Metadata } from "next"

import { QuadroKanban } from "@/components/kanban/quadro-kanban"

export const metadata: Metadata = { title: "Kanban · SprintNote" }

export default function KanbanPage() {
  return <QuadroKanban />
}
