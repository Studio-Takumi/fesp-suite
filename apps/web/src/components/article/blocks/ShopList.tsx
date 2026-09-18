import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { parseIdListProp, shopListPropsSchema } from '@fesp/schema'

import { EmptyState } from '~/components/EmptyState'
import { filterList, type ListSortDefinition, sortList } from '~/components/list/filter-list'
import { ListDateTabs } from '~/components/list/ListDateTabs'
import { ListSearch } from '~/components/list/ListSearch'
import { ListSort } from '~/components/list/ListSort'
import { ALL_TAB, ListTagTabs } from '~/components/list/ListTagTabs'
import { QueryBoundary } from '~/components/QueryBoundary'
import { ShopCard } from '~/components/shop/ShopCard'
import type { Shop } from '~/lib/mock/shop'
import { shopDaysQuery, shopsQuery, shopTagsQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/** 並び替えの選択肢。「おすすめ順」は読み込んだ順のまま */
const SORTS: ListSortDefinition<Shop>[] = [
    { id: 'recommended', label: 'おすすめ順' },
    { id: 'name', label: '名前順', compare: (a, b) => a.name.localeCompare(b.name, 'ja') },
]

/** 絞り込みに使う模擬店の値 */
const ACCESSORS = {
    day: (shop: Shop) => shop.day,
    tagIds: (shop: Shop) => [shop.tag_id],
    searchTexts: (shop: Shop) => [shop.name, shop.group, shop.location, ...shop.products.map(({ name }) => name)],
}

/**
 * 模擬店一覧（独自コンポーネント `shopList`）。日付タブ・検索・並び替え・タグのタブで絞り込み、模擬店のカードを並べる。
 * 0件なら一覧の空状態を出す
 */
export function ShopList({ block, children }: BlockComponentProps) {
    // 記事は取得時に検証済みだが、型は `Record<string, unknown>` なのでここで props の型にする
    const props = shopListPropsSchema.safeParse(block.props)
    const shops = useQuery(shopsQuery())
    const tags = useQuery(shopTagsQuery())
    const days = useQuery(shopDaysQuery())
    const [selectedDay, setSelectedDay] = useState(ALL_TAB)
    const [selectedTag, setSelectedTag] = useState(ALL_TAB)
    const [keyword, setKeyword] = useState('')
    const [sort, setSort] = useState(SORTS[0]!.id)

    if (!props.success) return <>{children}</>
    const { showDateTabs, showSearch, showSort, showTagTabs, showProducts } = props.data
    const tagIds = parseIdListProp(props.data.tags)

    return (
        <>
            <section aria-label='模擬店' className='flex flex-col gap-3'>
                <QueryBoundary
                    isPending={shops.isPending || tags.isPending || days.isPending}
                    error={shops.error ?? tags.error ?? days.error}
                    data={
                        shops.data && tags.data && days.data
                            ? { items: shops.data, allTags: tags.data, allDays: days.data }
                            : undefined
                    }
                >
                    {({ items, allTags, allDays }) => {
                        // 選んだタグは、タグの一覧にあるものだけをタブにする
                        const tabs = showTagTabs ? allTags.filter((tag) => tagIds.includes(tag.id)) : []
                        const visible = sortList(
                            filterList(
                                items,
                                {
                                    day: showDateTabs && selectedDay !== ALL_TAB ? Number(selectedDay) : null,
                                    tagId: tabs.length > 0 && selectedTag !== ALL_TAB ? selectedTag : null,
                                    keyword: showSearch ? keyword : '',
                                },
                                ACCESSORS,
                            ),
                            SORTS,
                            showSort ? sort : SORTS[0]!.id,
                        )

                        return (
                            <>
                                {showDateTabs && allDays.length > 0 && (
                                    <ListDateTabs days={allDays} selected={selectedDay} onSelect={setSelectedDay} />
                                )}
                                {(showSearch || showSort) && (
                                    <div className='flex items-center gap-2'>
                                        {showSearch && (
                                            <ListSearch
                                                value={keyword}
                                                onChange={setKeyword}
                                                placeholder='店名・商品で検索'
                                            />
                                        )}
                                        {showSort && <ListSort options={SORTS} value={sort} onChange={setSort} />}
                                    </div>
                                )}
                                {tabs.length > 0 && (
                                    <ListTagTabs tabs={tabs} selected={selectedTag} onSelect={setSelectedTag} />
                                )}
                                {visible.length === 0 ? (
                                    <EmptyState
                                        title='模擬店が見つかりません'
                                        description='条件に合う模擬店がありません。絞り込みを変えてお試しください。'
                                        onRetry={() => void shops.refetch()}
                                    />
                                ) : (
                                    <ul className='flex flex-col gap-6 py-3'>
                                        {visible.map((shop) => (
                                            <li key={shop.id}>
                                                <ShopCard shop={shop} showProducts={showProducts} />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )
                    }}
                </QueryBoundary>
            </section>
            {children}
        </>
    )
}
