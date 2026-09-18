import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { IdListCheckboxes } from './IdListCheckboxes'
import { SwitchField } from './SwitchField'

const options = [
    { id: 'stage', name: 'ステージ' },
    { id: 'shop', name: '模擬店' },
    { id: 'eve', name: '前夜祭' },
]

describe('IdListCheckboxes', () => {
    it('見出しと選べるものを出し、選んでいるものにチェックを付ける', () => {
        render(
            <IdListCheckboxes
                legend='タブに出すタグ'
                options={options}
                value='shop'
                onChange={vi.fn()}
                idPrefix='news-list-tag'
            />,
        )

        expect(screen.getByRole('group', { name: 'タブに出すタグ' })).toBeInTheDocument()
        expect(screen.getByRole('checkbox', { name: '模擬店' })).toBeChecked()
        expect(screen.getByRole('checkbox', { name: 'ステージ' })).not.toBeChecked()
    })

    it('チェックを付けると、選べるものの並び順にそろえた ID をカンマ区切りで渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(
            <IdListCheckboxes
                legend='タブに出すタグ'
                options={options}
                value='eve'
                onChange={onChange}
                idPrefix='news-list-tag'
            />,
        )

        await user.click(screen.getByRole('checkbox', { name: 'ステージ' }))

        expect(onChange).toHaveBeenCalledWith('stage,eve')
    })

    it('チェックを外すと、その ID だけを取り除いて渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(
            <IdListCheckboxes
                legend='タブに出すタグ'
                options={options}
                value='stage,shop'
                onChange={onChange}
                idPrefix='news-list-tag'
            />,
        )

        await user.click(screen.getByRole('checkbox', { name: 'ステージ' }))

        expect(onChange).toHaveBeenCalledWith('shop')
    })

    it('`disabled` のときは操作できない', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(
            <IdListCheckboxes
                legend='タブに出すタグ'
                options={options}
                value=''
                onChange={onChange}
                idPrefix='news-list-tag'
                disabled
            />,
        )

        await user.click(screen.getByRole('checkbox', { name: 'ステージ' }))

        expect(screen.getByRole('checkbox', { name: 'ステージ' })).toBeDisabled()
        expect(onChange).not.toHaveBeenCalled()
    })
})

describe('SwitchField', () => {
    it('ラベルとスイッチを出し、切り替えると新しい状態を渡す', async () => {
        const user = userEvent.setup()
        const onCheckedChange = vi.fn()
        render(
            <SwitchField
                id='news-list-show-tag-tabs'
                label='タグタブを出す'
                checked={false}
                onCheckedChange={onCheckedChange}
            />,
        )

        await user.click(screen.getByRole('switch', { name: 'タグタブを出す' }))

        expect(onCheckedChange).toHaveBeenCalledWith(true)
    })
})
