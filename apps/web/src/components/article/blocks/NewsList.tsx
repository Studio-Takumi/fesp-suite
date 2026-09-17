import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'

import { newsListPropsSchema, parseNewsListTags } from '@fesp/schema'
import { cn } from '@fesp/ui'

import { EmptyState } from '~/components/EmptyState'
import { NewsRow } from '~/components/news/NewsRow'
import { QueryBoundary } from '~/components/QueryBoundary'
import { newsQuery, newsTagsQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/** 「すべて」のタブ */
const ALL_TAB = 'all'

/**
 * お知らせ一覧（独自コンポーネント `newsList`）。タグのタブで絞り込み、お知らせの行を並べる。
 * 0件なら一覧の空状態を出す
 */
export function NewsList({ block, children }: BlockComponentProps) {
    // 記事は取得時に検証済みだが、型は `Record<string, unknown>` なのでここで props の型にする
    const props = newsListPropsSchema.safeParse(block.props)
    const news = useQuery(newsQuery())
    const tags = useQuery(newsTagsQuery())
    const [selectedTab, setSelectedTab] = useState(ALL_TAB)

    if (!props.success) return <>{children}</>
    const { showTagTabs, limit, showViewAll } = props.data
    const tagIds = parseNewsListTags(props.data.tags)

    return (
        <>
            <section aria-label='お知らせ' className='flex flex-col gap-1'>
                <QueryBoundary
                    isPending={news.isPending || tags.isPending}
                    error={news.error ?? tags.error}
                    data={news.data && tags.data ? { posts: news.data, allTags: tags.data } : undefined}
                >
                    {({ posts, allTags }) => {
                        // 選んだタグは、タグの一覧にあるものだけをタブにする
                        const tabs = showTagTabs ? allTags.filter((tag) => tagIds.includes(tag.id)) : []
                        const filtered =
                            selectedTab === ALL_TAB
                                ? posts
                                : posts.filter((post) => post.tags.some((tag) => tag.id === selectedTab))
                        const visible = limit === undefined ? filtered : filtered.slice(0, limit)

                        return (
                            <>
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
                                        title='お知らせはまだありません'
                                        description='運営からのお知らせが投稿されると、ここに表示されます。'
                                        onRetry={() => void news.refetch()}
                                    />
                                ) : (
                                    <ul className='flex flex-col'>
                                        {visible.map((post) => (
                                            <li key={post.id}>
                                                <NewsRow post={post} />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )
                    }}
                </QueryBoundary>
                {showViewAll && (
                    <div className='flex justify-center pt-3'>
                        <a
                            href='/news'
                            className='inline-flex items-center gap-2 rounded-full bg-slate-50 px-8 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100'
                        >
                            すべて見る
                            <ChevronRight size={16} className='text-slate-400' aria-hidden />
                        </a>
                    </div>
                )}
            </section>
            {children}
        </>
    )
}
