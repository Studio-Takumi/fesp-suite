import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Search } from 'lucide-react'

import { parseShopListTags, shopListPropsSchema } from '@fesp/schema'
import { cn, dateFormatter } from '@fesp/ui'

import { EmptyState } from '~/components/EmptyState'
import { QueryBoundary } from '~/components/QueryBoundary'
import { filterShops, type ShopSort, shopSortOptions, sortShops } from '~/components/shop/filter-shops'
import { ShopCard } from '~/components/shop/ShopCard'
import type { ShopDay } from '~/lib/mock/shop'
import { shopDaysQuery, shopsQuery, shopTagsQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/** 「すべて」のタブ */
const ALL_TAB = 'all'

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
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState<ShopSort>('recommended')

    if (!props.success) return <>{children}</>
    const { showDateTabs, showSearch, showSort, showTagTabs, showProducts } = props.data
    const tagIds = parseShopListTags(props.data.tags)

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
                        const day = showDateTabs && selectedDay !== ALL_TAB ? Number(selectedDay) : null
                        const tagId = tabs.length > 0 && selectedTag !== ALL_TAB ? selectedTag : null
                        const filtered = filterShops(items, { day, tagId, query: showSearch ? query : '' })
                        const visible = sortShops(filtered, showSort ? sort : 'recommended')

                        return (
                            <>
                                {showDateTabs && allDays.length > 0 && (
                                    <DateTabs days={allDays} selected={selectedDay} onSelect={setSelectedDay} />
                                )}
                                {(showSearch || showSort) && (
                                    <div className='flex items-center gap-2'>
                                        {showSearch && (
                                            <div className='flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-slate-100 px-4'>
                                                <Search size={16} aria-hidden className='shrink-0 text-slate-400' />
                                                <input
                                                    type='search'
                                                    value={query}
                                                    onChange={(event) => setQuery(event.target.value)}
                                                    placeholder='店名・商品で検索'
                                                    aria-label='店名・商品で検索'
                                                    className='min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400'
                                                />
                                            </div>
                                        )}
                                        {showSort && (
                                            <div className='relative flex h-9 shrink-0 items-center rounded-full bg-slate-100'>
                                                <select
                                                    value={sort}
                                                    onChange={(event) => setSort(event.target.value as ShopSort)}
                                                    aria-label='並び替え'
                                                    className='appearance-none bg-transparent py-2 pr-9 pl-4 text-sm text-slate-700 outline-none'
                                                >
                                                    {shopSortOptions.map((option) => (
                                                        <option key={option.id} value={option.id}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown
                                                    size={16}
                                                    aria-hidden
                                                    className='pointer-events-none absolute right-3 text-slate-500'
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                                {tabs.length > 0 && (
                                    <div
                                        role='tablist'
                                        aria-label='タグ'
                                        className='flex gap-5 overflow-x-auto border-b border-slate-200'
                                    >
                                        {[{ id: ALL_TAB, name: 'すべて' }, ...tabs].map((tab) => {
                                            const isSelected = tab.id === selectedTag
                                            return (
                                                <button
                                                    key={tab.id}
                                                    type='button'
                                                    role='tab'
                                                    aria-selected={isSelected}
                                                    onClick={() => setSelectedTag(tab.id)}
                                                    className={cn(
                                                        '-mb-px shrink-0 border-b-2 px-1 py-2 text-sm whitespace-nowrap',
                                                        isSelected
                                                            ? 'border-sky-500 font-bold text-slate-900'
                                                            : 'border-transparent text-slate-500',
                                                    )}
                                                >
                                                    {tab.name}
                                                </button>
                                            )
                                        })}
                                    </div>
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

type DateTabsProps = {
    days: ShopDay[]
    /** 選んでいる開催日。「すべて」を選んでいれば `all` */
    selected: string
    onSelect: (value: string) => void
}

function DateTabs({ days, selected, onSelect }: DateTabsProps) {
    return (
        <div role='tablist' aria-label='日付' className='flex gap-2 overflow-x-auto'>
            <button
                type='button'
                role='tab'
                aria-selected={selected === ALL_TAB}
                onClick={() => onSelect(ALL_TAB)}
                className={cn(
                    'shrink-0 rounded-full px-5 py-2 text-sm font-semibold',
                    selected === ALL_TAB ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-900',
                )}
            >
                すべて
            </button>
            {days.map(({ day, date }) => {
                const isSelected = selected === String(day)
                return (
                    <button
                        key={day}
                        type='button'
                        role='tab'
                        aria-selected={isSelected}
                        onClick={() => onSelect(String(day))}
                        className={cn(
                            'flex shrink-0 items-baseline gap-2 rounded-full px-4 py-2',
                            isSelected ? 'bg-sky-500' : 'bg-slate-100',
                        )}
                    >
                        <span className={cn('text-xs font-bold', isSelected ? 'text-white/80' : 'text-slate-400')}>
                            Day{day}
                        </span>
                        <span className={cn('text-lg font-bold', isSelected ? 'text-white' : 'text-slate-900')}>
                            {dateFormatter(date, 'M/D')}
                        </span>
                        <span className={cn('text-xs', isSelected ? 'text-white/80' : 'text-slate-400')}>
                            {dateFormatter(date, '(EEE)')}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
