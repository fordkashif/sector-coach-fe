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

test("platform admin can review a newly submitted tenant request and see it in platform audit", async ({ browser }) => {
  const storageStatePath = "playwright/.auth/platform-admin.json"
  test.skip(!(await fileExists(storageStatePath)), `Missing storage state: ${storageStatePath}`)

  const nonce = Date.now()
  const organizationName = `E2E Platform Org ${nonce}`
  const requestorEmail = `platform-e2e-${nonce}@pacelab.local`

  const publicContext = await browser.newContext()
  const publicPage = await publicContext.newPage()

  await publicPage.goto("/login?mode=request")
  await publicPage.getByLabel("Full name").fill("Platform E2E Requestor")
  await publicPage.getByLabel("Work email").fill(requestorEmail)
  await publicPage.getByLabel("Organization").fill(organizationName)
  await publicPage.getByLabel("Notes").fill("Created by Playwright to verify platform-admin request review flow.")
  await publicPage.getByRole("button", { name: "Submit request" }).click()

  await expect(publicPage.locator("body")).toContainText("We have your access request.")
  await expect(publicPage.locator("body")).toContainText("submitted for platform-admin review")
  await publicContext.close()

  const adminContext = await browser.newContext({ storageState: storageStatePath })
  const requestsPage = await adminContext.newPage()

  await requestsPage.goto("/platform-admin/requests")
  const requestCard = requestsPage.locator("article").filter({ hasText: organizationName }).first()
  await expect(requestCard).toContainText(requestorEmail)

  await requestCard.getByRole("button", { name: "Reject" }).click()
  await expect(requestCard).toContainText("rejected")
  await expect(requestsPage.locator("body")).toContainText(`Request rejected for ${requestorEmail}.`)

  const auditPage = await adminContext.newPage()
  await auditPage.goto("/platform-admin/audit")
  await auditPage.getByPlaceholder("Search audit trail").fill(organizationName)
  await expect(auditPage.locator("body")).toContainText("tenant provision request submitted")
  await expect(auditPage.locator("body")).toContainText("tenant provision request reviewed")
  await expect(auditPage.locator("body")).toContainText(requestorEmail)

  await adminContext.close()
})
