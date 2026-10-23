// Rafael Marques - 23/10/2026
// Ajudante das rotas de equipe: confere o login, trata os erros e devolve JSON.
// Pedidos que alteram dados precisam ser "application/json": um site de fora não
// consegue mandar isso sem permissão (proteção contra pedidos forjados).

import "server-only"

import { ErroEquipe } from "@/lib/servidor/equipes"
import { usuarioAtual } from "@/lib/servidor/sessao"
import type { Usuario } from "@/lib/tipos-conta"

const semCache = { "Cache-Control": "no-store" }

export const responder = (dados: unknown, status = 200) => Response.json(dados, { status, headers: semCache })
export const responderErro = (mensagem: string, status: number) => responder({ erro: mensagem }, status)

type Contexto = { params: Promise<Record<string, string>> }

type Gerenciador = (argumentos: {
  requisicao: Request
  usuario: Usuario
  params: Record<string, string>
  corpo: () => Promise<Record<string, unknown>>
}) => Promise<Response>

export function rota(gerenciador: Gerenciador) {
  return async (requisicao: Request, contexto: Contexto) => {
    try {
      const usuario = await usuarioAtual()
      if (!usuario) return responderErro("Entre na sua conta.", 401)
      if (requisicao.method !== "GET" && requisicao.method !== "DELETE") {
        const tipo = requisicao.headers.get("content-type") ?? ""
        if (!tipo.includes("application/json")) return responderErro("Pedido inválido.", 415)
      }
      const params = await contexto.params
      const corpo = async () => {
        const texto = await requisicao.text()
        if (texto.length > 25 * 1024 * 1024) throw new ErroEquipe(413, "Dados grandes demais.")
        try {
          const valor: unknown = texto ? JSON.parse(texto) : {}
          return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {}
        } catch {
          throw new ErroEquipe(400, "JSON inválido.")
        }
      }
      return await gerenciador({ requisicao, usuario, params, corpo })
    } catch (erro) {
      if (erro instanceof ErroEquipe) return responderErro(erro.message, erro.status)
      console.error("Erro na rota de equipe:", erro)
      return responderErro("Não foi possível concluir agora. Tente de novo em instantes.", 500)
    }
  }
}
