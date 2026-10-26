import { redirect } from "next/navigation"

// Rafael Marques - 26/10/2026
// A página do livro agora abre dentro da Biblioteca (/notas?livro=ID); este endereço antigo
// só leva para lá, para links e favoritos continuarem funcionando.
export default async function RotaLivro({ params }: PageProps<"/livros/[id]">) {
  const { id } = await params
  redirect(`/notas?livro=${encodeURIComponent(id)}`)
}
