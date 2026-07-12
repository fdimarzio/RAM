import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD

async function signIn(page) {
  await page.goto('/')
  await page.locator('input[type="email"]').fill(TEST_EMAIL)
  await page.locator('input[type="password"]').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page.getByRole('heading', { name: 'Companies' })).toBeVisible({ timeout: 10000 })
}

test('home page loads and shows RAM header', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('RAM')).toBeVisible()
})

test('login page shows email/password fields and sign in/up actions', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Sign in to RAM' })).toBeVisible()
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible()
})

test.describe('authenticated flows', () => {
  test.skip(
    !TEST_EMAIL || !TEST_PASSWORD,
    'Set PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD env vars (a confirmed Supabase auth user) to run authenticated smoke tests'
  )

  test('signs in and reaches the main app', async ({ page }) => {
    await signIn(page)
    await expect(page.getByText(TEST_EMAIL)).toBeVisible()
  })

  test('export CSV button downloads a CSV of the current list', async ({ page }) => {
    await signIn(page)

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export CSV' }).click()
    ])

    expect(download.suggestedFilename()).toBe('companies.csv')
  })

  test('dashboard cards render', async ({ page }) => {
    await signIn(page)
    await page.getByRole('button', { name: 'Dashboard' }).click()

    await expect(page.getByText('Open Tasks', { exact: true })).toBeVisible()
    await expect(page.getByText('Due This Week', { exact: true })).toBeVisible()
    await expect(page.getByText('Open Opportunities', { exact: true })).toBeVisible()
    await expect(page.getByText('Follow-Up Needed', { exact: true })).toBeVisible()
    await expect(page.getByText('Overdue', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Overdue Tasks' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pipeline by Stage' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Follow-Up Events' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Outstanding Commitments' })).toBeVisible()
  })

  test('can link and unlink a related person on a person detail page', async ({ page }) => {
    await signIn(page)

    await page.getByRole('button', { name: 'People' }).click()
    await expect(page.getByRole('heading', { name: 'People' })).toBeVisible()

    // Create two disposable people to link together, then clean up.
    await page.getByRole('button', { name: '+ New Person' }).click()
    await page.getByRole('textbox', { name: 'First Name *' }).fill('Smoke Test Person A')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('button', { name: 'Smoke Test Person A' })).toBeVisible()

    await page.getByRole('button', { name: '+ New Person' }).click()
    await page.getByRole('textbox', { name: 'First Name *' }).fill('Smoke Test Person B')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('button', { name: 'Smoke Test Person B' })).toBeVisible()

    await page.getByRole('button', { name: 'Smoke Test Person A' }).click()
    await expect(page.getByRole('heading', { name: 'Smoke Test Person A' })).toBeVisible()

    await page.getByRole('heading', { name: /Related People/ }).scrollIntoViewIfNeeded()
    await page.locator('select').filter({ hasText: 'Select a person...' }).selectOption({ label: 'Smoke Test Person B' })
    await page.getByPlaceholder('e.g. colleague, mentor, referred by').fill('colleague')
    await page.getByRole('button', { name: '+ Link Person' }).click()

    await expect(page.getByRole('button', { name: 'Smoke Test Person B' })).toBeVisible()
    await expect(page.getByText('— colleague')).toBeVisible()

    await page.getByRole('button', { name: 'Unlink' }).click()
    await expect(page.getByText('No related people yet.')).toBeVisible()

    // Cleanup: delete both test people.
    await page.getByRole('button', { name: '← Back to People' }).click()
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('row', { name: /Smoke Test Person A/ }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('button', { name: 'Smoke Test Person A' })).not.toBeVisible()
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('row', { name: /Smoke Test Person B/ }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('button', { name: 'Smoke Test Person B' })).not.toBeVisible()
  })
})
