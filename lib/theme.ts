// Tema (redesign v2): escuro é o padrão; claro e "sistema" são opções.
// O <html> recebe data-theme="dark|light" (tokens novos) e a classe "dark" (componentes antigos).
// O script abaixo roda ANTES da página aparecer, então não há flash ao recarregar.

export type PreferenciaTema = "escuro" | "claro" | "sistema"
export const CHAVE_TEMA = "theme"

export const themeScript = `
try {
  var salvo = localStorage.getItem("${CHAVE_TEMA}");
  var claro = salvo === "light" || (salvo === "system" && !window.matchMedia("(prefers-color-scheme: dark)").matches);
  var raiz = document.documentElement;
  raiz.dataset.theme = claro ? "light" : "dark";
  raiz.classList.toggle("dark", !claro);
} catch (e) {}
`

function temaEfetivo(preferencia: PreferenciaTema): "dark" | "light" {
  if (preferencia === "claro") return "light"
  if (preferencia === "escuro") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function lerPreferenciaTema(): PreferenciaTema {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA)
    if (salvo === "light") return "claro"
    if (salvo === "system") return "sistema"
  } catch {
    // localStorage bloqueado: usa o padrão.
  }
  return "escuro"
}

function aplicar(tema: "dark" | "light") {
  const raiz = document.documentElement
  raiz.dataset.theme = tema
  raiz.classList.toggle("dark", tema === "dark")
}

// Troca o tema com a revelação circular (M20) a partir de (x, y), quando o navegador suporta.
export function definirTema(preferencia: PreferenciaTema, origem?: { x: number; y: number }) {
  try {
    localStorage.setItem(CHAVE_TEMA, preferencia === "claro" ? "light" : preferencia === "sistema" ? "system" : "dark")
  } catch {
    // Sem localStorage: o tema muda, só não fica salvo.
  }
  const tema = temaEfetivo(preferencia)
  if (document.documentElement.dataset.theme === tema) return
  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  // Rafael Marques - 03/11/2026: com a aba oculta o navegador recusa a transição; aplica o tema direto.
  if (!document.startViewTransition || reduzido || document.visibilityState !== "visible") return aplicar(tema)
  if (origem) {
    document.documentElement.style.setProperty("--tema-x", `${origem.x}px`)
    document.documentElement.style.setProperty("--tema-y", `${origem.y}px`)
  }
  const transicao = document.startViewTransition(() => aplicar(tema))
  // Se a aba sumir no meio, a transição é cancelada (o tema já foi aplicado); não vira erro solto.
  transicao.ready.catch(() => {})
  transicao.finished.catch(() => {})
}

// Alterna entre claro e escuro (botão de sol/lua).
export function alternarTema(origem?: { x: number; y: number }) {
  definirTema(document.documentElement.dataset.theme === "light" ? "escuro" : "claro", origem)
}
