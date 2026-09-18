import { render, screen } from '@testing-library/react'
import { MapIcon } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { ActionLink } from './ActionLink'
import { DayBadge } from './DayBadge'

describe('DayBadge', () => {
    it('開催日の順番を `Day1` の形で出し、渡された色のクラスを付ける', () => {
        render(<DayBadge day={2} className='bg-rose-400' />)

        const badge = screen.getByText('Day2')
        expect(badge).toHaveClass('bg-rose-400')
        expect(badge).toHaveClass('rounded-full')
    })
})

describe('ActionLink', () => {
    it('アイコンとラベルのリンクを出す。既定は水色の塗り', () => {
        render(
            <ActionLink href='/map' icon={<MapIcon size={18} aria-hidden />}>
                マップで見る
            </ActionLink>,
        )

        const link = screen.getByRole('link', { name: 'マップで見る' })
        expect(link).toHaveAttribute('href', '/map')
        expect(link).toHaveClass('bg-sky-500')
    })

    it('`secondary` はグレーの塗りにする', () => {
        render(
            <ActionLink href='/schedule' icon={<MapIcon size={18} aria-hidden />} variant='secondary'>
                スケジュールで見る
            </ActionLink>,
        )

        expect(screen.getByRole('link', { name: 'スケジュールで見る' })).toHaveClass('bg-slate-100')
    })
})
