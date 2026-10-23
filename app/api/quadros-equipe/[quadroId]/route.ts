// Rafael Marques - 23/10/2026
// Um quadro de equipe.
//   GET ?desde=<versão> → o quadro inteiro (ou { semMudancas } se a versão não mudou)
//   DELETE              → exclui o quadro (só o dono da equipe)

import { baixarQuadro, excluirQuadroEquipe } from "@/lib/servidor/equipes"
import { responder, rota } from "@/lib/servidor/rotas-equipe"

export const GET = rota(async ({ requisicao, usuario, params }) => {
  const desde = new URL(requisicao.url).searchParams.get("desde")
  const versao = desde !== null && /^\d{1,15}$/.test(desde) ? Number(desde) : undefined
  return responder(await baixarQuadro(params.quadroId, usuario.id, versao))
})

export const DELETE = rota(async ({ usuario, params }) => {
  await excluirQuadroEquipe(params.quadroId, usuario)
  return responder({ ok: true })
})
