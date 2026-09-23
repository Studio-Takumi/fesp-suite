import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@fesp/types'

import { EventDayList } from './EventDayList'
import { PlaceList } from './PlaceList'
import { TagList } from './TagList'

const EVENT_ID = '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7'
const DAY_ID = '1d2e3f4a-5b6c-4d7e-8f9a-0b1c2d3e4f5a'
const DAY_ID_2 = '5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b'
const PLACE_ID = '3a4b5c6d-7e8f-4a9b-8c0d-1e2f3a4b5c6d'
const TAG_ID = '2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'

const adminFetch = vi.fn()

vi.mock('~/lib/env', () => ({ env: { NEXT_PUBLIC_EVENT_ID: '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7' } }))
vi.mock('~/lib/api', () => ({ adminFetch: (...args: unknown[]) => adminFetch(...args) }))

function renderWithQueryClient(ui: ReactNode) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const eventDay = {
    id: DAY_ID,
    event_id: EVENT_ID,
    day: 1,
    date: '2026-06-06',
    name: null,
    created_at: '2026-09-14T10:00:00+09:00',
    updated_at: '2026-09-14T10:00:00+09:00',
}

const place = {
    id: PLACE_ID,
    event_id: EVENT_ID,
    name: '特別教室A',
    building: '本校舎',
    floor: '3F',
    sort_order: 0,
    created_at: '2026-09-14T10:00:00+09:00',
    updated_at: '2026-09-14T10:00:00+09:00',
}

const tag = {
    id: TAG_ID,
    event_id: EVENT_ID,
    name: '食べ物',
    sort_order: 0,
    created_at: '2026-09-14T10:00:00+09:00',
    updated_at: '2026-09-14T10:00:00+09:00',
}

/** adminFetch の呼び出しのうち、パスとオプションだけを見る */
function callsTo(path: string) {
    return adminFetch.mock.calls.filter((call) => call[0] === path).map((call) => call[2])
}

beforeEach(() => {
    adminFetch.mockReset()
})

describe('EventDayList', () => {
    it('env のイベントの開催日を読み、何日目・日付・表示名を出す', async () => {
        adminFetch.mockResolvedValue({ items: [eventDay] })

        renderWithQueryClient(<EventDayList />)

        expect(await screen.findByText('1日目')).toBeInTheDocument()
        expect(screen.getByLabelText('1日目の日付')).toHaveValue('2026-06-06')
        // 表示名が未設定なら空で、プレースホルダに「N日目」を出す
        expect(screen.getByLabelText('1日目の表示名')).toHaveValue('')
        expect(screen.getByLabelText('1日目の表示名')).toHaveAttribute('placeholder', '1日目')
        expect(adminFetch).toHaveBeenCalledWith(
            `/api/event-days?event_id=${EVENT_ID}`,
            expect.anything(),
            expect.objectContaining({ authenticated: true }),
        )
    })

    it('0件なら「開催日がありません」と出す', async () => {
        adminFetch.mockResolvedValue({ items: [] })

        renderWithQueryClient(<EventDayList />)

        expect(await screen.findByText('開催日がありません')).toBeInTheDocument()
    })

    it('表示名を入れて離れると、その時点で保存する', async () => {
        adminFetch.mockResolvedValue({ items: [eventDay] })
        const user = userEvent.setup()

        renderWithQueryClient(<EventDayList />)
        const name = await screen.findByLabelText('1日目の表示名')
        await user.type(name, '前夜祭')
        await user.tab()

        await waitFor(() => expect(callsTo(`/api/event-days/${DAY_ID}`)).toHaveLength(1))
        expect(callsTo(`/api/event-days/${DAY_ID}`)[0]).toMatchObject({
            method: 'PUT',
            body: expect.objectContaining({ name: '前夜祭', date: '2026-06-06', day: 1 }),
        })
    })

    it('表示名を空のまま離れても保存しない', async () => {
        adminFetch.mockResolvedValue({ items: [eventDay] })
        const user = userEvent.setup()

        renderWithQueryClient(<EventDayList />)
        await user.click(await screen.findByLabelText('1日目の表示名'))
        await user.tab()

        expect(callsTo(`/api/event-days/${DAY_ID}`)).toHaveLength(0)
    })

    it('日付を入れて「追加」を押すと、day を最大 + 1 で作る', async () => {
        adminFetch.mockResolvedValue({ items: [eventDay] })
        const user = userEvent.setup()

        renderWithQueryClient(<EventDayList />)
        await screen.findByText('1日目')
        await user.type(screen.getByLabelText('追加する日付'), '2026-06-07')
        await user.click(screen.getByRole('button', { name: '追加' }))

        await waitFor(() => expect(callsTo('/api/event-days')).toHaveLength(1))
        expect(callsTo('/api/event-days')[0]).toMatchObject({
            method: 'POST',
            body: expect.objectContaining({ day: 2, date: '2026-06-07', name: null, event_id: EVENT_ID }),
        })
    })

    it('日付が空の間は「追加」を押せない', async () => {
        adminFetch.mockResolvedValue({ items: [] })

        renderWithQueryClient(<EventDayList />)

        expect(await screen.findByRole('button', { name: '追加' })).toBeDisabled()
    })

    it('消したら、後ろの行の day を1つずつ前へ詰める', async () => {
        const second = { ...eventDay, id: DAY_ID_2, day: 2, date: '2026-06-07' }
        adminFetch.mockResolvedValue({ items: [eventDay, second] })
        const user = userEvent.setup()

        renderWithQueryClient(<EventDayList />)
        await user.click(await screen.findByRole('button', { name: '1日目を削除' }))

        await waitFor(() => expect(callsTo(`/api/event-days/${DAY_ID}`)).toHaveLength(1))
        expect(callsTo(`/api/event-days/${DAY_ID}`)[0]).toMatchObject({ method: 'DELETE' })
        // 2日目が1日目になる
        await waitFor(() => expect(callsTo(`/api/event-days/${DAY_ID_2}`)).toHaveLength(1))
        expect(callsTo(`/api/event-days/${DAY_ID_2}`)[0]).toMatchObject({
            method: 'PUT',
            body: expect.objectContaining({ day: 1 }),
        })
    })

    it('参照されていて消せないときは、API のメッセージを出す', async () => {
        adminFetch.mockImplementation((_path: string, _schema: unknown, options?: { method?: string }) => {
            if (options?.method === 'DELETE') {
                return Promise.reject(
                    new ApiError(409, 'conflict', '模擬店・出演者・スケジュールで使われているため削除できません'),
                )
            }
            return Promise.resolve({ items: [eventDay] })
        })
        const user = userEvent.setup()

        renderWithQueryClient(<EventDayList />)
        await user.click(await screen.findByRole('button', { name: '1日目を削除' }))

        expect(await screen.findByRole('alert')).toHaveTextContent(
            '模擬店・出演者・スケジュールで使われているため削除できません',
        )
    })
})

describe('PlaceList', () => {
    it('場所を sort_order の順で出し、建物・階も編集できる', async () => {
        adminFetch.mockResolvedValue({ items: [place] })

        renderWithQueryClient(<PlaceList />)

        expect(await screen.findByLabelText('場所名')).toHaveValue('特別教室A')
        expect(screen.getByLabelText('建物')).toHaveValue('本校舎')
        expect(screen.getByLabelText('階')).toHaveValue('3F')
    })

    it('建物を空にして離れると、null で保存する', async () => {
        adminFetch.mockResolvedValue({ items: [place] })
        const user = userEvent.setup()

        renderWithQueryClient(<PlaceList />)
        await user.clear(await screen.findByLabelText('建物'))
        await user.tab()

        await waitFor(() => expect(callsTo(`/api/places/${PLACE_ID}`)).toHaveLength(1))
        expect(callsTo(`/api/places/${PLACE_ID}`)[0]).toMatchObject({
            method: 'PUT',
            body: expect.objectContaining({ building: null }),
        })
    })

    it('場所名を空にして離れても保存しない', async () => {
        adminFetch.mockResolvedValue({ items: [place] })
        const user = userEvent.setup()

        renderWithQueryClient(<PlaceList />)
        await user.clear(await screen.findByLabelText('場所名'))
        await user.tab()

        expect(callsTo(`/api/places/${PLACE_ID}`)).toHaveLength(0)
    })

    it('追加すると sort_order を最大 + 1 にする', async () => {
        adminFetch.mockResolvedValue({ items: [{ ...place, sort_order: 3 }] })
        const user = userEvent.setup()

        renderWithQueryClient(<PlaceList />)
        await user.type(await screen.findByLabelText('追加する場所名'), '視聴覚室')
        await user.click(screen.getByRole('button', { name: '追加' }))

        await waitFor(() => expect(callsTo('/api/places')).toHaveLength(1))
        expect(callsTo('/api/places')[0]).toMatchObject({
            method: 'POST',
            body: expect.objectContaining({ name: '視聴覚室', building: null, floor: null, sort_order: 4 }),
        })
    })

    it('0件なら「場所がありません」と出す', async () => {
        adminFetch.mockResolvedValue({ items: [] })

        renderWithQueryClient(<PlaceList />)

        expect(await screen.findByText('場所がありません')).toBeInTheDocument()
    })
})

describe('TagList', () => {
    it('タグを出し、名前を直すと保存する', async () => {
        adminFetch.mockResolvedValue({ items: [tag] })
        const user = userEvent.setup()

        renderWithQueryClient(<TagList />)
        const name = await screen.findByLabelText('タグ名')
        await user.clear(name)
        await user.type(name, '飲み物')
        await user.tab()

        await waitFor(() => expect(callsTo(`/api/tags/${TAG_ID}`)).toHaveLength(1))
        expect(callsTo(`/api/tags/${TAG_ID}`)[0]).toMatchObject({
            method: 'PUT',
            body: expect.objectContaining({ name: '飲み物' }),
        })
    })

    it('同じ名前のタグがあるときは、API のメッセージを出す', async () => {
        adminFetch.mockImplementation((_path: string, _schema: unknown, options?: { method?: string }) => {
            if (options?.method === 'POST') {
                return Promise.reject(new ApiError(409, 'conflict', '同じ名前のタグがすでにあります'))
            }
            return Promise.resolve({ items: [tag] })
        })
        const user = userEvent.setup()

        renderWithQueryClient(<TagList />)
        await user.type(await screen.findByLabelText('追加するタグ名'), '食べ物')
        await user.click(screen.getByRole('button', { name: '追加' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('同じ名前のタグがすでにあります')
    })

    it('0件なら「タグがありません」と出す', async () => {
        adminFetch.mockResolvedValue({ items: [] })

        renderWithQueryClient(<TagList />)

        expect(await screen.findByText('タグがありません')).toBeInTheDocument()
    })
})
