import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderApp } from '~/test/render'
import { mockSession } from '~/test/supabase'

/** 下のナビゲーションバーの項目（ラベル → 現在地になったときの見た目） */
function navLink(label: string) {
    return within(screen.getByRole('navigation', { name: 'メインメニュー' })).getByRole('link', { name: label })
}

describe('下のナビゲーションバー', () => {
    it('4つの項目を出す', async () => {
        renderApp('/')

        const nav = await screen.findByRole('navigation', { name: 'メインメニュー' })

        expect(
            within(nav)
                .getAllByRole('link')
                .map((link) => link.textContent),
        ).toEqual(['ホーム', 'お知らせ', 'マップ', 'スケジュール'])
    })

    it('上のヘッダーは出さない', async () => {
        renderApp('/')

        await screen.findByRole('navigation', { name: 'メインメニュー' })

        expect(screen.queryByRole('banner')).not.toBeInTheDocument()
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

    it('ログインのページでは出さない', async () => {
        mockSession(null)

        renderApp('/login')

        expect(await screen.findByRole('button', { name: 'ログイン' })).toBeInTheDocument()
        expect(screen.queryByRole('navigation', { name: 'メインメニュー' })).not.toBeInTheDocument()
    })
})
