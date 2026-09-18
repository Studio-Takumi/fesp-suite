import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render as rtlRender, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ProductListPropsForm } from './ProductListPropsForm'

// 商品の queryOptions が lib/queries.ts を読むので、env と API クライアントを差し替える
vi.mock('~/lib/env', () => ({ env: { NEXT_PUBLIC_EVENT_ID: '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7' } }))
vi.mock('~/lib/api', () => ({ adminFetch: vi.fn() }))

/** 商品の仮データを TanStack Query で読むので、QueryClient の中で描画する */
function render(ui: ReactNode) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('ProductListPropsForm', () => {
    it('商品のチェックボックスに初期値を反映する', async () => {
        render(<ProductListPropsForm defaultValues={{ products: 'product-2' }} onValidChange={vi.fn()} />)

        expect(await screen.findByRole('checkbox', { name: 'ピンクレモネード' })).toBeChecked()
        expect(screen.getByRole('checkbox', { name: 'レモンスカッシュ' })).not.toBeChecked()
    })

    it('選ぶと、商品の一覧の順に ID を並べて onValidChange を呼ぶ', async () => {
        const user = userEvent.setup()
        const onValidChange = vi.fn()
        render(<ProductListPropsForm defaultValues={{ products: 'product-2' }} onValidChange={onValidChange} />)

        await user.click(await screen.findByRole('checkbox', { name: 'レモンスカッシュ' }))

        expect(onValidChange).toHaveBeenCalledExactlyOnceWith({ products: 'product-2,product-4' })
    })

    it('選択を外すと、外した ID を除いて onValidChange を呼ぶ', async () => {
        const user = userEvent.setup()
        const onValidChange = vi.fn()
        render(<ProductListPropsForm defaultValues={{ products: 'product-2' }} onValidChange={onValidChange} />)

        await user.click(await screen.findByRole('checkbox', { name: 'ピンクレモネード' }))

        expect(onValidChange).toHaveBeenCalledExactlyOnceWith({ products: '' })
    })
})
