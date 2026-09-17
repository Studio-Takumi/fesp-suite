import { render, screen } from '@testing-library/react'
import { PanelTop } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { ComponentBlockCard } from './ComponentBlockCard'

describe('ComponentBlockCard', () => {
    it('ヘッダーに名前と「設定」を出し、その下に中身を出す', () => {
        render(
            <ComponentBlockCard icon={<PanelTop className='size-3.5' />} name='ページ見出し' isSelected={false}>
                <p>中身</p>
            </ComponentBlockCard>,
        )

        expect(screen.getByText('ページ見出し')).toBeInTheDocument()
        expect(screen.getByText('設定')).toBeInTheDocument()
        expect(screen.getByText('中身')).toBeInTheDocument()
        expect(screen.getByText('中身').closest('[contenteditable="false"]')).not.toHaveAttribute('data-selected')
    })

    it('選択している間は「編集中」にし、水色の枠にする', () => {
        render(
            <ComponentBlockCard icon={<PanelTop className='size-3.5' />} name='ページ見出し' isSelected>
                <p>中身</p>
            </ComponentBlockCard>,
        )

        expect(screen.getByText('編集中')).toBeInTheDocument()
        expect(screen.queryByText('設定')).not.toBeInTheDocument()
        expect(screen.getByText('中身').closest('[contenteditable="false"]')).toHaveClass('border-sky-400')
    })
})
