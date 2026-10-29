import type { NextConfig } from "next";

// Rafael Marques - 22/10/2026
// Cabeçalhos de segurança em todas as respostas (LGPD, Art. 46).
const cabecalhosSeguranca = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  /* config options here */
  // Rafael Marques - 27/10/2026: libera o servidor de desenvolvimento para quem abre pelo IP da rede local
  // (ex.: testar pelo celular). Só vale no "next dev"; não muda nada em produção.
  allowedDevOrigins: ["172.18.100.103"],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: cabecalhosSeguranca }];
  },
  // Rafael Marques - 29/10/2026: o endereço antigo do livro (/livros/ID) leva para a Biblioteca.
  // Antes era uma página que lia o id fora de <Suspense> e quebrava o build na Vercel (Cache Components).
  async redirects() {
    return [{ source: "/livros/:id", destination: "/notas?livro=:id", permanent: false }];
  },
};

export default nextConfig;
