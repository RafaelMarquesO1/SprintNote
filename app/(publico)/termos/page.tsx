import type { Metadata } from "next"

import { PaginaDocumento } from "@/components/features/public/pagina-documento"

export const metadata: Metadata = { title: "Termos de Uso" }

export default function TermosPage() {
  return <PaginaDocumento tipo="termos" />
}
