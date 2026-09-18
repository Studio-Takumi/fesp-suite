import { expect, test } from '@playwright/test'

import { e2eSession } from './support/session'

/**
 * ログインの通しテスト。
 * Supabase Auth と API は立てずに済むよう、レスポンスをルートでスタブしている。
 */
const ARTICLE_ID = '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b'

test.beforeEach(async ({ page }) => {
    await page.route('**/api/articles/**', (route) =>
        route.fulfill({
            json: {
                id: ARTICLE_ID,
                event_id: '00000000-0000-4000-8000-000000000000',
                slug: null,
                created_by: '3c9d1e2f-4a5b-4c6d-8e7f-9a0b1c2d3e4f',
                creator: { display_name: '山田太郎' },
                status: 'published',
                published_version: 1,
                published_at: '2026-09-14T12:00:00+09:00',
                title: '模擬店のお知らせ',
                content: [{ id: '1', type: 'pageHeader', props: { label: 'NEWS', title: 'お知らせ' }, children: [] }],
                created_at: '2026-09-14T10:00:00+09:00',
                updated_at: '2026-09-14T12:30:00+09:00',
            },
        }),
    )
    await page.route('**/auth/v1/token?grant_type=password', (route) => route.fulfill({ json: e2eSession }))
})

test('未ログインで記事を開くとログインに移動し、ログインすると元の記事に戻る', async ({ page }) => {
    await page.goto(`/articles/${ARTICLE_ID}`)

    await expect(page.getByRole('heading', { name: 'ログイン', level: 1 })).toBeVisible()
    await expect(page).toHaveURL(/\/login\?redirect=/)

    await page.getByLabel('メールアドレス').fill('user@example.com')
    await page.getByLabel('パスワード', { exact: true }).fill('password123')
    await page.getByRole('button', { name: 'ログイン', exact: true }).click()

    await expect(page.getByRole('heading', { name: 'お知らせ', level: 1 })).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/articles/${ARTICLE_ID}$`))
})
