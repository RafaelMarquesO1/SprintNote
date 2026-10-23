// Rafael Marques - 23/10/2026
// Cancela um convite em aberto (só o dono).

import { revogarConvite } from "@/lib/servidor/equipes"
import { responder, rota } from "@/lib/servidor/rotas-equipe"

export const DELETE = rota(async ({ usuario, params }) => {
  await revogarConvite(params.equipeId, usuario, params.conviteId)
  return responder({ ok: true })
})
