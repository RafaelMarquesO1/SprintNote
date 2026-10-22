// Rafael Marques - 21/10/2026
// Tipos da conta compartilhados entre servidor e navegador.

export type Usuario = { id: string; nome: string; email: string }

// Resposta dos formulários de entrar/criar conta.
export type EstadoFormularioConta =
  | {
      erro?: string
      erros?: { nome?: string; email?: string; senha?: string; confirmacao?: string; aceite?: string }
      nome?: string
      email?: string
      usuario?: Usuario
    }
  | undefined

// Chaves do localStorage que vão para o banco (uma por área do app).
export const PREFIXO_DADOS = "sprintnote-"
