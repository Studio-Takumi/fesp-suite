import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Search } from 'lucide-react'

import { artistListPropsSchema, parseArtistListTags } from '@fesp/schema'
import { cn, dateFormatter } from '@fesp/ui'

import { ArtistCard } from '~/components/artist/ArtistCard'
import { type ArtistSort, filterArtists, sortArtists } from '~/components/artist/filter-artists'
import { EmptyState } from '~/components/EmptyState'
import { QueryBoundary } from '~/components/QueryBoundary'
import type { Artist } from '~/lib/mock/artist'
import { artistsQuery, artistTagsQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/** 「すべて」のタブ */
const ALL_TAB = 'all'

/**
 * 出演者一覧（独自コンポーネント `artistList`）。日付タブ・検索・並び替え・タグのタブで絞り込み、出演者のカードを並べる。
 * 0件なら一覧の空状態を出す
 */
export function ArtistList({ block, children }: BlockComponentProps) {
    // 記事は取得時に検証済みだが、型は `Record<string, unknown>` なのでここで props の型にする
    const props = artistListPropsSchema.safeParse(block.props)
    const artists = useQuery(artistsQuery())
    const tags = useQuery(artistTagsQuery())
    const [selectedDay, setSelectedDay] = useState<number | null>(null)
    const [keyword, setKeyword] = useState('')
    const [sort, setSort] = useState<ArtistSort>('performance')
    const [selectedTab, setSelectedTab] = useState(ALL_TAB)

    if (!props.success) return <>{children}</>
    const { showDateTabs, showSearch, showSort, showTagTabs } = props.data
    const tagIds = parseArtistListTags(props.data.tags)

    return (
        <>
            <section aria-label='出演者' className='flex flex-col gap-3'>
                <QueryBoundary
                    isPending={artists.isPending || tags.isPending}
                    error={artists.error ?? tags.error}
                    data={artists.data && tags.data ? { items: artists.data, allTags: tags.data } : undefined}
                >
                    {({ items, allTags }) => {
                        // 選んだタグは、タグの一覧にあるものだけをタブにする
                        const tabs = showTagTabs ? allTags.filter((tag) => tagIds.includes(tag.id)) : []
                        const visible = sortArtists(
                            filterArtists(items, {
                                day: showDateTabs ? selectedDay : null,
                                keyword: showSearch ? keyword : '',
                                tagId: selectedTab === ALL_TAB ? null : selectedTab,
                            }),
                            showSort ? sort : 'performance',
                        )

                        return (
                            <>
                                {showDateTabs && (
                                    <DateTabs
                                        artists={items}
                                        selectedDay={selectedDay}
                                        onSelect={(day) => setSelectedDay(day)}
                                    />
                                )}
                                {(showSearch || showSort) && (
                                    <div className='flex items-center gap-2'>
                                        {showSearch && (
                                            <div className='flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-slate-100 px-4'>
                                                <Search size={16} className='shrink-0 text-slate-400' aria-hidden />
                                                <input
                                                    type='search'
                                                    value={keyword}
                                                    onChange={(event) => setKeyword(event.target.value)}
                                                    placeholder='出演者・演目で検索'
                                                    aria-label='出演者・演目で検索'
                                                    className='min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400'
                                                />
                                            </div>
                                        )}
                                        {showSort && (
                                            <div className='relative flex h-9 shrink-0 items-center rounded-full bg-slate-100'>
                                                <select
                                                    value={sort}
                                                    onChange={(event) => setSort(event.target.value as ArtistSort)}
                                                    aria-label='並び替え'
                                                    className='appearance-none bg-transparent pr-9 pl-4 text-sm text-slate-700 outline-none'
                                                >
                                                    <option value='performance'>出演順</option>
                                                    <option value='name'>名前順</option>
                                                </select>
                                                <ChevronDown
                                                    size={16}
                                                    className='pointer-events-none absolute right-3 text-slate-500'
                                                    aria-hidden
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
                                            const isSelected = tab.id === selectedTab
                                            return (
                                                <button
                                                    key={tab.id}
                                                    type='button'
                                                    role='tab'
                                                    aria-selected={isSelected}
                                                    onClick={() => setSelectedTab(tab.id)}
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
                                        title='出演者はまだありません'
                                        description='出演者が公開されると、ここに表示されます。'
                                        onRetry={() => void artists.refetch()}
                                    />
                                ) : (
                                    <ul className='flex flex-col gap-6 pt-3'>
                                        {visible.map((artist) => (
                                            <li key={artist.id}>
                                                <ArtistCard artist={artist} />
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
    artists: Artist[]
    /** 選んでいる日。`null` なら「すべて」 */
    selectedDay: number | null
    onSelect: (day: number | null) => void
}

/** 「すべて」と、出演する日（古い順）のタブ */
function DateTabs({ artists, selectedDay, onSelect }: DateTabsProps) {
    const days = [...new Map(artists.map((artist) => [artist.day, artist.starts_at])).entries()]
        .map(([day, startsAt]) => ({ day, startsAt }))
        .sort((a, b) => a.day - b.day)

    return (
        <div role='tablist' aria-label='日付' className='flex gap-2 overflow-x-auto'>
            <button
                type='button'
                role='tab'
                aria-selected={selectedDay === null}
                onClick={() => onSelect(null)}
                className={cn(
                    'flex h-10 shrink-0 items-center rounded-full px-5 text-sm font-semibold',
                    selectedDay === null ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-900',
                )}
            >
                すべて
            </button>
            {days.map(({ day, startsAt }) => {
                const isSelected = day === selectedDay
                return (
                    <button
                        key={day}
                        type='button'
                        role='tab'
                        aria-selected={isSelected}
                        onClick={() => onSelect(day)}
                        className={cn(
                            'flex h-10 shrink-0 items-center gap-2 rounded-full px-4',
                            isSelected ? 'bg-sky-500' : 'bg-slate-100',
                        )}
                    >
                        <span
                            className={cn('font-en text-xs font-bold', isSelected ? 'text-white/80' : 'text-slate-400')}
                        >
                            Day{day}
                        </span>
                        <span className={cn('font-en text-lg font-bold', isSelected ? 'text-white' : 'text-slate-900')}>
                            {dateFormatter(startsAt, 'M/D')}
                        </span>
                        <span className={cn('text-xs', isSelected ? 'text-white/80' : 'text-slate-400')}>
                            {dateFormatter(startsAt, '(EEE)')}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
