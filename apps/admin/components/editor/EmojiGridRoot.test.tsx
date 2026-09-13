import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EmojiGridRoot } from './EmojiGridRoot'

describe('EmojiGridRoot', () => {
    it('一定の高さで打ち切ってスクロールさせる（Notionにならう）', () => {
        render(
            <EmojiGridRoot id='emoji-grid' columns={9}>
                <div>😀</div>
            </EmojiGridRoot>,
        )

        const root = screen.getByRole('grid')
        expect(root).toHaveClass('max-h-80')
        expect(root).toHaveClass('overflow-y-auto')
        expect(screen.getByText('😀')).toBeInTheDocument()
    })
})
