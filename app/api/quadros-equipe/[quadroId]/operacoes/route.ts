// Rafael Marques - 23/10/2026
// Grava as mudanças de um quadro de equipe (só o que mudou). Dono e editor.

import { aplicarOperacoes } from "@/lib/servidor/equipes"
import { responder, rota } from "@/lib/servidor/rotas-equipe"

export const POST = rota(async ({ usuario, params, corpo }) => responder(await aplicarOperacoes(params.quadroId, usuario, await corpo())))
