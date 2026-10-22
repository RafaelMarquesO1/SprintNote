// Rafael Marques - 20/10/2026
// Calcula onde o cursor está dentro de um <textarea> (em pixels), para
// posicionar o menu de comandos logo abaixo da linha atual.
// Técnica: copia o texto até o cursor para uma <div> invisível com o mesmo
// estilo do textarea e mede onde um marcador <span> foi parar.

const PROPRIEDADES_COPIADAS = [
  "boxSizing",
  "width",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "lineHeight",
  "textTransform",
  "wordSpacing",
  "tabSize",
] as const

export function obterPosicaoCursor(campo: HTMLTextAreaElement, indice: number) {
  const espelho = document.createElement("div")
  const estilo = window.getComputedStyle(campo)

  for (const propriedade of PROPRIEDADES_COPIADAS) {
    espelho.style[propriedade] = estilo[propriedade]
  }
  espelho.style.position = "absolute"
  espelho.style.visibility = "hidden"
  espelho.style.top = "0"
  espelho.style.left = "-9999px"
  espelho.style.whiteSpace = "pre-wrap"
  espelho.style.overflowWrap = "break-word"

  espelho.textContent = campo.value.slice(0, indice)
  const marcador = document.createElement("span")
  marcador.textContent = campo.value.slice(indice) || "."
  espelho.appendChild(marcador)
  document.body.appendChild(espelho)

  const alturaLinha = parseFloat(estilo.lineHeight) || parseFloat(estilo.fontSize) * 1.5
  const posicao = {
    topo: marcador.offsetTop - campo.scrollTop,
    esquerda: marcador.offsetLeft - campo.scrollLeft,
    alturaLinha,
  }

  document.body.removeChild(espelho)
  return posicao
}
