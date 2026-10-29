// Rafael Marques - 21/10/2026
// Realce de sintaxe dos blocos de código (highlight.js com as linguagens mais
// comuns). Com linguagem informada, usa ela; sem, tenta descobrir sozinho.

import hljs from "highlight.js/lib/common"

// Linguagens sugeridas no campo do bloco (o highlight.js aceita vários apelidos).
export const linguagensSugeridas = [
  "javascript", "typescript", "jsx", "tsx", "python", "java", "c", "cpp", "csharp", "go", "rust",
  "php", "ruby", "kotlin", "swift", "sql", "html", "css", "scss", "json", "yaml", "xml", "bash",
  "powershell", "markdown", "diff", "plaintext",
  // Rafael Marques - 29/10/2026: "mermaid" desenha o diagrama no lugar do código.
  "mermaid",
]

const nomesBonitos: Record<string, string> = {
  javascript: "JavaScript", typescript: "TypeScript", python: "Python", java: "Java", c: "C", cpp: "C++",
  csharp: "C#", go: "Go", rust: "Rust", php: "PHP", ruby: "Ruby", kotlin: "Kotlin", swift: "Swift",
  sql: "SQL", xml: "HTML/XML", css: "CSS", scss: "SCSS", json: "JSON", yaml: "YAML", bash: "Bash",
  shell: "Shell", powershell: "PowerShell", markdown: "Markdown", diff: "Diff", plaintext: "Texto",
}

export function nomeLinguagem(id: string) {
  return nomesBonitos[id] ?? id
}

function escapar(texto: string) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

// A detecção automática só considera estas (evita palpites estranhos).
const linguagensAutomaticas = [
  "javascript", "typescript", "python", "java", "c", "cpp", "csharp", "go", "rust", "php", "ruby",
  "kotlin", "swift", "sql", "xml", "css", "scss", "json", "yaml", "bash", "powershell", "markdown",
]

// Sinais fortes de linguagens comuns, conferidos antes do palpite genérico.
const pistas: [RegExp, string][] = [
  [/^\s*(def|class) \w+.*\):\s*$|^\s*(from \w+ )?import \w+|\bprint\(|\belif\b|\bself\./m, "python"],
  [/^\s*(SELECT|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE)\b/im, "sql"],
  [/^\s*<(!DOCTYPE|html|div|span|p|head|body)\b/i, "xml"],
  [/^\s*[{[]\s*"[^"]+"\s*:/, "json"],
  [/^#!.*\b(ba|z)?sh\b|^\s*(sudo|npm|npx|git|cd|echo) /m, "bash"],
  [/\b(interface|type) \w+\s*=?\s*{|: (string|number|boolean)\b/, "typescript"],
  [/\b(const|let) \w+\s*=|=>|console\.log\(|function \w*\(/, "javascript"],
  [/\bpublic (static )?(void|class)\b|System\.out\.print/, "java"],
  [/#include\s*<|\bstd::|printf\(/, "cpp"],
  [/\bfunc \w+\(|\bpackage main\b|:= /, "go"],
  [/\bfn \w+\(|\blet mut\b|println!\(/, "rust"],
  [/^\s*[.#]?[\w-]+\s*{[^}]*:\s*[^}]+;/m, "css"],
]

function detectarPorPistas(codigo: string) {
  return pistas.find(([regex]) => regex.test(codigo))?.[1] ?? null
}

export type Realce = {
  // HTML seguro: o highlight.js escapa o código antes de colorir.
  html: string
  // Linguagem usada de fato (a informada ou a detectada).
  linguagem: string | null
  detectada: boolean
}

export function realcarCodigo(codigo: string, linguagem: string): Realce {
  const pedida = linguagem.trim().toLowerCase()
  if (pedida && hljs.getLanguage(pedida)) {
    const resultado = hljs.highlight(codigo, { language: pedida, ignoreIllegals: true })
    return { html: resultado.value, linguagem: pedida, detectada: false }
  }
  // Pouco código não dá para adivinhar com segurança.
  if (pedida || codigo.trim().length < 12) return { html: escapar(codigo), linguagem: null, detectada: false }
  const pista = detectarPorPistas(codigo)
  if (pista) {
    return { html: hljs.highlight(codigo, { language: pista, ignoreIllegals: true }).value, linguagem: pista, detectada: true }
  }
  const resultado = hljs.highlightAuto(codigo, linguagensAutomaticas)
  if (!resultado.language || resultado.relevance < 3) return { html: escapar(codigo), linguagem: null, detectada: false }
  return { html: resultado.value, linguagem: resultado.language, detectada: true }
}
