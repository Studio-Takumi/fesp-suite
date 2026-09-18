import { expect, test } from '@playwright/test'

import { signIn } from './support/session'

/**
 * 固定ページ（ホーム・slug で開くページ）の通しテスト。
 * API はまだ立てずに済むよう、レスポンスをルートでスタブしている。
 */
const titles: Record<string, string> = { home: 'ホーム', news: 'お知らせ' }

test.beforeEach(async ({ page }) => {
    await signIn(page)
    await page.route('**/api/articles/slug/*', (route) => {
        const slug = new URL(route.request().url()).pathname.split('/').pop() ?? ''
        const title = titles[slug] ?? slug
        return route.fulfill({
            json: {
                id: '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b',
                event_id: '00000000-0000-4000-8000-000000000000',
                slug,
                created_by: '3c9d1e2f-4a5b-4c6d-8e7f-9a0b1c2d3e4f',
                creator: { display_name: '山田太郎' },
                title,
                content: [{ id: '1', type: 'pageHeader', props: { label: slug.toUpperCase(), title }, children: [] }],
                status: 'published',
                published_version: 1,
                published_at: '2026-09-19T12:00:00+09:00',
                created_at: '2026-09-19T12:00:00+09:00',
                updated_at: '2026-09-19T12:00:00+09:00',
            },
        })
    })
})

test('ホームが表示され、slug が home の記事が出る', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'ホーム', level: 1 })).toBeVisible()
})

test('固定ページのパスで、その slug の記事が開く', async ({ page }) => {
    await page.goto('/news')

    await expect(page.getByRole('heading', { name: 'お知らせ', level: 1 })).toBeVisible()
})

test('個別ページ（/news/:postId）は仮ページを出す', async ({ page }) => {
    await page.goto('/news/1')

    await expect(page.getByText('2日目のステージは、雨天のため体育館に会場を変更します。')).toBeVisible()
})
