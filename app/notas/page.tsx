import type { Metadata } from "next"

import { ListaNotas } from "@/components/notas/lista-notas"

export const metadata: Metadata = { title: "Biblioteca · SprintNote" }

export default function NotasPage() {
  return <ListaNotas />
}
