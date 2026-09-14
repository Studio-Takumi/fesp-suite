import { expect, test } from '@playwright/test'

import { signIn } from './support/session'

/**
 * 配線確認のスモークテスト。
 * API はまだ立てずに済むよう、レスポンスをルートでスタブしている。
 */
test.beforeEach(async ({ page }) => {
    await signIn(page)
    await page.route('**/api/example*', (route) =>
        route.fulfill({
            json: { message: 'APIの配線確認用エンドポイントです', now: '2026-09-01T10:00:00Z' },
        }),
    )
})

test('トップページが表示され、APIの内容が出る', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'セットアップ完了', level: 1 })).toBeVisible()
    await expect(page.getByText('APIの配線確認用エンドポイントです')).toBeVisible()
})

test('UI状態のトグルが動く', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('isMenuOpen: false')).toBeVisible()
    await page.getByRole('button', { name: '切り替える' }).click()
    await expect(page.getByText('isMenuOpen: true')).toBeVisible()
})
