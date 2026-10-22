// Este texto é um script que roda no navegador ANTES da página aparecer.
// Ele lê o tema salvo e aplica a classe "dark" no <html>.
export const themeScript = `
try {
  var theme = localStorage.getItem("theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (theme === "dark" || (!theme && prefersDark)) {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}
`

// Alterna entre claro e escuro e salva a escolha.
export function alternarTema() {
  const escuro = document.documentElement.classList.toggle("dark")
  try {
    localStorage.setItem("theme", escuro ? "dark" : "light")
  } catch {
    // localStorage bloqueado: o tema muda, só não fica salvo
  }
}
