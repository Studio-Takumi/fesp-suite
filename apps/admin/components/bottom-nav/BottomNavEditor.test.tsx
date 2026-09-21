import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@fesp/types'

import { BottomNavEditor } from './BottomNavEditor'

const EVENT_ID = '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7'

const adminFetch = vi.fn()

vi.mock('~/lib/env', () => ({ env: { NEXT_PUBLIC_EVENT_ID: '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7' } }))
vi.mock('~/lib/api', () => ({ adminFetch: (...args: unknown[]) => adminFetch(...args) }))

function renderWithQueryClient(ui: ReactNode) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const items = [
    { id: '7a8b9c0d-1e2f-4a3b-8c4d-000000000001', label: 'ホーム', icon: 'House', href: '/', sort_order: 0 },
    { id: '7a8b9c0d-1e2f-4a3b-8c4d-000000000002', label: 'お知らせ', icon: 'Bell', href: '/news', sort_order: 1 },
]

/** 保存（PUT）の呼び出しだけを取り出す */
function saveCalls() {
    return adminFetch.mock.calls.filter((call) => call[2]?.method === 'PUT').map((call) => call[2].body)
}

beforeEach(() => {
    adminFetch.mockReset()
})

describe('BottomNavEditor', () => {
    it('env のイベントの項目を読み、名前・アイコン・移動先を出す', async () => {
        adminFetch.mockResolvedValue({ items })

        renderWithQueryClient(<BottomNavEditor />)

        expect(await screen.findByLabelText('1番目の名前')).toHaveValue('ホーム')
        expect(screen.getByLabelText('1番目の移動先')).toHaveValue('/')
        expect(screen.getByLabelText('2番目の名前')).toHaveValue('お知らせ')
        expect(adminFetch).toHaveBeenCalledWith(
            `/api/bottom-navs?event_id=${EVENT_ID}`,
            expect.anything(),
            expect.objectContaining({ authenticated: true }),
        )
    })

    it('0件なら、追加を促す文を出す', async () => {
        adminFetch.mockResolvedValue({ items: [] })

        renderWithQueryClient(<BottomNavEditor />)

        expect(
            await screen.findByText('項目がありません。追加するとウェブアプリの下にナビが出ます'),
        ).toBeInTheDocument()
    })

    it('編集しただけでは保存せず、「変更を保存」でまとめて送る', async () => {
        adminFetch.mockResolvedValue({ items })
        const user = userEvent.setup()

        renderWithQueryClient(<BottomNavEditor />)
        const label = await screen.findByLabelText('1番目の名前')
        await user.clear(label)
        await user.type(label, 'トップ')

        // 入力しただけでは送らない
        expect(saveCalls()).toHaveLength(0)

        await user.click(screen.getByRole('button', { name: '変更を保存' }))

        await waitFor(() => expect(saveCalls()).toHaveLength(1))
        expect(saveCalls()[0]).toEqual({
            event_id: EVENT_ID,
            items: [
                { label: 'トップ', icon: 'House', href: '/' },
                { label: 'お知らせ', icon: 'Bell', href: '/news' },
            ],
        })
    })

    it('変更していないときは「変更を保存」を押せない', async () => {
        adminFetch.mockResolvedValue({ items })

        renderWithQueryClient(<BottomNavEditor />)

        expect(await screen.findByRole('button', { name: '変更を保存' })).toBeDisabled()
    })

    it('入力が欠けている行があるときは「変更を保存」を押せない', async () => {
        adminFetch.mockResolvedValue({ items })
        const user = userEvent.setup()

        renderWithQueryClient(<BottomNavEditor />)
        await user.click(await screen.findByRole('button', { name: '項目を追加' }))

        // 足した行は空なので保存できない
        expect(screen.getByRole('button', { name: '変更を保存' })).toBeDisabled()
    })

    it('移動先が / で始まっていないときは、その行にエラーを出して保存させない', async () => {
        adminFetch.mockResolvedValue({ items })
        const user = userEvent.setup()

        renderWithQueryClient(<BottomNavEditor />)
        const href = await screen.findByLabelText('1番目の移動先')
        await user.clear(href)
        await user.type(href, 'news')

        expect(screen.getByText('移動先は / で始まるパスで入力してください')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '変更を保存' })).toBeDisabled()
    })

    it('行を消すと、保存で送る配列からも外れる', async () => {
        adminFetch.mockResolvedValue({ items })
        const user = userEvent.setup()

        renderWithQueryClient(<BottomNavEditor />)
        await user.click(await screen.findByRole('button', { name: '1番目を削除' }))
        await user.click(screen.getByRole('button', { name: '変更を保存' }))

        await waitFor(() => expect(saveCalls()).toHaveLength(1))
        expect(saveCalls()[0].items).toEqual([{ label: 'お知らせ', icon: 'Bell', href: '/news' }])
    })

    it('5件に達したら「項目を追加」を押せない', async () => {
        const five = Array.from({ length: 5 }, (_, index) => ({
            id: `7a8b9c0d-1e2f-4a3b-8c4d-00000000000${index}`,
            label: `項目${index}`,
            icon: 'Bell',
            href: `/p${index}`,
            sort_order: index,
        }))
        adminFetch.mockResolvedValue({ items: five })

        renderWithQueryClient(<BottomNavEditor />)

        expect(await screen.findByRole('button', { name: '項目を追加' })).toBeDisabled()
    })

    it('保存に失敗したら、API のメッセージを出す', async () => {
        adminFetch.mockImplementation((_path: string, _schema: unknown, options?: { method?: string }) => {
            if (options?.method === 'PUT') {
                return Promise.reject(new ApiError(403, 'forbidden', 'このイベントのナビを変更する権限がありません'))
            }
            return Promise.resolve({ items })
        })
        const user = userEvent.setup()

        renderWithQueryClient(<BottomNavEditor />)
        await user.click(await screen.findByRole('button', { name: '1番目を削除' }))
        await user.click(screen.getByRole('button', { name: '変更を保存' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('このイベントのナビを変更する権限がありません')
    })

    it('読み込みに失敗したら、編集させずに理由を出す', async () => {
        adminFetch.mockRejectedValue(new ApiError(500, 'internal_error', 'サーバー内部エラーが発生しました'))

        renderWithQueryClient(<BottomNavEditor />)

        expect(await screen.findByRole('alert')).toHaveTextContent('サーバー内部エラーが発生しました')
        expect(screen.queryByRole('button', { name: '項目を追加' })).not.toBeInTheDocument()
    })
})
