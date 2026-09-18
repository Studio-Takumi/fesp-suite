import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render as rtlRender, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ArtistListPropsForm } from './ArtistListPropsForm'

// タグの queryOptions が lib/queries.ts を読むので、env と API クライアントを差し替える
vi.mock('~/lib/env', () => ({ env: { NEXT_PUBLIC_EVENT_ID: '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7' } }))
vi.mock('~/lib/api', () => ({ adminFetch: vi.fn() }))

/** タグの仮データを TanStack Query で読むので、QueryClient の中で描画する */
function render(ui: ReactNode) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const defaultValues = {
    showDateTabs: true,
    showSearch: true,
    showSort: false,
    showTagTabs: true,
    tags: '',
}

describe('ArtistListPropsForm', () => {
    it('スイッチに初期値を反映する', () => {
        render(<ArtistListPropsForm defaultValues={defaultValues} onValidChange={vi.fn()} />)

        expect(screen.getByRole('switch', { name: '日付タブを出す' })).toBeChecked()
        expect(screen.getByRole('switch', { name: '検索を出す' })).toBeChecked()
        expect(screen.getByRole('switch', { name: '並び替えを出す' })).not.toBeChecked()
        expect(screen.getByRole('switch', { name: 'タグタブを出す' })).toBeChecked()
    })

    it('切り替えると、切り替えた値で onValidChange を呼ぶ', async () => {
        const user = userEvent.setup()
        const onValidChange = vi.fn()
        render(<ArtistListPropsForm defaultValues={defaultValues} onValidChange={onValidChange} />)

        await user.click(screen.getByRole('switch', { name: '並び替えを出す' }))

        expect(screen.getByRole('switch', { name: '並び替えを出す' })).toBeChecked()
        expect(onValidChange).toHaveBeenCalledExactlyOnceWith({ ...defaultValues, showSort: true })
    })

    it('タグの一覧をチェックボックスで並べ、タグタブを出さない間は選べない', async () => {
        const user = userEvent.setup()
        render(<ArtistListPropsForm defaultValues={defaultValues} onValidChange={vi.fn()} />)

        const checkboxes = await screen.findAllByRole('checkbox')
        expect(checkboxes.map((checkbox) => checkbox.getAttribute('id'))).toEqual([
            'artist-list-tag-band',
            'artist-list-tag-dance',
            'artist-list-tag-performance',
            'artist-list-tag-volunteer',
        ])

        await user.click(screen.getByRole('switch', { name: 'タグタブを出す' }))

        for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).toBeDisabled()
    })
})
