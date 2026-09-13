import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ArticleEditor } from './article-editor'

describe('ArticleEditor', () => {
    it('本文エディタを表示する', async () => {
        render(<ArticleEditor />)

        expect(await screen.findByLabelText('本文エディタ')).toBeInTheDocument()
    })

    it('見出し2を切り替えると更新後のJSONに反映される', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ArticleEditor onChange={onChange} />)

        await screen.findByLabelText('本文エディタ')
        await user.click(screen.getByLabelText('見出し2'))

        await waitFor(() => {
            const [document] = onChange.mock.calls.at(-1) ?? []
            expect(document.content[0]).toEqual(expect.objectContaining({ type: 'heading', attrs: { level: 2 } }))
        })
    })

    it('未対応の見出しレベル（4以上）のボタンは出さない', async () => {
        render(<ArticleEditor />)

        await screen.findByLabelText('本文エディタ')
        expect(screen.queryByLabelText('見出し4')).not.toBeInTheDocument()
    })

    it('ツールバーボタンをクリックしても本文エディタのDOMフォーカスは失われない（ボタンに移らない）', async () => {
        const user = userEvent.setup()
        render(<ArticleEditor />)

        const editor = await screen.findByLabelText('本文エディタ')
        await user.click(editor)
        expect(document.activeElement).toBe(editor)

        await user.click(screen.getByLabelText('見出し2'))

        expect(document.activeElement).toBe(editor)
    })
})
