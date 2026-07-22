/**
 * Capture help screenshots into public/help/*.png
 * Usage: $env:PLAYWRIGHT_BASE_URL='http://localhost:3000'; pnpm exec tsx scripts/capture-help-screenshots.mts
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { chromium, type Page } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const OUT = path.resolve('public/help')
const TEACHER = process.env.HELP_TEACHER_CODE ?? '200001'
const MANAGER = process.env.HELP_MANAGER_CODE ?? '100002'

async function login(page: Page, code: string) {
  await page.goto(`${BASE}/login`)
  await page.getByPlaceholder('000000').fill(code)
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.waitForURL((url) => !/\/login$/.test(url.pathname), {
    waitUntil: 'commit',
    timeout: 30_000,
  })
  await page.waitForTimeout(600)
}

async function dismissBanners(page: Page) {
  for (const name of ['Не сейчас', 'Закрыть']) {
    const btn = page.getByRole('button', { name })
    if (await btn.count()) {
      await btn.first().click({ timeout: 800 }).catch(() => {})
    }
  }
}

async function ready(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await dismissBanners(page)
  await page.waitForTimeout(900)
}

async function shot(page: Page, name: string) {
  await ready(page)
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false, animations: 'disabled' })
  console.log('saved', name)
}

async function gotoShot(page: Page, route: string, name: string) {
  await page.goto(`${BASE}${route}`)
  await shot(page, name)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  // --- Teacher ---
  await login(page, TEACHER)

  await gotoShot(page, '/journal', 'teacher-journal')

  const startLesson = page.getByRole('button', { name: 'Начать урок' })
  if (await startLesson.isVisible().catch(() => false)) {
    await startLesson.click()
    await page.waitForTimeout(1200)
  }
  await dismissBanners(page)
  const ali = page.getByRole('cell', { name: 'Али', exact: true }).first()
  if (await ali.count()) {
    await ali.click()
    await page.waitForURL(/\/journal\/[^/?]+/, { timeout: 20_000 })
    await shot(page, 'teacher-lesson-steps')
  }

  await gotoShot(page, '/extra-assignments', 'teacher-extra-assignments')
  await gotoShot(page, '/my-group', 'teacher-my-group')
  await gotoShot(page, '/calendar', 'teacher-calendar')
  await gotoShot(page, '/journal/history', 'teacher-history')
  await gotoShot(page, '/accounting/my-salary', 'teacher-my-salary')
  await gotoShot(page, '/analytics', 'teacher-analytics')
  await gotoShot(page, '/news', 'teacher-news')
  await gotoShot(page, '/messages', 'teacher-messages')
  await gotoShot(page, '/settings', 'teacher-settings')

  // --- Manager ---
  await context.clearCookies()
  await login(page, MANAGER)

  await gotoShot(page, '/groups', 'manager-groups')
  await page.getByRole('button', { name: /Создать группу/i }).first().click()
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
  await shot(page, 'manager-create-group')

  await gotoShot(page, '/admin/users', 'manager-users')
  await gotoShot(page, '/admin/subjects', 'manager-subjects')
  await gotoShot(page, '/extra-assignments', 'manager-extra-assignments')
  await gotoShot(page, '/analytics', 'manager-analytics')
  await gotoShot(page, '/analytics/teachers', 'manager-teacher-analytics')
  await gotoShot(page, '/admin/leave-calendar', 'manager-leave-calendar')
  await gotoShot(page, '/admin/awards', 'manager-awards')
  await gotoShot(page, '/admin/audit-log', 'manager-audit-log')
  await gotoShot(page, '/news', 'manager-news')
  await gotoShot(page, '/messages', 'manager-messages')
  await gotoShot(page, '/settings', 'manager-settings')

  await browser.close()
  console.log('done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
