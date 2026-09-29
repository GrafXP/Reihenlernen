import { expect, test, type Page } from '@playwright/test'

async function solve(page: Page) {
  const prompt = (await page.locator('.challenge-card > h1').innerText()).trim()
  let answer: number
  const direct = prompt.match(/^(\d+) × (\d+) = \?$/)
  const missing = prompt.match(/^\? × (\d+) = (\d+)$/)
  if (direct) answer = Number(direct[1]) * Number(direct[2])
  else if (missing) answer = Number(missing[2]) / Number(missing[1])
  else {
    const values = (await page.locator('.prompt-visual .sequence-visual span').allTextContents()).slice(0, 2).map(Number)
    answer = 2 * values[1] - values[0]
  }
  if (await page.locator('.choice-card').count()) {
    await page.getByRole('button', { name: String(answer), exact: true }).click()
  } else await page.getByLabel('Deine Antwort').fill(String(answer))
  await page.getByRole('button', { name: 'Antwort prüfen' }).click()
  await expect(page.getByText('Du bekommst 10 Punkte.')).toBeVisible()
}
async function chooseRewardAndMission(page: Page) {
  await expect(page.getByRole('heading', { name: 'Welche Belohnung möchtest du sammeln?' })).toBeVisible()
  await page.getByRole('button', { name: /30 Min. Gamen/ }).click()
  await page.getByRole('button', { name: /Zahlenweg/ }).click()
  await expect(page.locator('.challenge-number')).toContainText('Aufgabe 1')
}
async function closeNotice(page: Page) {
  const close = page.getByRole('button', { name: 'Hinweis schliessen' })
  if (await close.isVisible()) await close.click()
}

test('learns twelve facts, practises only the chosen row, and persists reward progress', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Reihen-Mission' })).toBeVisible()
  await expect(page.getByRole('button', { name: /er-Reihe lernen/ })).toHaveCount(10)
  await page.getByRole('button', { name: '12er-Reihe lernen', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Die 12er-Reihe' })).toBeVisible()
  await page.getByRole('button', { name: '12 mal 12 anschauen' }).click()
  await expect(page.getByRole('heading', { name: '12 × 12 = 144' })).toBeVisible()
  await page.getByRole('button', { name: 'Ergebnisse verdecken' }).click()
  await expect(page.getByRole('heading', { name: '12 × 12 = ?' })).toBeVisible()
  await page.getByRole('button', { name: 'Ergebnis aufdecken' }).click()
  await expect(page.getByRole('heading', { name: '12 × 12 = 144' })).toBeVisible()
  await page.getByRole('button', { name: /Nur die 12er-Reihe üben/ }).click()
  await chooseRewardAndMission(page)
  await expect(page.locator('.challenge-number')).toContainText('12er-Reihe')
  await solve(page)
  await expect(page.getByText('10 / 100')).toBeVisible()
  await page.reload()
  await expect(page.locator('.challenge-number')).toContainText('Aufgabe 2')
  await expect(page.getByText('10 / 100')).toBeVisible()
  await page.getByRole('button', { name: 'Mission verlassen' }).click()
  await expect(page.getByRole('button', { name: '12er-Reihe auswählen' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: '2er-Reihe auswählen', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('button', { name: '2er-Reihe auswählen', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: /Weiterrechnen/ }).click()
  for (let completed = 1; completed < 10; completed += 1) {
    await expect(page.locator('.challenge-number')).toContainText('12er-Reihe')
    await solve(page)
    await page.getByRole('button', { name: 'Weiter', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Belohnung sammeln', exact: true }).click()
  await expect(page.getByText('30 Min. Gamen')).toHaveCount(2)
  await page.getByRole('button', { name: 'Zurück zum Start' }).click()
  await expect(page.getByRole('button', { name: '2er-Reihe auswählen', exact: true })).toBeEnabled()
})

test('practises all ten rows in a mixed reward round', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Üben starten/ }).click()
  await chooseRewardAndMission(page)
  const rows: number[] = []
  for (let index = 0; index < 10; index += 1) {
    rows.push(Number((await page.locator('.challenge-number').innerText()).match(/(\d+)er-Reihe/i)![1]))
    await solve(page)
    await page.getByRole('button', { name: 'Weiter', exact: true }).click()
  }
  expect(rows.sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 11, 12])
})

test('offers a calculation hint without needing a wrong answer', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Üben starten/ }).click()
  await chooseRewardAndMission(page)
  await page.getByRole('button', { name: 'Zeig mir einen Rechentrick' }).click()
  await expect(page.locator('.hint-card')).toBeVisible()
  await expect(page.locator('.hint-card .array-visual')).toBeVisible()
  await solve(page)
  await page.getByRole('button', { name: 'Weiter', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Zeig mir einen Rechentrick' })).toBeVisible()
})

test('parent settings control read-aloud and reward redemption', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Elternbereich', exact: true }).click()
  await page.getByLabel('Neue PIN', { exact: true }).fill('2468')
  await page.getByLabel('PIN wiederholen').fill('2468')
  await page.getByRole('button', { name: 'PIN speichern' }).click()
  await page.getByRole('checkbox', { name: /^Vorlesen erlauben/ }).check()
  await page.getByRole('button', { name: 'Einstellungen speichern' }).click()
  await expect(page.getByRole('heading', { name: 'Alle zehn Reihen' })).toBeVisible()
  await page.getByRole('button', { name: 'Zurück zum Start' }).click()
  await closeNotice(page)
  await page.getByRole('button', { name: /Üben starten/ }).click()
  await chooseRewardAndMission(page)
  await expect(page.getByRole('button', { name: 'Aufgabe vorlesen' })).toBeVisible()
  for (let index = 0; index < 10; index += 1) {
    await solve(page)
    await page.getByRole('button', { name: 'Weiter', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Belohnung sammeln', exact: true }).click()
  await page.getByRole('button', { name: 'Mit Elternteil einlösen' }).click()
  await page.getByLabel('PIN', { exact: true }).fill('2468')
  await page.getByRole('button', { name: 'Jetzt einlösen' }).click()
  await expect(page.getByText('Eingelöst', { exact: true })).toBeVisible()
})

test('loads learning and practice offline after the first visit', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await context.setOffline(true)
  try {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Reihen-Mission' })).toBeVisible()
    await page.getByRole('button', { name: '11er-Reihe lernen', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Die 11er-Reihe' })).toBeVisible()
    await page.getByRole('button', { name: /Nur die 11er-Reihe üben/ }).click()
    await chooseRewardAndMission(page)
    await expect(page.locator('.challenge-number')).toContainText('11er-Reihe')
  } finally { await context.setOffline(false) }
})
