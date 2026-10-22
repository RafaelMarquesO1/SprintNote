// Rafael Marques - 22/10/2026
// Enquanto uma borda é arrastada: mantém o cursor de redimensionar na página
// toda e impede selecionar texto sem querer. Retorna a função que desfaz.
export function travarCursorArrastando(cursor: string) {
  const estilo = document.body.style
  estilo.cursor = cursor
  estilo.userSelect = "none"
  return () => {
    estilo.cursor = ""
    estilo.userSelect = ""
  }
}
