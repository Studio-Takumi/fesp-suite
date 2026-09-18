import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ContentListPropsForm } from './ContentListPropsForm'

describe('ContentListPropsForm', () => {
    it('1行1件の props をリンクごとの入力欄にする', () => {
        render(
            <ContentListPropsForm
                defaultValues={{ links: ['スケジュール|calendar-days|/schedule', 'マップ|map|/map'].join('\n') }}
                onValidChange={vi.fn()}
            />,
        )

        expect(screen.getAllByRole('group')).toHaveLength(2)
        const second = within(screen.getByRole('group', { name: '2件目' }))
        expect(second.getByLabelText('表示名')).toHaveValue('マップ')
        expect(second.getByLabelText('アイコン')).toHaveTextContent('地図')
    })

    it('リンクが無ければ入力欄を出さず、追加したリンクを埋めると props を渡す', async () => {
        const user = userEvent.setup()
        const onValidChange = vi.fn()
        render(<ContentListPropsForm defaultValues={{ links: '' }} onValidChange={onValidChange} />)

        expect(screen.queryByRole('group')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'リンクを追加' }))
        const link = within(screen.getByRole('group', { name: '1件目' }))
        await user.type(link.getByLabelText('表示名'), 'スケジュール')
        await user.type(link.getByLabelText('リンク先'), '/schedule')

        expect(onValidChange).toHaveBeenLastCalledWith({ links: 'スケジュール|calendar-days|/schedule' })
    })
})
