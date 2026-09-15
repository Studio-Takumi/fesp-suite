import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ExampleForm } from './ExampleForm'

describe('ExampleForm（共有zod + React Hook Form）', () => {
    it('未入力なら送信されず、エラーメッセージが出る', async () => {
        const onSubmit = vi.fn()
        render(<ExampleForm onSubmit={onSubmit} />)

        await userEvent.click(screen.getByRole('button', { name: '送信' }))

        expect(await screen.findAllByRole('alert')).not.toHaveLength(0)
        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('メールアドレスの形式を検証する', async () => {
        const onSubmit = vi.fn()
        render(<ExampleForm onSubmit={onSubmit} />)

        await userEvent.type(screen.getByLabelText('名前'), '山田')
        await userEvent.type(screen.getByLabelText('メールアドレス'), 'not-an-email')
        await userEvent.click(screen.getByRole('button', { name: '送信' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('メールアドレスの形式が正しくありません')
        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('正しい入力なら zod のパース結果（既定値込み）が渡る', async () => {
        const onSubmit = vi.fn()
        render(<ExampleForm onSubmit={onSubmit} />)

        await userEvent.type(screen.getByLabelText('名前'), '山田')
        await userEvent.type(screen.getByLabelText('メールアドレス'), 'yamada@example.com')
        await userEvent.click(screen.getByRole('button', { name: '送信' }))

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
        expect(onSubmit.mock.calls[0]?.[0]).toEqual({
            name: '山田',
            email: 'yamada@example.com',
            note: '',
        })
    })

    it('初期値を反映する', () => {
        render(<ExampleForm defaultValues={{ name: '既存の値' }} onSubmit={vi.fn()} />)
        expect(screen.getByLabelText('名前')).toHaveValue('既存の値')
    })
})
