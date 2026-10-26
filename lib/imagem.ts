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

// Rafael Marques - 23/10/2026
// Foto de perfil: recorta o quadrado escolhido pela pessoa (x, y, lado, em pixels
// da imagem original) e reduz (fica com poucos KB).
export type CorteAvatar = { x: number; y: number; lado: number }

export async function recortarAvatar(arquivo: File, corte: CorteAvatar, tamanho = 256, qualidade = 0.85): Promise<string> {
  const bitmap = await createImageBitmap(arquivo)
  const canvas = document.createElement("canvas")
  canvas.width = tamanho
  canvas.height = tamanho
  const contexto = canvas.getContext("2d")
  if (!contexto) throw new Error("Não foi possível processar a imagem.")
  contexto.drawImage(bitmap, corte.x, corte.y, corte.lado, corte.lado, 0, 0, tamanho, tamanho)
  bitmap.close()
  return canvas.toDataURL("image/jpeg", qualidade)
}
