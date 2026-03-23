import { expect, test } from "@playwright/test"
import { access, constants } from "node:fs/promises"

async function fileExists(path: string) {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

test("platform admin session can access dashboard landing page", async ({ browser }) => {
  const storageStatePath = "playwright/.auth/platform-admin.json"
  test.skip(!(await fileExists(storageStatePath)), `Missing storage state: ${storageStatePath}`)

  const context = await browser.newContext({ storageState: storageStatePath })
  const page = await context.newPage()

  await page.goto("/platform-admin")
  await expect(page).toHaveURL(/\/platform-admin\/dashboard$/)
  await expect(page.locator("body")).toContainText("System control, without tenant leakage.")

  await context.close()
})

test("platform admin session can access request queue", async ({ browser }) => {
  const storageStatePath = "playwright/.auth/platform-admin.json"
  test.skip(!(await fileExists(storageStatePath)), `Missing storage state: ${storageStatePath}`)

  const context = await browser.newContext({ storageState: storageStatePath })
  const page = await context.newPage()

  await page.goto("/platform-admin/requests")
  await expect(page).toHaveURL(/\/platform-admin\/requests$/)
  await expect(page.locator("body")).toContainText("Request intake with real review control.")

  await context.close()
})

test("platform admin session can access platform audit", async ({ browser }) => {
  const storageStatePath = "playwright/.auth/platform-admin.json"
  test.skip(!(await fileExists(storageStatePath)), `Missing storage state: ${storageStatePath}`)

  const context = await browser.newContext({ storageState: storageStatePath })
  const page = await context.newPage()

  await page.goto("/platform-admin/audit")
  await expect(page).toHaveURL(/\/platform-admin\/audit$/)
  await expect(page.locator("body")).toContainText("Platform audit, not tenant guesswork.")

  await context.close()
})
