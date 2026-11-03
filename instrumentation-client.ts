// Rafael Marques - 03/11/2026
// Roda antes do app ficar interativo (convenção do Next: o nome do arquivo é fixo).
//
// Quando a aba fica oculta no meio de uma animação de página (<ViewTransition> do shell), o Chrome cancela a
// transição com "Transition was aborted because of invalid state. Document hidden". É esperado e não quebra nada,
// mas o React só ignora a mensagem sem o final ". Document hidden" (texto antigo do navegador), então o erro
// chegava ao usuário e à tela de erro do next dev. Aqui só esse caso é silenciado; qualquer outro erro passa.

function ehTransicaoCanceladaPorAbaOculta(erro: unknown) {
  return (
    erro instanceof Error &&
    erro.name === "InvalidStateError" &&
    erro.message.startsWith("Transition was aborted because of invalid state")
  )
}

// Em fase de captura para rodar antes dos outros ouvintes da janela (inclusive o do next dev).
window.addEventListener(
  "error",
  (evento) => {
    if (!ehTransicaoCanceladaPorAbaOculta(evento.error)) return
    evento.preventDefault()
    evento.stopImmediatePropagation()
  },
  true,
)

window.addEventListener("unhandledrejection", (evento) => {
  if (!ehTransicaoCanceladaPorAbaOculta(evento.reason)) return
  evento.preventDefault()
})
