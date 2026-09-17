import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ScheduleTablePropsForm } from './ScheduleTablePropsForm'

describe('ScheduleTablePropsForm', () => {
    it('「日付タブを出す」のスイッチに初期値を反映する', () => {
        render(<ScheduleTablePropsForm defaultValues={{ showDateTabs: true }} onValidChange={vi.fn()} />)

        expect(screen.getByRole('switch', { name: '日付タブを出す' })).toBeChecked()
    })

    it('切り替えると、切り替えた値で onValidChange を呼ぶ', async () => {
        const user = userEvent.setup()
        const onValidChange = vi.fn()
        render(<ScheduleTablePropsForm defaultValues={{ showDateTabs: true }} onValidChange={onValidChange} />)

        await user.click(screen.getByRole('switch', { name: '日付タブを出す' }))

        expect(screen.getByRole('switch', { name: '日付タブを出す' })).not.toBeChecked()
        expect(onValidChange).toHaveBeenCalledExactlyOnceWith({ showDateTabs: false })
    })
})
