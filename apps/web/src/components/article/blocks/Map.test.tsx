import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Map } from './Map'

const renderMap = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    return render(
        <QueryClientProvider client={queryClient}>
            <Map block={{ id: '1', type: 'map', props: {}, children: [] }} />
        </QueryClientProvider>,
    )
}

const placeNames = () =>
    within(screen.getByRole('list', { name: '場所の一覧' }))
        .getAllByRole('listitem')
        .map((item) => within(item).getAllByRole('paragraph')[0]?.textContent)

describe('Map', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('検索バー・フロア切替・現在地ボタン・カテゴリのタブ・場所の一覧を出す', async () => {
        renderMap()

        expect(screen.getByRole('searchbox', { name: '場所・模擬店を検索' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '現在地' })).toBeInTheDocument()
        expect(await screen.findByRole('list', { name: '場所の一覧' })).toBeInTheDocument()
        expect(placeNames()).toContain('レモネードスタンド')
        expect(
            within(screen.getByRole('group', { name: 'カテゴリ' }))
                .getAllByRole('button')
                .map((button) => button.textContent),
        ).toEqual(['ホーム', '食べ物', '体験', 'ステージ'])
    })

    it('検索バーの文字で、名前・団体名・会場のどれかに含まれる場所に絞り込む', async () => {
        const user = userEvent.setup()
        renderMap()
        await screen.findByRole('list', { name: '場所の一覧' })

        await user.type(screen.getByRole('searchbox'), ' チュロス ')
        expect(placeNames()).toEqual(['チュロス'])

        await user.clear(screen.getByRole('searchbox'))
        await user.type(screen.getByRole('searchbox'), '中庭')
        expect(placeNames()).toEqual(['チュロス', 'たこ焼き'])

        await user.clear(screen.getByRole('searchbox'))
        await user.type(screen.getByRole('searchbox'), '3年2組')
        expect(placeNames()).toEqual(['射的横丁'])
    })

    it('カテゴリのタブで絞り込み、選んでいるタブをもう一度押すと選択を外す', async () => {
        const user = userEvent.setup()
        renderMap()
        await screen.findByRole('list', { name: '場所の一覧' })
        const allCount = placeNames().length

        const food = screen.getByRole('button', { name: '食べ物' })
        expect(food).toHaveAttribute('aria-pressed', 'false')

        await user.click(food)
        expect(food).toHaveAttribute('aria-pressed', 'true')
        expect(placeNames()).toEqual(['レモネードスタンド', 'チュロス', 'たこ焼き'])

        await user.click(screen.getByRole('button', { name: 'ステージ' }))
        expect(food).toHaveAttribute('aria-pressed', 'false')
        expect(placeNames()).toEqual(['軽音楽部ライブ'])

        await user.click(screen.getByRole('button', { name: 'ステージ' }))
        expect(placeNames()).toHaveLength(allCount)
    })

    it('検索バーの文字とカテゴリの両方に合う場所が無ければ、一覧の代わりに文言を出す', async () => {
        const user = userEvent.setup()
        renderMap()
        await screen.findByRole('list', { name: '場所の一覧' })

        await user.click(screen.getByRole('button', { name: 'ステージ' }))
        await user.type(screen.getByRole('searchbox'), 'チュロス')

        expect(screen.queryByRole('list', { name: '場所の一覧' })).not.toBeInTheDocument()
        expect(screen.getByText('該当する場所がありません')).toBeInTheDocument()
    })

    it('フロアは一番下の階を選んだ状態で始まり、押したフロアだけを選んだ状態にする', async () => {
        const user = userEvent.setup()
        renderMap()

        const floorGroup = await screen.findByRole('group', { name: 'フロア' })
        const floorButtons = within(floorGroup).getAllByRole('button')
        expect(floorButtons.map((button) => button.textContent)).toEqual(['3F', '2F', '1F'])
        expect(screen.getByRole('button', { name: '1F' })).toHaveAttribute('aria-pressed', 'true')

        await user.click(screen.getByRole('button', { name: '3F' }))
        expect(screen.getByRole('button', { name: '3F' })).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByRole('button', { name: '1F' })).toHaveAttribute('aria-pressed', 'false')
        expect(screen.getByRole('button', { name: '1F' })).toHaveClass('bg-white')
        expect(screen.getByRole('button', { name: '3F' })).toHaveClass('bg-sky-500')
    })

    it('ボトムシートはたたんだ状態で始まり、ハンドルのタップで開閉する', async () => {
        const user = userEvent.setup()
        renderMap()
        const sheet = screen.getByRole('region', { name: 'ボトムシート' })
        expect(sheet).toHaveAttribute('data-state', 'closed')

        await user.click(screen.getByRole('button', { name: '場所の一覧を開く' }))
        expect(sheet).toHaveAttribute('data-state', 'open')
        expect(screen.getByRole('button', { name: '場所の一覧をたたむ' })).toHaveAttribute('aria-expanded', 'true')

        await user.click(screen.getByRole('button', { name: '場所の一覧をたたむ' }))
        expect(sheet).toHaveAttribute('data-state', 'closed')
    })

    it('ハンドルのドラッグで指に合わせて動き、離したときに中間より上なら開き、下ならたたむ', () => {
        renderMap()
        const sheet = screen.getByRole('region', { name: 'ボトムシート' })
        const handle = screen.getByRole('button', { name: '場所の一覧を開く' })
        // シートの高さ 400px、たたんだときに見える高さ 100px（下げる距離 300px）
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            return { height: this === sheet ? 400 : 100 } as DOMRect
        })

        // 半分（150px）より少し上まで引き上げる → 開く
        fireEvent.pointerDown(handle, { pointerId: 1, clientY: 500 })
        fireEvent.pointerMove(handle, { pointerId: 1, clientY: 340 })
        expect(sheet.style.transform).toBe('translateY(140px)')
        fireEvent.pointerUp(handle, { pointerId: 1, clientY: 340 })
        fireEvent.click(handle)
        expect(sheet).toHaveAttribute('data-state', 'open')

        // 少しだけ下げる（中間より上）→ 開いたまま
        fireEvent.pointerDown(handle, { pointerId: 2, clientY: 300 })
        fireEvent.pointerMove(handle, { pointerId: 2, clientY: 400 })
        fireEvent.pointerUp(handle, { pointerId: 2, clientY: 400 })
        fireEvent.click(handle)
        expect(sheet).toHaveAttribute('data-state', 'open')

        // 中間より下まで下げる → たたむ。下げる距離より先には動かない
        fireEvent.pointerDown(handle, { pointerId: 3, clientY: 300 })
        fireEvent.pointerMove(handle, { pointerId: 3, clientY: 900 })
        expect(sheet.style.transform).toBe('translateY(300px)')
        fireEvent.pointerUp(handle, { pointerId: 3, clientY: 900 })
        fireEvent.click(handle)
        expect(sheet).toHaveAttribute('data-state', 'closed')
    })
})
