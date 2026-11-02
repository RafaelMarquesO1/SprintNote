import type { Metadata } from "next"

import { PaginaHoje } from "@/components/features/today/pagina-hoje"

export const metadata: Metadata = { title: "Hoje" }

export default function HomePage() {
  return <PaginaHoje />
}
