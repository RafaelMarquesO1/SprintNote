// Rafael Marques - 21/10/2026
// Conexão com o banco do Neon (Postgres). Só roda no servidor.

import "server-only"
import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

let conexao: NeonQueryFunction<false, false> | null = null

// Criada na primeira consulta, para o build não exigir a variável de ambiente.
export function banco() {
  if (!conexao) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL não configurada (veja o .env.local).")
    conexao = neon(url)
  }
  return conexao
}
