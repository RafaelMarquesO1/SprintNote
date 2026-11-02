import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

// Páginas que abrem sem conta.

test("página inicial pública abre e não tem violações sérias de acessibilidade", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("main")).toBeVisible({ timeout: 20_000 })
  const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
  const graves = resultado.violations.filter((violacao) => violacao.impact === "serious" || violacao.impact === "critical")
  expect(graves, graves.map((violacao) => `${violacao.id}: ${violacao.help}`).join("\n")).toEqual([])
})

test("movimento reduzido: nenhuma animação com deslocamento", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await expect(page.getByRole("main")).toBeVisible({ timeout: 20_000 })
  const longas = await page.evaluate(() =>
    document
      .getAnimations()
      .map((animacao) => Number(animacao.effect?.getTiming().duration ?? 0))
      .filter((duracao) => duracao > 10)
  )
  expect(longas).toEqual([])
})
