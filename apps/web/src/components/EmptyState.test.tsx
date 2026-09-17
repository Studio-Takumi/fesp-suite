import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
    it('見出し・説明・「再読み込み」ボタンを出し、ボタンを押すと onRetry を呼ぶ', async () => {
        const user = userEvent.setup()
        const onRetry = vi.fn()
        render(<EmptyState title='お知らせはまだありません' description='説明の文言' onRetry={onRetry} />)

        expect(screen.getByRole('heading', { name: 'お知らせはまだありません' })).toBeInTheDocument()
        expect(screen.getByText('説明の文言')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: '再読み込み' }))

        expect(onRetry).toHaveBeenCalledOnce()
    })
})
