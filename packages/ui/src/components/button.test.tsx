import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './button'

describe('Button', () => {
    it('子要素を描画し、既定で type=button になる', () => {
        render(<Button>保存する</Button>)
        const button = screen.getByRole('button', { name: '保存する' })
        expect(button).toBeInTheDocument()
        expect(button).toHaveAttribute('type', 'button')
    })

    it('クリックで onClick が呼ばれる', async () => {
        const onClick = vi.fn()
        render(<Button onClick={onClick}>送信</Button>)
        await userEvent.click(screen.getByRole('button', { name: '送信' }))
        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('disabled のときはクリックされない', async () => {
        const onClick = vi.fn()
        render(
            <Button disabled onClick={onClick}>
                送信
            </Button>,
        )
        await userEvent.click(screen.getByRole('button', { name: '送信' }))
        expect(onClick).not.toHaveBeenCalled()
    })

    it('variant/size に応じたクラスが付く', () => {
        render(
            <Button variant='destructive' size='lg'>
                削除
            </Button>,
        )
        expect(screen.getByRole('button', { name: '削除' })).toHaveClass('bg-destructive')
    })
})
