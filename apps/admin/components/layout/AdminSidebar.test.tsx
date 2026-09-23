import { act } from 'react'

import type { Session } from '@supabase/supabase-js'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAdminUiStore } from '~/stores/ui'

import { SessionContext } from '../auth/session-context'
import { AdminSidebar } from './AdminSidebar'

let pathname = '/'
vi.mock('next/navigation', () => ({
    usePathname: () => pathname,
}))

const auth = vi.hoisted(() => ({ signOut: vi.fn() }))
vi.mock('~/lib/supabase', () => ({ supabase: { auth } }))

const session = { access_token: 'token', user: { id: 'user-id', email: 'takumi@example.com' } } as Session

function renderSignedIn() {
    return render(
        <SessionContext.Provider value={session}>
            <AdminSidebar />
        </SessionContext.Provider>,
    )
}

describe('AdminSidebar', () => {
    beforeEach(() => {
        pathname = '/'
        vi.clearAllMocks()
        auth.signOut.mockResolvedValue({ error: null })
        act(() => {
            useAdminUiStore.setState({ isSidebarOpen: true })
        })
    })

    it('ユーザー欄にログイン中のメールアドレスと、その先頭1文字を大文字で出す', () => {
        renderSignedIn()

        expect(screen.getByText('takumi@example.com')).toBeInTheDocument()
        expect(screen.getByText('T')).toBeInTheDocument()
    })

    it('ログアウトボタンで、この端末のセッションを終える', async () => {
        const user = userEvent.setup()
        renderSignedIn()

        await user.click(screen.getByRole('button', { name: 'ログアウト' }))

        expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
    })

    it('閉じているときはログアウトボタンだけを出す', () => {
        act(() => {
            useAdminUiStore.setState({ isSidebarOpen: false })
        })
        renderSignedIn()

        expect(screen.queryByText('takumi@example.com')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument()
    })

    it('メニュー項目をすべて表示する', () => {
        render(<AdminSidebar />)

        expect(screen.getByRole('link', { name: 'ダッシュボード' })).toBeInTheDocument()
        expect(screen.getByText('権限設定')).toBeInTheDocument()
        expect(screen.getAllByText('準備中')).toHaveLength(11)
    })

    it('下位項目（開催日・場所・タグ）は、親が準備中でもリンクとして出す', () => {
        render(<AdminSidebar />)

        expect(screen.getByRole('link', { name: '開催日' })).toHaveAttribute('href', '/schedule/event-days')
        expect(screen.getByRole('link', { name: '場所' })).toHaveAttribute('href', '/map/places')
        expect(screen.getByRole('link', { name: 'タグ' })).toHaveAttribute('href', '/news/tags')
        // 親は準備中のまま
        expect(screen.getByText('スケジュール').closest('div')).toHaveAttribute('aria-disabled', 'true')
    })

    it('下位項目は字下げして出す', () => {
        render(<AdminSidebar />)

        expect(screen.getByRole('link', { name: '開催日' }).className).toContain('pl-9')
        expect(screen.getByRole('link', { name: 'ダッシュボード' }).className).not.toContain('pl-9')
    })

    it('いま開いているページの項目をハイライトする', () => {
        render(<AdminSidebar />)

        expect(screen.getByRole('link', { name: 'ダッシュボード' })).toHaveAttribute('aria-current', 'page')
    })

    it('未実装ページの項目はリンクにならない（クリック不可）', () => {
        render(<AdminSidebar />)

        expect(screen.queryByRole('link', { name: /基本設定/ })).not.toBeInTheDocument()
        expect(screen.getByText('基本設定').closest('div')).toHaveAttribute('aria-disabled', 'true')
    })

    it('開閉ボタンでサイドメニューの開閉状態が切り替わる', async () => {
        const user = userEvent.setup()
        render(<AdminSidebar />)

        expect(screen.getByText('あおば高校 文化祭')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'サイドメニューを閉じる' }))

        expect(useAdminUiStore.getState().isSidebarOpen).toBe(false)
        expect(screen.queryByText('あおば高校 文化祭')).not.toBeInTheDocument()
    })
})
