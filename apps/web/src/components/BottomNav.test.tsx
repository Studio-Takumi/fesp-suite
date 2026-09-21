import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '~/test/msw/server'
import { renderApp } from '~/test/render'
import { mockSession } from '~/test/supabase'

const API = 'http://localhost:8787'

/** 下のナビゲーションバーの項目（ラベル → 現在地になったときの見た目） */
function navLink(label: string) {
    return within(screen.getByRole('navigation', { name: 'メインメニュー' })).getByRole('link', { name: label })
}

describe('下のナビゲーションバー', () => {
    it('API から引いた項目を sort_order の順で出す', async () => {
        renderApp('/')

        const nav = await screen.findByRole('navigation', { name: 'メインメニュー' })

        expect(
            within(nav)
                .getAllByRole('link')
                .map((link) => link.textContent),
        ).toEqual(['ホーム', 'お知らせ', 'マップ', 'スケジュール'])
    })

    it('本文より上にヘッダーは置かない', async () => {
        renderApp('/')

        await screen.findByRole('navigation', { name: 'メインメニュー' })

        // 記事の中のページ見出しは <header> を出すので、本文（<main>）の外にあるものだけを見る
        const outsideMain = [...document.querySelectorAll('header')].filter((element) => !element.closest('main'))
        expect(outsideMain).toHaveLength(0)
        expect(screen.queryByRole('link', { name: 'ウェブアプリ' })).not.toBeInTheDocument()
    })

    it('いま開いているページの項目を現在地にする', async () => {
        renderApp('/map')

        await waitFor(() => expect(navLink('マップ')).toHaveAttribute('aria-current', 'page'))
        expect(navLink('ホーム')).not.toHaveAttribute('aria-current')
    })

    it('個別ページ（/news/1）でも、元の項目を現在地にする', async () => {
        renderApp('/news/1')

        await waitFor(() => expect(navLink('お知らせ')).toHaveAttribute('aria-current', 'page'))
    })

    it('ホームは、パスがちょうど一致するときだけ現在地にする', async () => {
        renderApp('/news')

        await waitFor(() => expect(navLink('お知らせ')).toHaveAttribute('aria-current', 'page'))
        expect(navLink('ホーム')).not.toHaveAttribute('aria-current')
    })

    it('項目が1つも無いときは、ナビ自体を出さない', async () => {
        server.use(http.get(`${API}/api/bottom-navs`, () => HttpResponse.json({ items: [] })))

        renderApp('/')

        // ページの中身が出そろってもナビは無い
        await screen.findByRole('heading', { level: 1 })
        expect(screen.queryByRole('navigation', { name: 'メインメニュー' })).not.toBeInTheDocument()
    })

    it('項目の取得に失敗したときも、ナビを出さずにページは表示する', async () => {
        server.use(http.get(`${API}/api/bottom-navs`, () => HttpResponse.json({ error: {} }, { status: 500 })))

        renderApp('/')

        await screen.findByRole('heading', { level: 1 })
        expect(screen.queryByRole('navigation', { name: 'メインメニュー' })).not.toBeInTheDocument()
    })

    it('定義に無いアイコン名でも、ラベルと移動先はそのまま出す', async () => {
        server.use(
            http.get(`${API}/api/bottom-navs`, () =>
                HttpResponse.json({
                    items: [
                        {
                            id: '7a8b9c0d-1e2f-4a3b-8c4d-00000000000a',
                            label: 'お知らせ',
                            icon: 'NotARealIcon',
                            href: '/news',
                            sort_order: 0,
                        },
                    ],
                }),
            ),
        )

        renderApp('/')

        expect(await screen.findByRole('link', { name: 'お知らせ' })).toHaveAttribute('href', '/news')
    })

    it('ログインのページでは出さない', async () => {
        mockSession(null)

        renderApp('/login')

        expect(await screen.findByRole('button', { name: 'ログイン' })).toBeInTheDocument()
        expect(screen.queryByRole('navigation', { name: 'メインメニュー' })).not.toBeInTheDocument()
    })
})
