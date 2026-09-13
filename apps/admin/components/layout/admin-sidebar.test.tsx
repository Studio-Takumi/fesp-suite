import { act } from 'react'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAdminUiStore } from '~/stores/ui'

import { AdminSidebar } from './admin-sidebar'

let pathname = '/'
vi.mock('next/navigation', () => ({
    usePathname: () => pathname,
}))

describe('AdminSidebar', () => {
    beforeEach(() => {
        pathname = '/'
        act(() => {
            useAdminUiStore.setState({ isSidebarOpen: true })
        })
    })

    it('メニュー項目をすべて表示する', () => {
        render(<AdminSidebar />)

        expect(screen.getByRole('link', { name: 'ダッシュボード' })).toBeInTheDocument()
        expect(screen.getByText('権限設定')).toBeInTheDocument()
        expect(screen.getAllByText('準備中')).toHaveLength(11)
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
