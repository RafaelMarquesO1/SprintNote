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
// Foto de perfil: recorta o centro em quadrado e reduz (fica com poucos KB).
export async function comprimirAvatar(arquivo: File, lado = 256, qualidade = 0.85): Promise<string> {
  const bitmap = await createImageBitmap(arquivo)
  const corte = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement("canvas")
  canvas.width = lado
  canvas.height = lado
  const contexto = canvas.getContext("2d")
  if (!contexto) throw new Error("Não foi possível processar a imagem.")
  contexto.drawImage(bitmap, (bitmap.width - corte) / 2, (bitmap.height - corte) / 2, corte, corte, 0, 0, lado, lado)
  bitmap.close()
  return canvas.toDataURL("image/jpeg", qualidade)
}
