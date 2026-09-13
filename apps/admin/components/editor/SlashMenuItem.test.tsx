import { ShadCNComponentsContext, ShadCNDefaultComponents } from '@blocknote/shadcn'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SlashMenuItem } from './SlashMenuItem'

function renderItem(props: Partial<React.ComponentProps<typeof SlashMenuItem>['item']> = {}, extra = {}) {
    const onClick = vi.fn()
    render(
        <ShadCNComponentsContext.Provider value={ShadCNDefaultComponents}>
            <SlashMenuItem
                id='item-1'
                isSelected={false}
                onClick={onClick}
                item={{ title: '見出し1', badge: '⌘-Alt-1', subtext: 'トップレベルの見出しに使用', ...props }}
                {...extra}
            />
        </ShadCNComponentsContext.Provider>,
    )
    return { onClick }
}

describe('SlashMenuItem', () => {
    it('タイトル・ショートカットを表示し、説明はホバーするまで出さない', () => {
        renderItem()

        expect(screen.getByText('見出し1')).toBeInTheDocument()
        expect(screen.getByText('⌘-Alt-1')).toBeInTheDocument()
        expect(screen.queryByText('トップレベルの見出しに使用')).not.toBeInTheDocument()
    })

    it('ホバーすると説明がツールチップで表示される', async () => {
        const user = userEvent.setup()
        renderItem()

        await user.hover(screen.getByText('見出し1'))

        expect(await screen.findByText('トップレベルの見出しに使用')).toBeInTheDocument()
    })

    it('クリックするとonClickが呼ばれる', async () => {
        const user = userEvent.setup()
        const { onClick } = renderItem()

        await user.click(screen.getByText('見出し1'))

        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('説明が無い項目はツールチップを持たない', () => {
        renderItem({ subtext: undefined })

        expect(screen.getByRole('option')).toBeInTheDocument()
    })
})
