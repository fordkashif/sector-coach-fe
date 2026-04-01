import { expect, test } from "@playwright/test"

test("mock password reset lets a coach set a new password and sign in", async ({ page }) => {
  const resetEmail = "coach@pacelab.local"
  const newPassword = `Reset${Date.now()}!`

  await page.goto("/reset-password")
  await page.locator("#reset-request-email").fill(resetEmail)
  await page.getByRole("button", { name: "Send reset link" }).click()

  await expect(page.getByTestId("local-reset-link")).toContainText("/reset-password?mock_token=")
  await page.getByRole("link", { name: "Open link" }).click()

  await expect(page.locator("#reset-account-email")).toHaveValue(resetEmail)
  await page.locator("#reset-new-password").fill(newPassword)
  await page.locator("#reset-confirm-password").fill(newPassword)
  await page.getByRole("button", { name: "Update password" }).click()

  await expect(page).toHaveURL(/\/coach\/dashboard$/)
})
