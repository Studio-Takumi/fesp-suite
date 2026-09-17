import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { ScheduleDay } from '~/lib/mock/schedule'
import { scheduleQuery } from '~/lib/queries'

import { ScheduleTable } from './ScheduleTable'

const item = (id: string, title: string, date: string, startsAt: string, endsAt: string) => ({
    id,
    title,
    starts_at: `${date}T${startsAt}:00+09:00`,
    ends_at: `${date}T${endsAt}:00+09:00`,
})

const days: ScheduleDay[] = [
    {
        date: '2026-06-06',
        venues: [
            {
                id: 'gym',
                name: '体育館',
                items: [
                    item('1', 'オープニング', '2026-06-06', '08:30', '09:30'),
                    item('2', 'ギター部', '2026-06-06', '12:15', '13:00'),
                ],
            },
            { id: 'courtyard', name: '中庭', items: [item('3', 'クイズ大会', '2026-06-06', '13:00', '14:30')] },
        ],
    },
    {
        date: '2026-06-07',
        venues: [{ id: 'gym', name: '体育館', items: [item('4', '吹奏楽部', '2026-06-07', '10:00', '11:00')] }],
    },
]

/** `data` を入れておくと読み込み済みにする（再読み込みを押すまでは読み直さない） */
const renderScheduleTable = (showDateTabs: boolean, data?: ScheduleDay[]) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } },
    })
    if (data) queryClient.setQueryData(scheduleQuery().queryKey, data)

    return render(
        <QueryClientProvider client={queryClient}>
            <ScheduleTable block={{ id: '1', type: 'scheduleTable', props: { showDateTabs }, children: [] }} />
        </QueryClientProvider>,
    )
}

describe('ScheduleTable', () => {
    it('日付タブに Day・日付・曜日を出し、最初は1日目を選ぶ', () => {
        renderScheduleTable(true, days)

        const tabs = screen.getAllByRole('tab')
        expect(tabs.map((tab) => tab.textContent)).toEqual(['Day16/6(土)', 'Day26/7(日)'])
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
        expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
        expect(screen.getByText('オープニング')).toBeInTheDocument()
    })

    it('日付タブを押すと、その日のタイムテーブルに切り替える', async () => {
        const user = userEvent.setup()
        renderScheduleTable(true, days)

        await user.click(screen.getByRole('tab', { name: /6\/7/ }))

        expect(screen.getByRole('tab', { name: /6\/7/ })).toHaveAttribute('aria-selected', 'true')
        expect(screen.getByText('吹奏楽部')).toBeInTheDocument()
        expect(screen.queryByText('オープニング')).not.toBeInTheDocument()
        expect(screen.queryByRole('list', { name: '中庭' })).not.toBeInTheDocument()
    })

    it('日付タブを出さないときは、1日目のタイムテーブルを出す', () => {
        renderScheduleTable(false, days)

        expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
        expect(screen.getByText('オープニング')).toBeInTheDocument()
    })

    it('会場ヘッダーと、最も早い開始から最も遅い終了までの時刻を出す', () => {
        renderScheduleTable(true, days)

        expect(screen.getAllByText(/^(体育館|中庭)$/).map((element) => element.textContent)).toEqual(['体育館', '中庭'])
        expect(screen.getAllByText(/^\d+:00$/).map((element) => element.textContent)).toEqual([
            '8:00',
            '9:00',
            '10:00',
            '11:00',
            '12:00',
            '13:00',
            '14:00',
            '15:00',
        ])
    })

    it('項目を会場の列に、開始・終了の時刻に合わせた位置と高さで置く', () => {
        renderScheduleTable(true, days)

        const gym = within(screen.getByRole('list', { name: '体育館' })).getAllByRole('listitem')
        expect(gym.map((element) => element.textContent)).toEqual(['オープニング8:30-9:30', 'ギター部12:15-13:00'])
        // 8:00 を上端に、1時間 80px
        expect(gym[0]).toHaveStyle({ top: '40px', height: '80px' })
        expect(gym[1]).toHaveStyle({ top: '340px', height: '60px' })

        const courtyard = within(screen.getByRole('list', { name: '中庭' })).getByRole('listitem')
        expect(courtyard).toHaveTextContent('クイズ大会13:00-14:30')
        expect(courtyard).toHaveStyle({ top: '400px', height: '120px' })
        expect(within(courtyard).queryByRole('link')).not.toBeInTheDocument()
    })

    it('その日の項目が0件なら、日付タブを残して空状態を出し、再読み込みで読み込み直す', async () => {
        const user = userEvent.setup()
        renderScheduleTable(true, [{ date: '2026-06-06', venues: [{ id: 'gym', name: '体育館', items: [] }] }])

        expect(screen.getByRole('tab', { name: /6\/6/ })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'スケジュールはまだありません' })).toBeInTheDocument()
        expect(screen.getByText('スケジュールが公開されると、ここに表示されます。')).toBeInTheDocument()
        expect(screen.queryByRole('list')).not.toBeInTheDocument()

        // 読み直すと仮データ（lib/mock/schedule.ts）が返る
        await user.click(screen.getByRole('button', { name: '再読み込み' }))
        expect(await screen.findByText('オープニング')).toBeInTheDocument()
    })

    it('日付が1つも無ければ、日付タブを出さずに空状態を出す', () => {
        renderScheduleTable(true, [])

        expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'スケジュールはまだありません' })).toBeInTheDocument()
    })

    it('読み込み中はスピナーを出し、読み込んだら仮データのタイムテーブルを出す', async () => {
        renderScheduleTable(true)

        expect(screen.getByLabelText('読み込み中')).toBeInTheDocument()
        expect(await screen.findByRole('list', { name: '体育館' })).toBeInTheDocument()
    })
})
