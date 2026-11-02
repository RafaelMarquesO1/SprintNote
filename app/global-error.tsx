"use client"

// Erro no layout raiz (8.15): página mínima, sem depender de nada do app.
export default function ErroGlobal({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#000", color: "#f5f5f5", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 520, padding: 24 }}>
          <h1 style={{ fontSize: 32, lineHeight: 1.1, margin: "0 0 12px" }}>Algo deu errado ao abrir o SprintNote.</h1>
          <p style={{ color: "#a3a3a3", margin: "0 0 24px" }}>Seus dados continuam salvos. Tente de novo em instantes.</p>
          <button type="button" onClick={() => retry()} style={{ height: 40, padding: "0 16px", borderRadius: 8, border: 0, background: "#f5f5f5", color: "#000", fontWeight: 600, cursor: "pointer" }}>
            Tentar de novo
          </button>
        </main>
      </body>
    </html>
  )
}
