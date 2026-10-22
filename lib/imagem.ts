// Rafael Marques - 21/10/2026
// Reduz uma imagem enviada pelo usuário antes de guardar no navegador
// (o localStorage tem pouco espaço: ~5 MB para tudo).

export async function comprimirImagem(arquivo: File, larguraMaxima = 1600, qualidade = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(arquivo)
  const escala = Math.min(1, larguraMaxima / bitmap.width)
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  const contexto = canvas.getContext("2d")
  if (!contexto) throw new Error("Não foi possível processar a imagem.")
  contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL("image/jpeg", qualidade)
}

// Tamanho aproximado (em KB) de um texto guardado no navegador.
export function tamanhoEmKb(texto: string) {
  return Math.round((texto.length * 2) / 1024)
}
