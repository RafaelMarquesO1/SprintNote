import type { Metadata } from "next"

import { PaginaConta } from "@/components/conta/pagina-conta"

export const metadata: Metadata = { title: "Minha conta" }

export default function RotaConta() {
  return <PaginaConta />
}
