// Rafael Marques - 26/10/2026
// Reduz a foto de fundo até caber no limite (ela vai junto com o quadro: no navegador e, em
// equipe, no servidor). Primeiro tenta boa qualidade, depois menor.

import { comprimirImagem } from "@/lib/imagem"

const MAXIMO_CARACTERES_FOTO = 650_000

export async function prepararFoto(arquivo: File) {
  if (!arquivo.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem (JPG, PNG ou WebP).")
  for (const [largura, qualidade] of [
    [1920, 0.72],
    [1440, 0.62],
    [1100, 0.55],
  ] as const) {
    const url = await comprimirImagem(arquivo, largura, qualidade)
    if (url.length <= MAXIMO_CARACTERES_FOTO) return url
  }
  throw new Error("Essa imagem continua grande demais. Tente outra.")
}
