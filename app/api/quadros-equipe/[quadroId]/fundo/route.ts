// Rafael Marques - 26/10/2026
// Foto de fundo de um quadro de equipe (só para quem é da equipe).
//   GET ?v=<versão> → a imagem. O endereço muda a cada foto nova, então o navegador guarda no
//   cache privado e não baixa de novo a cada atualização do quadro.

import { lerFundoQuadro } from "@/lib/servidor/equipes"
import { rota } from "@/lib/servidor/rotas-equipe"

export const GET = rota(async ({ usuario, params }) => {
  const { tipo, bytes } = await lerFundoQuadro(params.quadroId, usuario.id)
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": tipo,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  })
})
