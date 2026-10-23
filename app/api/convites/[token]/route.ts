// Rafael Marques - 23/10/2026
// Convite por link: GET mostra a equipe e o papel; POST aceita e entra na equipe.

import { aceitarConvite, lerConvite } from "@/lib/servidor/equipes"
import { responder, rota } from "@/lib/servidor/rotas-equipe"

export const GET = rota(async ({ params }) => responder(await lerConvite(params.token)))

export const POST = rota(async ({ usuario, params }) => responder(await aceitarConvite(params.token, usuario)))
