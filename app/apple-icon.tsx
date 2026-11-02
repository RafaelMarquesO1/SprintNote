import { ImageResponse } from "next/og"

// Ícone de 180px para a tela inicial do iPhone (2.3). Cores fixas: o ícone não segue o tema.
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000000" }}>
        <svg width="132" height="132" viewBox="0 0 28 28">
          <rect width="28" height="28" rx="8" fill="#F5F5F5" />
          <path d="M20.25 7.75H12a2.875 2.875 0 0 0 0 5.75h5a2.875 2.875 0 0 1 0 5.75H11.5" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8.75" cy="19.25" r="2.5" fill="#FF7A1F" />
        </svg>
      </div>
    ),
    size
  )
}
