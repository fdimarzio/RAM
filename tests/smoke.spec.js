import { test, expect } from '@playwright/test'

test('home page loads and shows RAM header', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('RAM')).toBeVisible()
})
