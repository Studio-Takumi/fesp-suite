import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DateTabs } from './DateTabs'
import { filterList, type ListSortDefinition, sortList } from './filter-list'
import { ListSearch } from './ListSearch'
import { ListSort } from './ListSort'
import { ALL_TAB, ListTagTabs } from './ListTagTabs'

type Item = { name: string; day: number; tagIds: string[] }

const items: Item[] = [
    { name: 'たこ焼き', day: 1, tagIds: ['food'] },
    { name: 'ヨーヨー釣り', day: 2, tagIds: ['play'] },
    { name: 'チュロス', day: 2, tagIds: ['food'] },
]

const accessors = {
    day: (item: Item) => item.day,
    tagIds: (item: Item) => item.tagIds,
    searchTexts: (item: Item) => [item.name],
}

const names = (list: Item[]) => list.map((item) => item.name)

describe('filterList', () => {
    it('開催日・タグ・検索の文字のすべてに合うものだけを返す', () => {
        expect(names(filterList(items, { day: 2, tagId: null, keyword: '' }, accessors))).toEqual([
            'ヨーヨー釣り',
            'チュロス',
        ])
        expect(names(filterList(items, { day: null, tagId: 'food', keyword: '' }, accessors))).toEqual([
            'たこ焼き',
            'チュロス',
        ])
        expect(names(filterList(items, { day: 2, tagId: 'food', keyword: 'チュロ' }, accessors))).toEqual(['チュロス'])
    })

    it('条件が `null`・空文字ならその条件では絞り込まず、検索の文字は前後の空白を無視する', () => {
        expect(names(filterList(items, { day: null, tagId: null, keyword: '' }, accessors))).toEqual(names(items))
        expect(names(filterList(items, { day: null, tagId: null, keyword: '  たこ  ' }, accessors))).toEqual([
            'たこ焼き',
        ])
    })
})

describe('sortList', () => {
    const sorts: ListSortDefinition<Item>[] = [
        { id: 'default', label: '読み込んだ順' },
        { id: 'name', label: '名前順', compare: (a, b) => a.name.localeCompare(b.name, 'ja') },
    ]

    it('選んだ並び替えで並べ替え、`compare` の無い並び替えは読み込んだ順のままにする', () => {
        expect(names(sortList(items, sorts, 'name'))).toEqual(['たこ焼き', 'チュロス', 'ヨーヨー釣り'])
        expect(sortList(items, sorts, 'default')).toBe(items)
    })
})

describe('ListTagTabs', () => {
    it('先頭に「すべて」を出し、押すとそのタブの ID を渡す', async () => {
        const user = userEvent.setup()
        const onSelect = vi.fn()
        render(
            <ListTagTabs
                tabs={[
                    { id: 'food', name: 'グルメ' },
                    { id: 'play', name: '体験' },
                ]}
                selected={ALL_TAB}
                onSelect={onSelect}
            />,
        )

        const tabs = screen.getAllByRole('tab')
        expect(tabs.map((tab) => tab.textContent)).toEqual(['すべて', 'グルメ', '体験'])
        expect(screen.getByRole('tab', { name: 'すべて' })).toHaveAttribute('aria-selected', 'true')

        await user.click(screen.getByRole('tab', { name: '体験' }))

        expect(onSelect).toHaveBeenCalledWith('play')
    })
})

describe('DateTabs', () => {
    const days = [
        { day: 1, date: '2026-06-06T09:00:00+09:00' },
        { day: 2, date: '2026-06-07T09:00:00+09:00' },
    ]

    it('「すべて」と、Day・日付・曜日のタブを出し、押すと開催日の順番を渡す', async () => {
        const user = userEvent.setup()
        const onSelect = vi.fn()
        render(<DateTabs days={days} selected='1' onSelect={onSelect} showAll />)

        const tabs = screen.getAllByRole('tab')
        expect(within(tabs[1]!).getByText('Day1')).toBeInTheDocument()
        expect(within(tabs[1]!).getByText('6/6')).toBeInTheDocument()
        expect(within(tabs[1]!).getByText('(土)')).toBeInTheDocument()
        expect(tabs[1]).toHaveAttribute('aria-selected', 'true')

        await user.click(screen.getByRole('tab', { name: /Day2/ }))

        expect(onSelect).toHaveBeenCalledWith('2')
    })

    it('「すべて」を出さないときは、開催日のタブだけを出す', () => {
        render(<DateTabs days={days} selected='1' onSelect={vi.fn()} showAll={false} />)

        expect(screen.queryByRole('tab', { name: 'すべて' })).not.toBeInTheDocument()
        expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Day16/6(土)', 'Day26/7(日)'])
    })
})

describe('ListSearch', () => {
    it('プレースホルダを読み上げのラベルにも使い、入力するたびに文字を渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ListSearch value='' onChange={onChange} placeholder='店名・商品で検索' />)

        await user.type(screen.getByRole('searchbox', { name: '店名・商品で検索' }), 'た')

        expect(onChange).toHaveBeenLastCalledWith('た')
    })
})

describe('ListSort', () => {
    it('選択肢を出し、選ぶとその ID を渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(
            <ListSort
                options={[
                    { id: 'recommended', label: 'おすすめ順' },
                    { id: 'name', label: '名前順' },
                ]}
                value='recommended'
                onChange={onChange}
            />,
        )

        await user.selectOptions(screen.getByRole('combobox', { name: '並び替え' }), 'name')

        expect(onChange).toHaveBeenCalledWith('name')
    })
})
