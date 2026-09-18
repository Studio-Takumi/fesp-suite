import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { blogListPropsSchema, parseBlogListTags } from '@fesp/schema'
import { cn } from '@fesp/ui'

import { BlogCard } from '~/components/blog/BlogCard'
import { EmptyState } from '~/components/EmptyState'
import { QueryBoundary } from '~/components/QueryBoundary'
import { blogsQuery, blogTagsQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/** 「すべて」のタブ */
const ALL_TAB = 'all'

/**
 * ブログ一覧（独自コンポーネント `blogList`）。タグのタブで絞り込み、ブログのカードを並べる。
 * 0件なら一覧の空状態を出す
 */
export function BlogList({ block, children }: BlockComponentProps) {
    // 記事は取得時に検証済みだが、型は `Record<string, unknown>` なのでここで props の型にする
    const props = blogListPropsSchema.safeParse(block.props)
    const blogs = useQuery(blogsQuery())
    const tags = useQuery(blogTagsQuery())
    const [selectedTab, setSelectedTab] = useState(ALL_TAB)

    if (!props.success) return <>{children}</>
    const { showTagTabs } = props.data
    const tagIds = parseBlogListTags(props.data.tags)

    return (
        <>
            <section aria-label='ブログ' className='flex flex-col gap-1'>
                <QueryBoundary
                    isPending={blogs.isPending || tags.isPending}
                    error={blogs.error ?? tags.error}
                    data={blogs.data && tags.data ? { posts: blogs.data, allTags: tags.data } : undefined}
                >
                    {({ posts, allTags }) => {
                        // 選んだタグは、タグの一覧にあるものだけをタブにする
                        const tabs = showTagTabs ? allTags.filter((tag) => tagIds.includes(tag.id)) : []
                        const visible =
                            selectedTab === ALL_TAB
                                ? posts
                                : posts.filter((post) => post.tags.some((tag) => tag.id === selectedTab))

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
                                        title='ブログはまだありません'
                                        description='記事が投稿されると、ここに表示されます。'
                                        onRetry={() => void blogs.refetch()}
                                    />
                                ) : (
                                    <ul className='flex flex-col gap-7 pt-5 pb-7'>
                                        {visible.map((post) => (
                                            <li key={post.id}>
                                                <BlogCard post={post} />
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
