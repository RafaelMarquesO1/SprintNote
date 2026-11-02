import { ImageResponse } from "next/og"

// Imagem de compartilhamento (2.3): fundo preto, wordmark grande e o ponto Brasa.
export const alt = "SprintNote: notas, tarefas e projetos que conversam entre si."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 88, background: "#000000", color: "#F5F5F5" }}>
        <svg width="96" height="96" viewBox="0 0 28 28">
          <rect width="28" height="28" rx="8" fill="#F5F5F5" />
          <path d="M20.25 7.75H12a2.875 2.875 0 0 0 0 5.75h5a2.875 2.875 0 0 1 0 5.75H11.5" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8.75" cy="19.25" r="2.5" fill="#FF7A1F" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 148, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 0.9 }}>
            SprintNote
            <span style={{ width: 30, height: 30, borderRadius: 999, background: "#FF7A1F", marginLeft: 12 }} />
          </div>
          <div style={{ fontSize: 40, color: "#A3A3A3" }}>Notas, tarefas e projetos que conversam entre si.</div>
        </div>
      </div>
    ),
    size
  )
}
