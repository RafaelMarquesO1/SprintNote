import type { Metadata } from "next"

import { PaginaDocumento } from "@/components/features/public/pagina-documento"

export const metadata: Metadata = { title: "Política de Privacidade" }

export default function PrivacidadePage() {
  return <PaginaDocumento tipo="privacidade" />
}
