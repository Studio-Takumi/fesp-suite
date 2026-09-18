import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MainHeroPropsForm } from './MainHeroPropsForm'

describe('MainHeroPropsForm', () => {
    it('1行1枚の props をスライドごとの入力欄にする', () => {
        render(
            <MainHeroPropsForm
                defaultValues={{
                    slides: ['https://example.com/1.jpg|第42回 あおば祭|ようこそ', 'https://example.com/2.jpg||'].join(
                        '\n',
                    ),
                }}
                onValidChange={vi.fn()}
            />,
        )

        expect(screen.getAllByRole('group')).toHaveLength(2)
        expect(within(screen.getByRole('group', { name: '2枚目' })).getByLabelText('画像の URL')).toHaveValue(
            'https://example.com/2.jpg',
        )
    })

    it('スライドが無ければ入力欄を出さず、追加したスライドを埋めると props を渡す', async () => {
        const user = userEvent.setup()
        const onValidChange = vi.fn()
        render(<MainHeroPropsForm defaultValues={{ slides: '' }} onValidChange={onValidChange} />)

        expect(screen.queryByRole('group')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'スライドを追加' }))
        const slide = within(screen.getByRole('group', { name: '1枚目' }))
        await user.type(slide.getByLabelText('画像の URL'), 'https://example.com/1.jpg')
        await user.type(slide.getByLabelText('キャッチ'), '第42回 あおば祭')

        expect(onValidChange).toHaveBeenLastCalledWith({ slides: 'https://example.com/1.jpg|第42回 あおば祭|' })
    })
})
