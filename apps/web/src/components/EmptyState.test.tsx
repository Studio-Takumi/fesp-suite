import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
    it('見出し・説明と「再読み込み」ボタンを出し、押すと onRetry を呼ぶ', async () => {
        const user = userEvent.setup()
        const onRetry = vi.fn()
        render(<EmptyState title='お知らせはまだありません' description='ここに表示されます。' onRetry={onRetry} />)

        expect(screen.getByRole('heading', { name: 'お知らせはまだありません' })).toBeInTheDocument()
        expect(screen.getByText('ここに表示されます。')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: '再読み込み' }))
        expect(onRetry).toHaveBeenCalledOnce()
    })
})
