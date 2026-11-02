import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

// Fluxos com conta (seção 14). Use uma conta de TESTE num banco de desenvolvimento:
//   E2E_EMAIL=... E2E_SENHA=... npm run test:e2e
const email = process.env.E2E_EMAIL
const senha = process.env.E2E_SENHA

test.skip(!email || !senha, "Defina E2E_EMAIL e E2E_SENHA (conta de teste) para rodar os fluxos com conta.")

async function entrar(page: Page) {
  await page.goto("/")
  const jaTenho = page.getByRole("button", { name: /já tenho conta|entrar/i }).first()
  if (await jaTenho.isVisible().catch(() => false)) await jaTenho.click()
  await page.getByLabel(/e-mail/i).fill(email!)
  await page.getByLabel(/^senha/i).first().fill(senha!)
  await page.getByRole("button", { name: /^entrar$/i }).click()
  await expect(page.getByRole("navigation", { name: /principal/i }).first()).toBeVisible({ timeout: 30_000 })
  await fecharNovidades(page)
}

// "O que há de novo" abre sozinho depois de entrar e esconde o resto da página: fecha antes de testar.
async function fecharNovidades(page: Page) {
  const entendi = page.getByRole("button", { name: "Entendi" })
  if (await entendi.isVisible({ timeout: 4000 }).catch(() => false)) await entendi.click()
}

test.beforeEach(async ({ page }) => entrar(page))

test("Hoje mostra a saudação do horário", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^(Bom dia|Boa tarde|Boa noite)/)
})

test("Ctrl K abre a paleta de comando", async ({ page }) => {
  await page.keyboard.press("Control+k")
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByPlaceholder(/buscar ou criar/i)).toBeFocused()
})

test("trocar tema não pisca ao recarregar", async ({ page }) => {
  const antes = await page.evaluate(() => document.documentElement.dataset.theme)
  await page.reload()
  const depoisDoCarregamento = await page.evaluate(() => document.documentElement.dataset.theme)
  expect(depoisDoCarregamento).toBe(antes)
})

for (const rota of ["/", "/tarefas", "/habitos", "/rotina", "/kanban", "/notas", "/grafo", "/tags", "/conta", "/creditos"]) {
  test(`axe sem violações sérias em ${rota}`, async ({ page }) => {
    await page.goto(rota)
    await fecharNovidades(page)
    await expect(page.getByRole("main")).toBeVisible({ timeout: 20_000 })
    const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    const graves = resultado.violations.filter((violacao) => violacao.impact === "serious" || violacao.impact === "critical")
    expect(graves, graves.map((violacao) => `${violacao.id}: ${violacao.help}`).join("\n")).toEqual([])
  })
}
