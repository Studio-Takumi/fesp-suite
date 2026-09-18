import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { artistListPropsSchema, parseIdListProp } from '@fesp/schema'

import { ArtistCard } from '~/components/artist/ArtistCard'
import { EmptyState } from '~/components/EmptyState'
import { filterList, type ListSortDefinition, sortList } from '~/components/list/filter-list'
import { ListDateTabs } from '~/components/list/ListDateTabs'
import { ListSearch } from '~/components/list/ListSearch'
import { ListSort } from '~/components/list/ListSort'
import { ALL_TAB, ListTagTabs } from '~/components/list/ListTagTabs'
import { QueryBoundary } from '~/components/QueryBoundary'
import type { Artist } from '~/lib/mock/artist'
import { artistsQuery, artistTagsQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/** 並び替えの選択肢。「出演順」は出演の早い順 */
const SORTS: ListSortDefinition<Artist>[] = [
    { id: 'performance', label: '出演順', compare: (a, b) => a.starts_at.localeCompare(b.starts_at) },
    { id: 'name', label: '名前順', compare: (a, b) => a.name.localeCompare(b.name, 'ja') },
]

/** 絞り込みに使う出演者の値 */
const ACCESSORS = {
    day: (artist: Artist) => artist.day,
    tagIds: (artist: Artist) => artist.tags.map((tag) => tag.id),
    searchTexts: (artist: Artist) => [artist.name, artist.program, artist.group],
}

/** 出演する日のタブ（古い順）。日ごとに、その日の出演者の出演日時から作る */
function performanceDays(artists: Artist[]) {
    return [...new Map(artists.map((artist) => [artist.day, artist.starts_at])).entries()]
        .map(([day, date]) => ({ day, date }))
        .sort((a, b) => a.day - b.day)
}

/**
 * 出演者一覧（独自コンポーネント `artistList`）。日付タブ・検索・並び替え・タグのタブで絞り込み、出演者のカードを並べる。
 * 0件なら一覧の空状態を出す
 */
export function ArtistList({ block, children }: BlockComponentProps) {
    // 記事は取得時に検証済みだが、型は `Record<string, unknown>` なのでここで props の型にする
    const props = artistListPropsSchema.safeParse(block.props)
    const artists = useQuery(artistsQuery())
    const tags = useQuery(artistTagsQuery())
    const [selectedDay, setSelectedDay] = useState(ALL_TAB)
    const [selectedTag, setSelectedTag] = useState(ALL_TAB)
    const [keyword, setKeyword] = useState('')
    const [sort, setSort] = useState(SORTS[0]!.id)

    if (!props.success) return <>{children}</>
    const { showDateTabs, showSearch, showSort, showTagTabs } = props.data
    const tagIds = parseIdListProp(props.data.tags)

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
                        const visible = sortList(
                            filterList(
                                items,
                                {
                                    day: showDateTabs && selectedDay !== ALL_TAB ? Number(selectedDay) : null,
                                    tagId: selectedTag === ALL_TAB ? null : selectedTag,
                                    keyword: showSearch ? keyword : '',
                                },
                                ACCESSORS,
                            ),
                            SORTS,
                            showSort ? sort : SORTS[0]!.id,
                        )

                        return (
                            <>
                                {showDateTabs && (
                                    <ListDateTabs
                                        days={performanceDays(items)}
                                        selected={selectedDay}
                                        onSelect={setSelectedDay}
                                    />
                                )}
                                {(showSearch || showSort) && (
                                    <div className='flex items-center gap-2'>
                                        {showSearch && (
                                            <ListSearch
                                                value={keyword}
                                                onChange={setKeyword}
                                                placeholder='出演者・演目で検索'
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
