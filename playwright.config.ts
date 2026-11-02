import { defineConfig, devices } from "@playwright/test"

// Testes de ponta a ponta (seção 14 do redesign).
// Os fluxos que precisam de conta usam E2E_EMAIL e E2E_SENHA (conta de teste, nunca a real)
// e são pulados quando essas variáveis não existem.
const porta = Number(process.env.E2E_PORTA ?? 3100)

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${porta}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-escuro", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, colorScheme: "dark" } },
    { name: "mobile-claro", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, colorScheme: "light" } },
  ],
  webServer: {
    command: `npx next dev -p ${porta}`,
    url: `http://localhost:${porta}`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
