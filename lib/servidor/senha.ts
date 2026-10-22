// Rafael Marques - 21/10/2026
// Hash de senha com scrypt (nativo do Node, sem dependência extra).
// Formato salvo: "scrypt$<sal base64>$<hash base64>".

import "server-only"
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"

function derivar(senha: string, sal: Buffer, tamanho: number) {
  return new Promise<Buffer>((resolver, rejeitar) => {
    scrypt(senha.normalize("NFKC"), sal, tamanho, (erro, chave) => (erro ? rejeitar(erro) : resolver(chave)))
  })
}

export async function gerarHashSenha(senha: string) {
  const sal = randomBytes(16)
  const hash = await derivar(senha, sal, 64)
  return `scrypt$${sal.toString("base64")}$${hash.toString("base64")}`
}

export async function conferirSenha(senha: string, salvo: string) {
  const [algoritmo, sal, hash] = salvo.split("$")
  if (algoritmo !== "scrypt" || !sal || !hash) return false
  const esperado = Buffer.from(hash, "base64")
  const calculado = await derivar(senha, Buffer.from(sal, "base64"), esperado.length)
  return timingSafeEqual(calculado, esperado)
}

// Usado quando o e-mail não existe, para a resposta demorar o mesmo
// tempo e não revelar quais e-mails têm conta.
export const HASH_FALSO = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64).toString("base64")
