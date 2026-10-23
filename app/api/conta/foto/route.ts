// Rafael Marques - 23/10/2026
// Foto de perfil guardada na conta (para os colegas de equipe verem).
//   GET    → minha foto
//   PUT    → { foto } JPEG pequeno em data URL
//   DELETE → remove

import { lerFoto, salvarFoto } from "@/lib/servidor/equipes"
import { responder, rota } from "@/lib/servidor/rotas-equipe"

export const GET = rota(async ({ usuario }) => responder({ foto: await lerFoto(usuario.id) }))

export const PUT = rota(async ({ usuario, corpo }) => {
  await salvarFoto(usuario.id, (await corpo()).foto)
  return responder({ ok: true })
})

export const DELETE = rota(async ({ usuario }) => {
  await salvarFoto(usuario.id, null)
  return responder({ ok: true })
})
