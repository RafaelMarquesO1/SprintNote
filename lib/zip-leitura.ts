// Rafael Marques - 23/10/2026
// Lê um .zip no navegador (para importar cofres do Obsidian). Só extrai os
// arquivos de texto pedidos; o resto (imagens, PDFs) nem é descompactado.

export type EntradaZip = { caminho: string; ler: () => Promise<string> }

async function descompactar(dados: Uint8Array) {
  const fluxo = new Blob([dados as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"))
  return new Uint8Array(await new Response(fluxo).arrayBuffer())
}

export function listarZip(buffer: ArrayBuffer, aceitar: (caminho: string) => boolean): EntradaZip[] {
  const visao = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  const decodificador = new TextDecoder("utf-8")

  // Fim do diretório central: assinatura 0x06054b50, procurada de trás para frente.
  let fim = -1
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 65557); i--) {
    if (visao.getUint32(i, true) === 0x06054b50) {
      fim = i
      break
    }
  }
  if (fim < 0) throw new Error("O arquivo não é um .zip válido.")

  const total = visao.getUint16(fim + 10, true)
  let posicao = visao.getUint32(fim + 16, true)
  const entradas: EntradaZip[] = []

  for (let n = 0; n < total; n++) {
    if (visao.getUint32(posicao, true) !== 0x02014b50) throw new Error("O .zip está corrompido.")
    const metodo = visao.getUint16(posicao + 10, true)
    const tamanhoComprimido = visao.getUint32(posicao + 20, true)
    const tamanhoNome = visao.getUint16(posicao + 28, true)
    const tamanhoExtra = visao.getUint16(posicao + 30, true)
    const tamanhoComentario = visao.getUint16(posicao + 32, true)
    const inicioLocal = visao.getUint32(posicao + 42, true)
    const caminho = decodificador.decode(bytes.subarray(posicao + 46, posicao + 46 + tamanhoNome))
    posicao += 46 + tamanhoNome + tamanhoExtra + tamanhoComentario

    if (caminho.endsWith("/") || !aceitar(caminho)) continue
    entradas.push({
      caminho,
      ler: async () => {
        const nomeLocal = visao.getUint16(inicioLocal + 26, true)
        const extraLocal = visao.getUint16(inicioLocal + 28, true)
        const inicio = inicioLocal + 30 + nomeLocal + extraLocal
        const conteudo = bytes.subarray(inicio, inicio + tamanhoComprimido)
        if (metodo === 0) return decodificador.decode(conteudo)
        if (metodo === 8) return decodificador.decode(await descompactar(conteudo))
        throw new Error(`Compressão não suportada em “${caminho}”.`)
      },
    })
  }
  return entradas
}
