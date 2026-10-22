import type { Metadata } from "next"

import { ListaTarefas } from "@/components/tarefas/lista-tarefas"

export const metadata: Metadata = { title: "Tarefas · SprintNote" }

export default function PaginaTarefas() {
  return <ListaTarefas />
}
