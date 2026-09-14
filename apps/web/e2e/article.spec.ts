import { expect, test } from '@playwright/test'

import { signIn } from './support/session'

/**
 * 記事ページの通しテスト。
 * API はまだ立てずに済むよう、レスポンスをルートでスタブしている。
 */
const ARTICLE_ID = '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b'

const defaultBlockProps = { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' }

test.beforeEach(async ({ page }) => {
    await signIn(page)
    await page.route('**/api/articles/**', (route) =>
        route.fulfill({
            json: {
                id: ARTICLE_ID,
                event_id: '00000000-0000-4000-8000-000000000000',
                title: '模擬店のお知らせ',
                content: [
                    {
                        id: '1',
                        type: 'heading',
                        props: { ...defaultBlockProps, level: 1 },
                        content: [{ type: 'text', text: '今日の模擬店', styles: {} }],
                        children: [],
                    },
                    {
                        id: '2',
                        type: 'bulletListItem',
                        props: defaultBlockProps,
                        content: [{ type: 'text', text: 'たこ焼き', styles: {} }],
                        children: [],
                    },
                    { id: '3', type: 'shopList', props: { day: 1 }, children: [] },
                    {
                        id: '4',
                        type: 'paragraph',
                        props: defaultBlockProps,
                        content: [
                            {
                                type: 'link',
                                href: 'https://example.com',
                                content: [{ type: 'text', text: '詳しくはこちら', styles: {} }],
                            },
                        ],
                        children: [],
                    },
                ],
                created_at: '2026-09-14T10:00:00+09:00',
                updated_at: '2026-09-14T12:30:00+09:00',
            },
        }),
    )
})

test('記事ページでタイトルと本文が表示される', async ({ page }) => {
    await page.goto(`/articles/${ARTICLE_ID}`)

    await expect(page.getByRole('heading', { name: '模擬店のお知らせ', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: '今日の模擬店', level: 2 })).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: 'たこ焼き' })).toBeVisible()
    await expect(page.getByRole('link', { name: '詳しくはこちら' })).toHaveAttribute('target', '_blank')
})
