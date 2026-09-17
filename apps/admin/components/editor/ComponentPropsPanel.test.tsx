import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ComponentPropsPanel, isComponentBlock } from './ComponentPropsPanel'

describe('isComponentBlock', () => {
    it('独自コンポーネントのブロックだけを true にする', () => {
        expect(isComponentBlock({ type: 'pageHeader' })).toBe(true)
        expect(isComponentBlock({ type: 'paragraph' })).toBe(false)
    })
})

describe('ComponentPropsPanel（ページ見出し）', () => {
    const block = { id: '1', type: 'pageHeader', props: { label: 'NEWS', title: 'お知らせ' } } as const

    it('コンポーネント名と、ブロックの props を初期値にした入力欄を出す', () => {
        render(<ComponentPropsPanel block={block} onChange={vi.fn()} />)

        expect(screen.getByRole('complementary', { name: 'コンポーネントの設定' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'ページ見出し' })).toBeInTheDocument()
        expect(screen.getByLabelText('英語ラベル')).toHaveValue('NEWS')
        expect(screen.getByLabelText('日本語タイトル')).toHaveValue('お知らせ')
    })

    it('入力するたびに props を渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ComponentPropsPanel block={block} onChange={onChange} />)

        await user.clear(screen.getByLabelText('日本語タイトル'))
        await user.type(screen.getByLabelText('日本語タイトル'), 'ブログ')

        expect(onChange).toHaveBeenLastCalledWith({ label: 'NEWS', title: 'ブログ' })
    })

    it('文字数を超えたら入力欄の下にエラーを出し、props を渡さない', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(
            <ComponentPropsPanel
                block={{ ...block, props: { label: 'A'.repeat(30), title: 'あ'.repeat(50) } }}
                onChange={onChange}
            />,
        )

        await user.type(screen.getByLabelText('英語ラベル'), 'B')
        expect(await screen.findByText('英語ラベルは30文字以内で入力してください')).toBeInTheDocument()
        expect(screen.getByLabelText('英語ラベル')).toHaveAttribute('aria-invalid', 'true')

        await user.type(screen.getByLabelText('日本語タイトル'), 'い')
        expect(await screen.findByText('日本語タイトルは50文字以内で入力してください')).toBeInTheDocument()

        expect(onChange).not.toHaveBeenCalled()
    })
})
