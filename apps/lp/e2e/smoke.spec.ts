import { expect, test } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

test('ファーストビューが表示される', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveTitle(/LPサイト/)
})

test('アンカーリンクで次のセクションへ移動できる', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: '次のセクションへ' }).click()
    await expect(page.getByRole('heading', { name: 'セクション' })).toBeInViewport()
})
