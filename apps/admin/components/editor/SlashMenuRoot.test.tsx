import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SlashMenuRoot } from './SlashMenuRoot'

describe('SlashMenuRoot', () => {
    it('一定の高さで打ち切ってスクロールさせる（Notionにならう）', () => {
        render(
            <SlashMenuRoot id='slash-menu'>
                <div>項目</div>
            </SlashMenuRoot>,
        )

        const root = screen.getByRole('listbox')
        expect(root).toHaveClass('max-h-80')
        expect(root).toHaveClass('overflow-y-auto')
        expect(screen.getByText('項目')).toBeInTheDocument()
    })
})
